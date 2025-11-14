/**
 * Search 1.0 - Composite Scoring Algorithm
 * Combines text relevance, geo proximity, popularity, and freshness
 */

import { distance as geohashDistance } from '../geohash';

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  geohash6: string;
  distance_m?: number;
  clicks?: number;
  saves?: number;
  updated_at: Date;
}

export interface SearchOptions {
  query: string;
  userGeohash5: string;
  maxRadius?: number; // km
  limit?: number;
  lang?: string;
}

export interface ScoredResult extends SearchResult {
  score: number;
  scoreBreakdown: {
    textRelevance: number;
    geoProximity: number;
    popularity: number;
    ageDecay: number;
  };
}

/**
 * Main search scoring function
 * Formula: score = 0.5*BM25 + 0.3*GeoProximity + 0.2*Popularity - 0.1*AgeDecay
 */
export function scoreSearchResults(
  results: SearchResult[],
  options: SearchOptions
): ScoredResult[] {
  const scoredResults: ScoredResult[] = results.map((result) => {
    // 1. Text relevance (BM25 approximation)
    const textRelevance = calculateTextRelevance(result, options.query);

    // 2. Geo proximity (linear decay within radius)
    const geoProximity = calculateGeoProximity(
      result.geohash6.substring(0, 5), // Convert to geohash5
      options.userGeohash5,
      options.maxRadius || 5
    );

    // 3. Popularity (clicks + saves, normalized)
    const popularity = calculatePopularity(result.clicks || 0, result.saves || 0);

    // 4. Age decay (freshness penalty)
    const ageDecay = calculateAgeDecay(result.updated_at);

    // Composite score
    const score = 0.5 * textRelevance + 0.3 * geoProximity + 0.2 * popularity - 0.1 * ageDecay;

    return {
      ...result,
      score,
      scoreBreakdown: {
        textRelevance,
        geoProximity,
        popularity,
        ageDecay,
      },
    };
  });

  // Sort by score descending
  return scoredResults.sort((a, b) => b.score - a.score).slice(0, options.limit || 25);
}

/**
 * BM25-like text relevance scoring
 */
function calculateTextRelevance(result: SearchResult, query: string): number {
  const queryTokens = tokenize(query.toLowerCase());
  const nameTokens = tokenize(result.name.toLowerCase());
  const descTokens = result.description ? tokenize(result.description.toLowerCase()) : [];
  const tagTokens = result.tags?.map((t) => t.toLowerCase()) || [];

  let score = 0;
  const k1 = 1.5; // Term frequency saturation
  const b = 0.75; // Length normalization

  queryTokens.forEach((token) => {
    // Name matches (highest weight)
    const nameMatches = nameTokens.filter((t) => t.includes(token) || token.includes(t));
    score += nameMatches.length * 3;

    // Description matches
    const descMatches = descTokens.filter((t) => t.includes(token) || token.includes(t));
    score += descMatches.length * 1;

    // Tag matches
    const tagMatches = tagTokens.filter((t) => t.includes(token) || token.includes(t));
    score += tagMatches.length * 2;
  });

  // Normalize by document length
  const docLength = nameTokens.length + descTokens.length + tagTokens.length;
  const avgDocLength = 20; // Assumed average
  const normalized = score / (1 + b * (docLength / avgDocLength - 1));

  return Math.min(normalized / 10, 1); // Normalize to 0-1
}

/**
 * Geo proximity scoring (linear decay)
 */
function calculateGeoProximity(
  resultGeohash5: string,
  userGeohash5: string,
  maxRadius: number
): number {
  try {
    const distKm = geohashDistance(resultGeohash5, userGeohash5);

    if (distKm > maxRadius) return 0;

    // Linear decay: 1.0 at center, 0.0 at maxRadius
    return Math.max(0, 1 - distKm / maxRadius);
  } catch {
    return 0.5; // Fallback
  }
}

/**
 * Popularity scoring (clicks + saves, with diminishing returns)
 */
function calculatePopularity(clicks: number, saves: number): number {
  // Weighted sum with logarithmic scaling
  const clickScore = Math.log10(clicks + 1) / 3; // Diminishing returns
  const saveScore = Math.log10(saves + 1) / 2;

  const combined = clickScore + saveScore * 1.5; // Saves weighted higher
  return Math.min(combined, 1); // Normalize to 0-1
}

/**
 * Age decay scoring (freshness penalty)
 */
function calculateAgeDecay(updatedAt: Date): number {
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Exponential decay: fresh content = 0, old content = 1
  // Half-life of 30 days
  return Math.min(1 - Math.exp(-daysSinceUpdate / 30), 1);
}

/**
 * Simple tokenizer (replace with proper i18n tokenizer)
 */
function tokenize(text: string): string[] {
  return text
    .split(/[\s\-_.,;:!?()]+/)
    .filter((t) => t.length > 0)
    .map((t) => t.trim());
}

/**
 * Generate cache key for search results
 */
export function generateSearchCacheKey(options: SearchOptions): string {
  const { query, userGeohash5, maxRadius, lang } = options;
  return `search:${query}:${userGeohash5}:${maxRadius || 5}:${lang || 'ko'}:v1`;
}

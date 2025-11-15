// lib/search/ranking.ts

export type RankInput = {
  bm25: number;
  proximity: number;
  popularity: number;
  ageDecay: number;
};

/**
 * Search scoring formula: 0.5*BM25 + 0.3*GeoProximity + 0.2*Popularity - 0.1*AgeDecay
 * All inputs should be normalized to [0, 1]
 */
export function searchScore(r: RankInput): number {
  return 0.5 * r.bm25 + 0.3 * r.proximity + 0.2 * r.popularity - 0.1 * r.ageDecay;
}

/**
 * Calculate proximity score from distance in meters
 * Returns 1.0 at center, 0.0 at radius boundary, linear decay
 */
export function proximityFromMeters(distM: number, radiusM: number): number {
  if (distM <= 0) return 1;
  if (distM >= radiusM) return 0;
  return 1 - distM / radiusM;
}

/**
 * Normalize popularity score (0-100 scale to 0-1)
 */
export function normalizePopularity(popularity: number): number {
  return Math.min(1, Math.max(0, popularity / 100));
}

/**
 * Calculate age decay (newer = better)
 * @param createdAt - Date when place was created
 * @returns Decay factor 0-1 (0 = new, 1 = 1 year old)
 */
export function calculateAgeDecay(createdAt: Date): number {
  const ageDays = Math.max(0, (Date.now() - createdAt.getTime()) / 86400000);
  return Math.min(1, ageDays / 365);
}

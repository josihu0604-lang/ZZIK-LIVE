// lib/search/cache.ts

const map = new Map<string, { expires: number; payload: unknown }>();
const TTL = 60 * 1000; // 60 seconds - as per spec

export type SearchCacheKey = {
  q: string;
  geohash5: string;
  radius: number;
  lang: string;
  ver: string;
  limit: number;
};

/**
 * Generate cache key from search parameters
 */
export const searchKey = (q: SearchCacheKey): string =>
  `search:${q.q}|${q.geohash5}|${q.radius}|${q.lang}|${q.ver}|${q.limit}`;

/**
 * Get cached search results
 */
export const getCache = (k: string): unknown | null => {
  const v = map.get(k);
  if (!v) return null;
  if (Date.now() > v.expires) {
    map.delete(k);
    return null;
  }
  return v.payload;
};

/**
 * Set cached search results
 */
export const setCache = (k: string, payload: unknown, ttl = TTL): void => {
  map.set(k, { expires: Date.now() + ttl, payload });
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of map.entries()) {
    if (now > entry.expires) {
      map.delete(key);
    }
  }
};

// Auto-cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredCache, 60 * 1000);
}

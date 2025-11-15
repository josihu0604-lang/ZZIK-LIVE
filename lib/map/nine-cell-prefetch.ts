/**
 * 9-Cell Prefetch Strategy for Map View
 * Fetches center cell + 8 surrounding cells for smooth panning
 */

import { getNeighbors as _getNeighbors } from '../geohash';

export interface Cell {
  geohash6: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface PrefetchOptions {
  zoom: number;
  maxRadius?: number; // km
  cacheKey?: string;
}

/**
 * Get 9 cells (center + 8 neighbors) for prefetching
 */
export function getNineCells(centerGeohash6: string): string[] {
  // Get immediate neighbors (N, S, E, W, NE, NW, SE, SW)
  const neighbors = getNeighborsExtended(centerGeohash6);
  return [centerGeohash6, ...neighbors];
}

/**
 * Extended neighbor calculation (8 directions)
 */
function getNeighborsExtended(geohash6: string): string[] {
  // Simplified version - in production, use accurate geohash neighbor algorithm
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  const lastChar = geohash6[geohash6.length - 1];
  const parent = geohash6.slice(0, -1);
  const idx = base32.indexOf(lastChar);

  const neighbors: string[] = [];

  // North
  if (idx + 8 < base32.length) neighbors.push(parent + base32[idx + 8]);
  // South
  if (idx - 8 >= 0) neighbors.push(parent + base32[idx - 8]);
  // East
  if (idx + 1 < base32.length) neighbors.push(parent + base32[idx + 1]);
  // West
  if (idx - 1 >= 0) neighbors.push(parent + base32[idx - 1]);
  // NE
  if (idx + 9 < base32.length) neighbors.push(parent + base32[idx + 9]);
  // NW
  if (idx + 7 < base32.length && idx + 7 !== idx + 8) neighbors.push(parent + base32[idx + 7]);
  // SE
  if (idx - 7 >= 0) neighbors.push(parent + base32[idx - 7]);
  // SW
  if (idx - 9 >= 0) neighbors.push(parent + base32[idx - 9]);

  return neighbors;
}

/**
 * Prefetch data for 9 cells with caching
 */
export async function prefetchNineCells(
  centerGeohash6: string,
  options: PrefetchOptions
): Promise<Map<string, any>> {
  const cells = getNineCells(centerGeohash6);
  const cacheKey = options.cacheKey || 'map-data';

  // Check cache first
  const cache = await getCellCache(cacheKey);
  const results = new Map<string, any>();

  // Fetch missing cells
  const toFetch = cells.filter((cell) => !cache.has(cell));

  if (toFetch.length > 0) {
    // Parallel fetch
    const fetches = toFetch.map((cell) =>
      fetchCellData(cell, options).then((data) => ({ cell, data }))
    );

    const responses = await Promise.allSettled(fetches);

    responses.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { cell, data } = result.value;
        results.set(cell, data);
        // Update cache
        cache.set(cell, data);
      }
    });

    // Save cache (with TTL)
    await setCellCache(cacheKey, cache, 60); // 60s TTL
  }

  // Combine cached + fetched
  cells.forEach((cell) => {
    if (!results.has(cell) && cache.has(cell)) {
      results.set(cell, cache.get(cell));
    }
  });

  return results;
}

/**
 * Fetch data for a single cell
 */
async function fetchCellData(geohash6: string, options: PrefetchOptions): Promise<any> {
  const params = new URLSearchParams({
    geohash6,
    zoom: options.zoom.toString(),
    radius: (options.maxRadius || 5).toString(),
  });

  const response = await fetch(`/api/places/nearby?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cell ${geohash6}`);
  }

  return response.json();
}

/**
 * In-memory cache with TTL (replace with Redis in production)
 */
const memoryCache = new Map<string, { data: Map<string, any>; expires: number }>();

async function getCellCache(key: string): Promise<Map<string, any>> {
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return new Map(cached.data);
  }
  return new Map();
}

async function setCellCache(
  key: string,
  data: Map<string, any>,
  ttlSeconds: number
): Promise<void> {
  memoryCache.set(key, {
    data: new Map(data),
    expires: Date.now() + ttlSeconds * 1000,
  });

  // Cleanup old entries
  const now = Date.now();
  const entries = Array.from(memoryCache.entries());
  for (const [k, v] of entries) {
    if (v.expires < now) {
      memoryCache.delete(k);
    }
  }
}

/**
 * Throttle map events (pan/zoom)
 */
export function throttleMapEvent<T extends (...args: never[]) => void>(fn: T, ms: number = 100): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

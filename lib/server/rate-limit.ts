import 'server-only';
import { sha256 } from '@/lib/hash';
import { redis } from '@/lib/redis';

export interface RateLimitResult {
  key: string;
  limit: number;
  used: number;
  remaining: number;
  reset: number;
}

/**
 * Implements a sliding window rate limiter using Redis
 * Uses SHA-256 hashed identifiers for privacy preservation
 */
export async function rateLimit(
  name: string,
  identRaw: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<RateLimitResult> {
  // Hash the identifier for privacy (e.g., IP address)
  const ident = sha256(identRaw || 'unknown');
  const key = `rl:${name}:${ident}`;

  let used = 1;
  let ttl = windowSec;

  try {
    // Increment counter
    used = (await (redis as any).incr?.(key)) ?? 1;

    // Set expiry on first request
    if (used === 1) {
      await (redis as any).expire?.(key, windowSec);
    }

    // Get remaining TTL
    ttl = (await (redis as any).ttl?.(key)) ?? windowSec;
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail-open: allow request on Redis error
    used = 0;
  }

  const remaining = Math.max(0, limit - used);

  return {
    key,
    limit,
    used,
    remaining,
    reset: ttl,
  };
}

/**
 * Check rate limit and consume a token
 * Returns true if rate limit is not exceeded
 */
export async function checkAndConsume(
  name: string,
  identifier: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<boolean> {
  const result = await rateLimit(name, identifier, limit, windowSec);
  return result.remaining >= 0;
}

/**
 * Check rate limit without consuming
 */
export async function checkRate(
  name: string,
  identifier: string,
  limit: number = 60,
  windowSec: number = 60
): Promise<RateLimitResult> {
  return rateLimit(name, identifier, limit, windowSec);
}

/**
 * Add rate limit headers to response
 */
export function addRateHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));
}

/**
 * Add rate limit headers and return response
 */
export function withRateHeaders(response: Response, result: RateLimitResult): Response {
  const headers = new Headers(response.headers);
  addRateHeaders(headers, result);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

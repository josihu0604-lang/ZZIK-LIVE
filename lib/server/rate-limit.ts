import 'server-only';
import { redis } from './redis';

interface RateLimitResult {
  limit: number;
  remaining: number;
  used: number;
  reset: number;
}

/**
 * Apply rate limiting to a specific key
 * @param namespace - Namespace for the rate limit (e.g., 'wallet_redeem')
 * @param key - Unique key within the namespace (e.g., IP address, user ID)
 * @param limit - Maximum requests allowed (default: 60)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns Rate limit status
 */
export async function rateLimit(
  namespace: string,
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redisKey = `rl:${namespace}:${key}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const windowEnd = windowStart + windowSeconds;

  // Use Redis pipeline for atomic operations
  const pipe = redis.pipeline();
  
  // Increment the counter
  pipe.incr(redisKey);
  
  // Set expiry if key is new
  pipe.expire(redisKey, windowSeconds);
  
  // Execute pipeline
  const results = await pipe.exec();
  
  if (!results) {
    throw new Error('Rate limit check failed');
  }

  const count = results[0][1] as number;
  
  return {
    limit,
    remaining: Math.max(0, limit - count),
    used: count,
    reset: windowEnd
  };
}

/**
 * Check rate limit without incrementing
 */
export async function checkRateLimit(
  namespace: string,
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redisKey = `rl:${namespace}:${key}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const windowEnd = windowStart + windowSeconds;

  const count = await redis.get(redisKey);
  const used = count ? parseInt(count, 10) : 0;

  return {
    limit,
    remaining: Math.max(0, limit - used),
    used,
    reset: windowEnd
  };
}
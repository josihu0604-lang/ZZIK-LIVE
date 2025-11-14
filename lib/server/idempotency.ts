import 'server-only';
import { redis } from './redis';

interface IdempotencyResult<T> {
  replay: boolean;
  value: T;
}

/**
 * Execute a function with idempotency support using Redis as cache
 * @param key - Unique key for this idempotent operation
 * @param fn - Function to execute
 * @param ttlSeconds - TTL for cached result in seconds (default: 24 hours)
 * @returns Object with replay flag and cached/computed value
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 86400 // 24 hours default
): Promise<IdempotencyResult<T>> {
  // Check if we have a cached result
  const cached = await redis.get(`idem:${key}`);
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return {
        replay: true,
        value: parsed as T
      };
    } catch (e) {
      console.error('Failed to parse cached idempotency value:', e);
      // Continue to execute if cache parse fails
    }
  }

  // Execute the function
  const result = await fn();

  // Store the result with TTL
  try {
    await redis.setex(`idem:${key}`, ttlSeconds, JSON.stringify(result));
  } catch (e) {
    console.error('Failed to cache idempotency result:', e);
    // Continue even if caching fails
  }

  return {
    replay: false,
    value: result
  };
}

/**
 * Clear idempotency cache for a specific key
 */
export async function clearIdempotency(key: string): Promise<void> {
  await redis.del(`idem:${key}`);
}
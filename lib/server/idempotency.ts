import 'server-only';
import { redis } from '@/lib/redis';

export interface IdempotencyResult<T> {
  replay: boolean;
  value: T;
}

/**
 * Wraps an async function with idempotency protection
 * Ensures the same operation (identified by key) only executes once
 * within the TTL window, returning cached results on replay
 */
export async function withIdempotency<T>(
  key: string,
  exec: () => Promise<T>,
  ttlSec: number = 60 * 60 * 24 // 24 hours default
): Promise<IdempotencyResult<T>> {
  const cacheKey = `idem:${key}`;
  
  try {
    // Check for cached result
    const cached = await (redis as any).get?.(cacheKey);
    if (cached) {
      return { 
        replay: true, 
        value: JSON.parse(cached) as T 
      };
    }
  } catch (err) {
    console.error('Idempotency cache read error:', err);
    // Continue execution on cache read error (fail-open)
  }
  
  // Execute the function
  const value = await exec();
  
  try {
    // Cache the result
    await (redis as any).set?.(
      cacheKey, 
      JSON.stringify(value), 
      'EX', 
      ttlSec
    );
  } catch (err) {
    console.error('Idempotency cache write error:', err);
    // Continue anyway on cache write error (fail-open)
  }
  
  return { 
    replay: false, 
    value 
  };
}
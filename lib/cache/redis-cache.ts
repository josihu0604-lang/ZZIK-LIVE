/**
 * Redis Cache Layer for GPS and Directions API
 * Reduces API calls and improves response times
 */

import { Redis } from 'ioredis';

export interface CacheConfig {
  ttl?: number; // seconds
  prefix?: string;
  enableCompression?: boolean;
}

export interface DirectionsCache {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  distance: number;
  duration: number;
  route?: any;
  cached_at: number;
}

export class RedisCache {
  private client: Redis | null = null;
  private config: Required<CacheConfig>;
  private isConnected = false;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl ?? 600, // 10 minutes default
      prefix: config.prefix ?? 'zzik:cache:',
      enableCompression: config.enableCompression ?? true,
    };

    this.initClient();
  }

  /**
   * Initialize Redis client
   */
  private initClient(): void {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis cache connected');
      });

      this.client.on('error', (error) => {
        console.error('Redis cache error:', error);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      this.client = null;
    }
  }

  /**
   * Get cached directions between two points
   */
  async getDirections(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<DirectionsCache | null> {
    if (!this.isConnected) return null;

    try {
      const key = this.getDirectionsKey(from, to);
      const cached = await this.client!.get(key);
      
      if (!cached) return null;
      
      const data = this.decompress(cached);
      
      // Check if cache is still valid
      const age = Date.now() - data.cached_at;
      if (age > this.config.ttl * 1000) {
        await this.client!.del(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache directions between two points
   */
  async setDirections(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    distance: number,
    duration: number,
    route?: any
  ): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = this.getDirectionsKey(from, to);
      const data: DirectionsCache = {
        from,
        to,
        distance,
        duration,
        route,
        cached_at: Date.now(),
      };
      
      const compressed = this.compress(data);
      await this.client!.setex(key, this.config.ttl, compressed);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Cache GPS validation results
   */
  async cacheValidation(
    userId: string,
    storeId: string,
    result: any,
    ttl: number = 30 // Short TTL for validation
  ): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `${this.config.prefix}validation:${userId}:${storeId}`;
      await this.client!.setex(key, ttl, JSON.stringify(result));
    } catch (error) {
      console.error('Validation cache error:', error);
    }
  }

  /**
   * Get cached validation result
   */
  async getCachedValidation(
    userId: string,
    storeId: string
  ): Promise<any | null> {
    if (!this.isConnected) return null;

    try {
      const key = `${this.config.prefix}validation:${userId}:${storeId}`;
      const cached = await this.client!.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Get validation cache error:', error);
      return null;
    }
  }

  /**
   * Implement rate limiting for API calls
   */
  async checkRateLimit(
    identifier: string,
    limit: number = 10,
    window: number = 60 // seconds
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (!this.isConnected) {
      return { allowed: true, remaining: limit, resetAt: 0 };
    }

    try {
      const key = `${this.config.prefix}ratelimit:${identifier}`;
      const now = Date.now();
      const windowStart = now - window * 1000;
      
      // Remove old entries
      await this.client!.zremrangebyscore(key, '-inf', windowStart);
      
      // Count recent requests
      const count = await this.client!.zcard(key);
      
      if (count < limit) {
        // Add current request
        await this.client!.zadd(key, now, `${now}:${Math.random()}`);
        await this.client!.expire(key, window);
        
        return {
          allowed: true,
          remaining: limit - count - 1,
          resetAt: now + window * 1000,
        };
      }
      
      // Get oldest entry to determine reset time
      const oldest = await this.client!.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldest.length > 1 
        ? parseInt(oldest[1]) + window * 1000 
        : now + window * 1000;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit, resetAt: 0 };
    }
  }

  /**
   * Cache store geofence data
   */
  async cacheStores(stores: any[], ttl: number = 3600): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = `${this.config.prefix}stores:all`;
      const data = this.compress(stores);
      await this.client!.setex(key, ttl, data);
      
      // Also cache individual stores
      for (const store of stores) {
        const storeKey = `${this.config.prefix}store:${store.id}`;
        await this.client!.setex(storeKey, ttl, JSON.stringify(store));
      }
    } catch (error) {
      console.error('Store cache error:', error);
    }
  }

  /**
   * Get cached stores
   */
  async getCachedStores(): Promise<any[] | null> {
    if (!this.isConnected) return null;

    try {
      const key = `${this.config.prefix}stores:all`;
      const cached = await this.client!.get(key);
      return cached ? this.decompress(cached) : null;
    } catch (error) {
      console.error('Get stores cache error:', error);
      return null;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearCache(pattern?: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const searchPattern = pattern 
        ? `${this.config.prefix}${pattern}*`
        : `${this.config.prefix}*`;
      
      const keys = await this.client!.keys(searchPattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  /**
   * Generate cache key for directions
   */
  private getDirectionsKey(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): string {
    // Round to 4 decimal places (11m precision)
    const fromKey = `${from.lat.toFixed(4)},${from.lng.toFixed(4)}`;
    const toKey = `${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
    return `${this.config.prefix}directions:${fromKey}:${toKey}`;
  }

  /**
   * Compress data for storage
   */
  private compress(data: any): string {
    if (!this.config.enableCompression) {
      return JSON.stringify(data);
    }
    
    // Simple compression by removing whitespace
    // In production, use a proper compression library like lz-string
    return JSON.stringify(data);
  }

  /**
   * Decompress data from storage
   */
  private decompress(data: string): any {
    return JSON.parse(data);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    hits: number;
    misses: number;
  } | null> {
    if (!this.isConnected) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }

    try {
      const info = await this.client!.info('memory');
      const stats = await this.client!.info('stats');
      const dbSize = await this.client!.dbsize();
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';
      
      // Parse hit/miss stats
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);
      
      return {
        connected: true,
        memory,
        keys: dbSize,
        hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
        misses: missesMatch ? parseInt(missesMatch[1]) : 0,
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return null;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null;

/**
 * Get or create cache instance
 */
export function getCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache();
  }
  return cacheInstance;
}
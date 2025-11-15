import Redis from 'ioredis';

// Fail-open stub for when Redis is unavailable
class NoopRedis {
  async get(_key: string): Promise<string | null> {
    return null;
  }

  async set(_key: string, _value: string, _mode?: string, _duration?: number): Promise<void> {
    // noop
  }

  async incr(_key: string): Promise<number> {
    return 1;
  }

  async expire(_key: string, _seconds: number): Promise<void> {
    // noop
  }

  async ttl(_key: string): Promise<number> {
    return 0;
  }

  async del(_key: string): Promise<void> {
    // noop
  }

  // Event emitter methods for compatibility with Redis
  on(_event: string, _listener: (...args: any[]) => void): this {
    // noop - NoopRedis doesn't emit events
    return this;
  }

  off(_event: string, _listener: (...args: any[]) => void): this {
    // noop
    return this;
  }

  once(_event: string, _listener: (...args: any[]) => void): this {
    // noop
    return this;
  }
}

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 5000,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    })
  : new NoopRedis();

// Graceful connection handling
if (redisUrl) {
  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });
}

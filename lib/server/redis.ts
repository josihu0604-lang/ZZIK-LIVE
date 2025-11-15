import 'server-only';
import Redis from 'ioredis';

// Create Redis client instance
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });
};

// Export singleton instance
export const redis = createRedisClient();

// Health check
redis.on('ready', () => {
  console.warn('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});

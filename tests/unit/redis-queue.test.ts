/**
 * Redis Queue Unit Tests
 * Tests Redis-based queue operations with mocked Redis client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis client
const mockJobs = new Map<string, string>();
let queueList: string[] = [];
let processingList: string[] = [];
let dlqList: string[] = [];

vi.mock('@/lib/server/redis', () => ({
  redis: {
    get: vi.fn(async (key: string) => mockJobs.get(key) || null),
    setex: vi.fn(async (key: string, ttl: number, value: string) => {
      mockJobs.set(key, value);
      return 'OK';
    }),
    lpush: vi.fn(async (key: string, value: string) => {
      if (key.includes('dlq')) {
        dlqList.push(value);
        return dlqList.length;
      } else if (key.includes('processing')) {
        processingList.push(value);
        return processingList.length;
      } else {
        queueList.push(value);
        return queueList.length;
      }
    }),
    brpoplpush: vi.fn(async (src: string, dest: string, timeout: number) => {
      if (queueList.length === 0) return null;
      const job = queueList.pop();
      if (job) processingList.push(job);
      return job || null;
    }),
    lrem: vi.fn(async (key: string, count: number, value: string) => {
      if (key.includes('processing')) {
        const index = processingList.indexOf(value);
        if (index > -1) processingList.splice(index, 1);
        return 1;
      } else if (key.includes('dlq')) {
        const index = dlqList.indexOf(value);
        if (index > -1) dlqList.splice(index, 1);
        return 1;
      }
      return 0;
    }),
    zadd: vi.fn(),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    zrem: vi.fn(),
    llen: vi.fn(async (key: string) => {
      if (key.includes('dlq')) return dlqList.length;
      if (key.includes('processing')) return processingList.length;
      return queueList.length;
    }),
    zcard: vi.fn().mockResolvedValue(0),
    lrange: vi.fn(async (key: string, start: number, end: number) => {
      if (key.includes('dlq')) return dlqList.slice(start, end + 1);
      return queueList.slice(start, end + 1);
    }),
    ping: vi.fn().mockResolvedValue('PONG'),
    scan: vi.fn().mockResolvedValue(['0', []]),
    del: vi.fn(async (key: string) => {
      mockJobs.delete(key);
      return 1;
    }),
    pipeline: vi.fn(() => ({
      lpush: vi.fn().mockReturnThis(),
      zrem: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  },
}));

// Import after mocking
import {
  enqueueSettlement,
  dequeueJob,
  completeJob,
  requeueJob,
  moveToDLQ,
  requeueFromDLQ,
  getQueueStats,
  getDLQJobs,
  checkQueueHealth,
  type SettlementJobData,
  type QueueJob,
} from '@/lib/redis-queue';

describe('Redis Queue System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJobs.clear();
    queueList = [];
    processingList = [];
    dlqList = [];
  });

  describe('enqueueSettlement', () => {
    it('should enqueue settlement job', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'test-key-1',
      };

      const result = await enqueueSettlement(data);

      expect(result.jobId).toBe('test-key-1');
      expect(result.position).toBeGreaterThan(0);
    });

    it('should prevent duplicate jobs with same idempotency key', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'duplicate-key',
      };

      await enqueueSettlement(data);
      const result = await enqueueSettlement(data);

      expect(result.position).toBe(-1); // Already queued
    });

    it('should include metadata in job', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'with-metadata',
        metadata: {
          qrToken: 'qr-123',
          receiptId: 'receipt-1',
        },
      };

      await enqueueSettlement(data);

      // Verify job data stored
      const jobKey = `job:${data.idempotencyKey}`;
      expect(mockJobs.has(jobKey)).toBe(true);
    });
  });

  describe('dequeueJob', () => {
    it('should dequeue job from queue', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'dequeue-test',
      };

      await enqueueSettlement(data);
      const job = await dequeueJob(1);

      expect(job).toBeDefined();
      expect(job?.data.userId).toBe('user-1');
      expect(job?.attempts).toBe(1);
    });

    it('should return null when queue is empty', async () => {
      const job = await dequeueJob(0);
      expect(job).toBeNull();
    });

    it('should increment attempt count', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'attempt-test',
      };

      await enqueueSettlement(data);
      const job = await dequeueJob(1);

      expect(job?.attempts).toBe(1);
    });
  });

  describe('completeJob', () => {
    it('should mark job as completed', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 10000,
        idempotencyKey: 'complete-test',
      };

      await enqueueSettlement(data);
      const job = await dequeueJob(1);

      await completeJob(job!.id);

      expect(processingList).not.toContain(job!.id);
    });
  });

  describe('requeueJob', () => {
    it('should requeue failed job', async () => {
      const job: QueueJob = {
        id: 'requeue-test',
        data: {
          userId: 'user-1',
          placeId: 'place-1',
          missionId: 'mission-1',
          amount: 10000,
          idempotencyKey: 'requeue-test',
        },
        attempts: 1,
        maxAttempts: 5,
        createdAt: Date.now(),
      };

      const result = await requeueJob(job, 'Test error');

      expect(result).toBe(true);
    });

    it('should move to DLQ after max attempts', async () => {
      const job: QueueJob = {
        id: 'max-attempts',
        data: {
          userId: 'user-1',
          placeId: 'place-1',
          missionId: 'mission-1',
          amount: 10000,
          idempotencyKey: 'max-attempts',
        },
        attempts: 5,
        maxAttempts: 5,
        createdAt: Date.now(),
      };

      const result = await requeueJob(job, 'Max attempts reached');

      expect(result).toBe(false);
      expect(dlqList).toContain(job.id);
    });
  });

  describe('moveToDLQ', () => {
    it('should move job to DLQ', async () => {
      const job: QueueJob = {
        id: 'dlq-test',
        data: {
          userId: 'user-1',
          placeId: 'place-1',
          missionId: 'mission-1',
          amount: 10000,
          idempotencyKey: 'dlq-test',
        },
        attempts: 5,
        maxAttempts: 5,
        createdAt: Date.now(),
      };

      await moveToDLQ(job, 'Permanent failure');

      expect(dlqList).toContain(job.id);
    });
  });

  describe('requeueFromDLQ', () => {
    it('should requeue job from DLQ', async () => {
      const job: QueueJob = {
        id: 'requeue-dlq',
        data: {
          userId: 'user-1',
          placeId: 'place-1',
          missionId: 'mission-1',
          amount: 10000,
          idempotencyKey: 'requeue-dlq',
        },
        attempts: 5,
        maxAttempts: 5,
        createdAt: Date.now(),
      };

      await moveToDLQ(job, 'Test');
      const result = await requeueFromDLQ(job.id);

      expect(result).toBe(true);
    });

    it('should return false for non-existent job', async () => {
      const result = await requeueFromDLQ('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await getQueueStats();

      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.processing).toBe('number');
      expect(typeof stats.dlq).toBe('number');
      expect(typeof stats.total).toBe('number');
    });
  });

  describe('getDLQJobs', () => {
    it('should return DLQ jobs', async () => {
      const jobs = await getDLQJobs(0, 10);

      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe('checkQueueHealth', () => {
    it('should return healthy status', async () => {
      const health = await checkQueueHealth();

      expect(health.healthy).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large amounts', async () => {
      const data: SettlementJobData = {
        userId: 'user-1',
        placeId: 'place-1',
        missionId: 'mission-1',
        amount: 99999999,
        idempotencyKey: 'large-amount',
      };

      const result = await enqueueSettlement(data);

      expect(result.jobId).toBe('large-amount');
    });

    it('should handle special characters in IDs', async () => {
      const data: SettlementJobData = {
        userId: 'user-123-abc',
        placeId: 'place-456-def',
        missionId: 'mission-789-ghi',
        amount: 10000,
        idempotencyKey: 'special-_-.',
      };

      const result = await enqueueSettlement(data);

      expect(result.jobId).toBe('special-_-.');
    });
  });

  describe('Performance', () => {
    it('should enqueue 100 jobs quickly', async () => {
      const start = Date.now();

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          enqueueSettlement({
            userId: 'user-1',
            placeId: 'place-1',
            missionId: 'mission-1',
            amount: 10000 + i,
            idempotencyKey: `perf-${i}`,
          })
        );
      }

      await Promise.all(promises);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });
});

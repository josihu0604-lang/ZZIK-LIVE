/**
 * Redis-based Queue System for Settlement Processing
 * Simpler alternative to Bull - Direct Redis operations
 * 
 * Features:
 * - Redis Lists for queue storage (LPUSH/BRPOP)
 * - Retry logic with exponential backoff
 * - Dead Letter Queue (DLQ)
 * - Job status tracking
 * - Idempotency with job IDs
 */

import 'server-only';
import { redis } from './server/redis';
import type { Redis } from 'ioredis';

// Settlement job data type
export interface SettlementJobData {
  userId: string;
  placeId: string;
  missionId: string;
  amount: number;
  idempotencyKey: string;
  metadata?: {
    qrToken?: string;
    receiptId?: string;
    verificationId?: string;
  };
}

export interface QueueJob {
  id: string;
  data: SettlementJobData;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  failedReason?: string;
}

// Queue keys
const QUEUE_KEY = 'queue:settlement';
const PROCESSING_KEY = 'queue:settlement:processing';
const DLQ_KEY = 'queue:settlement:dlq';
const JOB_KEY_PREFIX = 'job:';

/**
 * Enqueue settlement job
 */
export async function enqueueSettlement(
  data: SettlementJobData
): Promise<{ jobId: string; position: number }> {
  const jobId = data.idempotencyKey;
  const jobKey = `${JOB_KEY_PREFIX}${jobId}`;

  // Check if job already exists (idempotency)
  const existing = await redis.get(jobKey);
  if (existing) {
    return { jobId, position: -1 }; // Already queued
  }

  const job: QueueJob = {
    id: jobId,
    data,
    attempts: 0,
    maxAttempts: 5,
    createdAt: Date.now(),
  };

  // Store job data
  await redis.setex(jobKey, 86400, JSON.stringify(job)); // 24h TTL

  // Add to queue
  const position = await redis.lpush(QUEUE_KEY, jobId);

  return { jobId, position };
}

/**
 * Dequeue job for processing
 * Uses BRPOPLPUSH for reliability (atomic move to processing list)
 */
export async function dequeueJob(timeoutSeconds: number = 5): Promise<QueueJob | null> {
  try {
    // Atomically move job from queue to processing
    const jobId = await redis.brpoplpush(QUEUE_KEY, PROCESSING_KEY, timeoutSeconds);
    
    if (!jobId) return null;

    const jobKey = `${JOB_KEY_PREFIX}${jobId}`;
    const jobData = await redis.get(jobKey);

    if (!jobData) {
      // Job data missing, remove from processing
      await redis.lrem(PROCESSING_KEY, 1, jobId);
      return null;
    }

    const job: QueueJob = JSON.parse(jobData);
    job.attempts++;

    // Update job data
    await redis.setex(jobKey, 86400, JSON.stringify(job));

    return job;
  } catch (error) {
    console.error('Dequeue error:', error);
    return null;
  }
}

/**
 * Mark job as completed and remove from processing
 */
export async function completeJob(jobId: string): Promise<void> {
  await redis.lrem(PROCESSING_KEY, 1, jobId);
  
  const jobKey = `${JOB_KEY_PREFIX}${jobId}`;
  const jobData = await redis.get(jobKey);
  
  if (jobData) {
    const job: QueueJob = JSON.parse(jobData);
    job.processedAt = Date.now();
    // Keep completed job for 1 hour for idempotency checks
    await redis.setex(jobKey, 3600, JSON.stringify(job));
  }
}

/**
 * Requeue failed job with exponential backoff
 */
export async function requeueJob(job: QueueJob, error: string): Promise<boolean> {
  const jobKey = `${JOB_KEY_PREFIX}${job.id}`;

  // Remove from processing
  await redis.lrem(PROCESSING_KEY, 1, job.id);

  // Check if max attempts reached
  if (job.attempts >= job.maxAttempts) {
    // Move to DLQ
    await moveToDLQ(job, error);
    return false;
  }

  // Update job with error
  job.failedReason = error;
  await redis.setex(jobKey, 86400, JSON.stringify(job));

  // Calculate backoff delay
  const backoffMs = Math.min(60000, Math.pow(2, job.attempts) * 1000); // Max 60s

  // Re-add to queue after delay (using sorted set with score = timestamp)
  const runAt = Date.now() + backoffMs;
  await redis.zadd('queue:settlement:delayed', runAt, job.id);

  return true;
}

/**
 * Move job to Dead Letter Queue
 */
export async function moveToDLQ(job: QueueJob, reason: string): Promise<void> {
  job.failedReason = reason;
  job.processedAt = Date.now();

  const dlqJob = {
    ...job,
    movedToDLQAt: Date.now(),
  };

  // Store in DLQ
  await redis.lpush(DLQ_KEY, job.id);
  const dlqJobKey = `${JOB_KEY_PREFIX}dlq:${job.id}`;
  await redis.setex(dlqJobKey, 86400 * 7, JSON.stringify(dlqJob)); // 7 days TTL

  console.log(`Job ${job.id} moved to DLQ: ${reason}`);
}

/**
 * Requeue job from DLQ
 */
export async function requeueFromDLQ(jobId: string): Promise<boolean> {
  const dlqJobKey = `${JOB_KEY_PREFIX}dlq:${jobId}`;
  const jobData = await redis.get(dlqJobKey);

  if (!jobData) return false;

  const job: QueueJob = JSON.parse(jobData);
  
  // Reset attempts
  job.attempts = 0;
  delete job.failedReason;
  delete job.processedAt;

  // Store back as regular job
  const jobKey = `${JOB_KEY_PREFIX}${job.id}`;
  await redis.setex(jobKey, 86400, JSON.stringify(job));

  // Add back to queue
  await redis.lpush(QUEUE_KEY, job.id);

  // Remove from DLQ
  await redis.lrem(DLQ_KEY, 1, jobId);
  await redis.del(dlqJobKey);

  return true;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, processing, dlq, delayed] = await Promise.all([
    redis.llen(QUEUE_KEY),
    redis.llen(PROCESSING_KEY),
    redis.llen(DLQ_KEY),
    redis.zcard('queue:settlement:delayed'),
  ]);

  return {
    waiting,
    processing,
    dlq,
    delayed,
    total: waiting + processing + delayed,
  };
}

/**
 * Get DLQ jobs
 */
export async function getDLQJobs(start: number = 0, end: number = 10): Promise<QueueJob[]> {
  const jobIds = await redis.lrange(DLQ_KEY, start, end);
  
  const jobs = await Promise.all(
    jobIds.map(async (jobId) => {
      const dlqJobKey = `${JOB_KEY_PREFIX}dlq:${jobId}`;
      const jobData = await redis.get(dlqJobKey);
      return jobData ? JSON.parse(jobData) : null;
    })
  );

  return jobs.filter((job): job is QueueJob => job !== null);
}

/**
 * Process delayed jobs (should be called periodically)
 */
export async function processDelayedJobs(): Promise<number> {
  const now = Date.now();
  
  // Get jobs that are ready to run
  const jobIds = await redis.zrangebyscore('queue:settlement:delayed', 0, now);
  
  if (jobIds.length === 0) return 0;

  // Move them back to main queue
  const pipeline = redis.pipeline();
  for (const jobId of jobIds) {
    pipeline.lpush(QUEUE_KEY, jobId);
    pipeline.zrem('queue:settlement:delayed', jobId);
  }
  
  await pipeline.exec();

  return jobIds.length;
}

/**
 * Health check
 */
export async function checkQueueHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Clean old completed jobs
 */
export async function cleanOldJobs(olderThanMs: number = 86400000): Promise<number> {
  const cutoff = Date.now() - olderThanMs;
  let cleaned = 0;

  // Scan for job keys
  let cursor = '0';
  do {
    const [newCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${JOB_KEY_PREFIX}*`,
      'COUNT',
      100
    );
    cursor = newCursor;

    for (const key of keys) {
      if (key.includes('dlq:')) continue; // Skip DLQ jobs

      const jobData = await redis.get(key);
      if (jobData) {
        const job: QueueJob = JSON.parse(jobData);
        if (job.processedAt && job.processedAt < cutoff) {
          await redis.del(key);
          cleaned++;
        }
      }
    }
  } while (cursor !== '0');

  return cleaned;
}

/**
 * Prisma Client Singleton
 * Ensures single instance across hot reloads in development
 * Production-ready connection pooling and error handling
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures clean database disconnect on process termination
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectPrisma();
  });
}

/**
 * Health check function
 * Tests database connectivity
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    return {
      healthy: true,
      latencyMs,
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Transaction helper with retry logic
 * Automatically retries on deadlock/timeout errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Retry on specific errors
      const isRetryable =
        error.code === 'P2034' || // Transaction conflict
        error.code === 'P2024' || // Connection timeout
        error.message.includes('deadlock');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt))
      );
    }
  }

  throw lastError;
}

/**
 * Batch operation helper
 * Splits large arrays into chunks for efficient processing
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }

  return results;
}

export default prisma;

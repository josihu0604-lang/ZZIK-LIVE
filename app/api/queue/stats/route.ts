/**
 * Queue Statistics API
 * GET /api/queue/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueStats, checkQueueHealth } from '@/lib/redis-queue';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Check queue health
    const health = await checkQueueHealth();

    if (!health.healthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: health.error,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Get queue statistics
    const stats = await getQueueStats();

    return NextResponse.json({
      status: 'healthy',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

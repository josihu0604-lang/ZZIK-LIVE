/**
 * Failed Jobs API
 * GET /api/queue/failed - List failed jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDLQJobs as getFailedJobs } from '@/lib/redis-queue';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get('start') || '0');
    const end = parseInt(searchParams.get('end') || '10');

    const jobs = await getFailedJobs(start, end);

    const formatted = jobs.map((job) => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attempts: job.attempts,
      createdAt: job.createdAt,
      processedAt: job.processedAt,
    }));

    return NextResponse.json({
      jobs: formatted,
      count: formatted.length,
      range: { start, end },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed jobs query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

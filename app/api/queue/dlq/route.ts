/**
 * Dead Letter Queue API
 * GET /api/queue/dlq - List DLQ jobs
 * POST /api/queue/dlq - Requeue job from DLQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDLQJobs, requeueFromDLQ } from '@/lib/redis-queue';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET - List DLQ jobs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get('start') || '0');
    const end = parseInt(searchParams.get('end') || '10');

    const jobs = await getDLQJobs(start, end);

    const formatted = jobs.map((job) => ({
      id: job.id,
      data: job.data,
      attempts: job.attempts,
      failedReason: job.failedReason,
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
    console.error('DLQ query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST - Requeue job from DLQ
const RequeueSchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = RequeueSchema.parse(await req.json());

    const success = await requeueFromDLQ(body.jobId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: `Job ${body.jobId} not found in DLQ`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: body.jobId,
      message: 'Job requeued successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DLQ requeue error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

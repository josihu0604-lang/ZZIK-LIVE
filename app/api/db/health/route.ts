/**
 * Database Health Check API
 * Tests Prisma connection and returns latency metrics
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();

    if (health.healthy) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        latencyMs: health.latencyMs,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          error: health.error,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unknown',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

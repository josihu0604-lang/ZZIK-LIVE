import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET() {
  let db = 'fail',
    cache = 'skip';

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'ok';
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check Redis connection
  try {
    const pingResult = await (redis as any).ping?.();
    cache = pingResult ? 'ok' : 'skip';
  } catch (error) {
    // Redis is optional, so failures are logged but don't fail the health check
    console.error('Redis health check failed:', error);
    cache = 'skip';
  }

  return NextResponse.json(
    {
      ok: db === 'ok',
      db,
      cache,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

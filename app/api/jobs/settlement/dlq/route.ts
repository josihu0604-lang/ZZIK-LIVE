import { NextRequest, NextResponse } from 'next/server';
import { listDLQ, requeueFromDLQ } from '@/lib/queue';

export const runtime = 'nodejs';

/**
 * Dead Letter Queue 관리
 * GET  /api/jobs/settlement/dlq - 목록 조회
 * POST /api/jobs/settlement/dlq - 재큐잉
 */
export async function GET() {
  const items = await listDLQ(100);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const { index } = await req.json().catch(() => ({ index: -1 }));
  const ok = await requeueFromDLQ(Number(index));
  return NextResponse.json({ ok });
}

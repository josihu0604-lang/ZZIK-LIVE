import { NextRequest, NextResponse } from 'next/server';
import { idempTryLock, idempUnlock } from '@/lib/idempotency';
import { popReady, requeueBackoff, pushDLQ } from '@/lib/queue';
import { hmacSign } from '@/lib/signing';

export const runtime = 'nodejs';

/**
 * 정산 큐 소비자 (지수 백오프 + DLQ)
 * POST /api/jobs/settlement/consume
 */
export async function POST(_req: NextRequest) {
  const jobs = await popReady('settlement', 10);
  const results: any[] = [];

  for (const job of jobs) {
    const { missionId, amount, currency, idempKey } = job.payload as any;
    const lockKey = `settle:${idempKey}`;
    const locked = await idempTryLock(lockKey, 60_000);

    if (!locked) {
      results.push({ missionId, skipped: 'locked' });
      continue;
    }

    try {
      // --- 실제 PG API 호출 자리 ---
      // 예: 토스/네이버 사전 승인/정산 호출
      
      // 데모: 모의 PG 결제 ID 생성
      await new Promise((r) => setTimeout(r, 100)); // 네트워크 시뮬레이션
      const pgPaymentId = `pg_${Math.random().toString(36).slice(2)}`;

      // PG 웹훅 이벤트 준비 (실제 운영에서는 PG 서버가 보냄)
      const evt = {
        provider: 'mock',
        type: 'payment.captured',
        missionId,
        pgPaymentId,
        amount,
        currency,
        ts: Date.now(),
      };
      const body = JSON.stringify(evt);
      const sig = hmacSign(body, process.env.TOSS_WEBHOOK_SECRET!);

      results.push({
        missionId,
        pgPaymentId,
        ok: true,
        sig,
        attempts: job.attempts,
      });
    } catch (e: any) {
      job.attempts += 1;
      const error = e?.message ?? 'unknown error';

      if (job.attempts < job.maxAttempts) {
        // 재시도 (지수 백오프)
        await requeueBackoff(job);
        results.push({
          missionId,
          retryAt: new Date(job.nextAt).toISOString(),
          attempts: job.attempts,
        });
      } else {
        // Dead Letter Queue로 이동
        await pushDLQ(job, error);
        results.push({
          missionId,
          dlq: true,
          error,
        });
      }
    } finally {
      await idempUnlock(lockKey);
    }
  }

  return NextResponse.json({
    ok: true,
    handled: jobs.length,
    results,
  });
}

// app/api/wallet/redeem/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/server/idempotency';
import { checkRate, withRateHeaders } from '@/lib/server/rate-limit';
import { log } from '@/lib/server/logger';
import { redeemVoucher } from '@/lib/wallet/redemption';

/**
 * Wallet Redemption Endpoint with Strong Idempotency
 * 1. Rate limiting: 10 req/min per user
 * 2. Idempotency: REQUIRED - prevents double redemption
 * 3. Transaction isolation: SERIALIZABLE for balance updates
 * 4. Atomic state transitions with rollback support
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'unknown';

  // Rate limiting per user (10 redemptions per minute)
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Missing userId' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rateMeta = await checkRate('redeem', userId, 10, 60);
  const allowed = rateMeta.remaining >= 0;

  if (!allowed) {
    log('warn', 'wallet.redeem.rate_limited', {
      user_id: userId,
      request_id: requestId,
    });
    const res = new NextResponse('Too Many Requests', { status: 429 });
    return withRateHeaders(res, rateMeta);
  }

  // Idempotency key REQUIRED for financial transactions
  const idemKey = req.headers.get('idempotency-key') ?? '';

  const idemResult = await withIdempotency(idemKey, async () => {
    try {
      const { voucherId, placeId } = body;

      // Validation
      if (!voucherId || !placeId) {
        log('warn', 'wallet.redeem.invalid_payload', {
          request_id: requestId,
          user_id: userId,
          took_ms: Date.now() - started,
        });

        const res = new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: userId, voucherId, placeId',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        return withRateHeaders(res, rateMeta);
      }

      // Perform redemption with transactional guarantees
      const result = await redeemVoucher({
        userId,
        voucherId,
        placeId,
        requestId,
      });

      log('info', 'wallet.redeem.completed', {
        success: result.success,
        request_id: requestId,
        user_id: userId,
        voucher_id: voucherId,
        new_balance: result.newBalance,
        took_ms: Date.now() - started,
      });

      const res = new NextResponse(
        JSON.stringify({
          success: result.success,
          message: result.message,
          newBalance: result.newBalance,
          ledgerEntry: result.ledgerEntry,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );

      return withRateHeaders(res, rateMeta);
    } catch (error: any) {
      log('error', 'wallet.redeem.failed', {
        error: error?.message,
        request_id: requestId,
        user_id: userId,
        took_ms: Date.now() - started,
      });

      const res = new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Redemption failed',
          message: error?.message,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

      return withRateHeaders(res, rateMeta);
    }
  });

  return idemResult.value;
}

// Explicitly block other methods
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

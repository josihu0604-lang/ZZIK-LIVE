import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { verifyWebhookSignature } from '@/lib/payments/naver-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Webhook Event Types
type NaverPayWebhookEvent = {
  paymentId: string;
  merchantPayKey: string;
  merchantUserKey?: string;
  paymentStatus: string;
  totalPayAmount: number;
  paymentDate?: string;
  [key: string]: any;
};

/**
 * 네이버페이 웹훅 엔드포인트
 * POST /api/pg/naver
 * 
 * Handles payment status changes from Naver Pay
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sigHeaderName = process.env.NAVER_SIG_HEADER || 'x-naverpay-signature';
  const sig = req.headers.get(sigHeaderName);
  const webhookSecret = process.env.NAVER_WEBHOOK_SECRET!;

  // HMAC 서명 검증
  if (!verifyWebhookSignature(sig, raw, webhookSecret)) {
    console.error('[PG/NAVER] Invalid webhook signature');
    return new Response('Bad signature', { status: 400 });
  }

  const evt = JSON.parse(raw) as NaverPayWebhookEvent;

  // 멱등성 키 (dedupeKey)
  const dedupeKey = `naver:webhook:${evt.paymentId}:${evt.paymentStatus}`;

  console.log('[PG/NAVER] Webhook received:', {
    paymentStatus: evt.paymentStatus,
    paymentId: evt.paymentId,
    merchantPayKey: evt.merchantPayKey,
  });

  try {
    // Handle payment status change
    await handlePaymentStatusChanged(evt, dedupeKey);

    // 성공 응답 (PG 서버에 2xx 응답 필수)
    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error('[PG/NAVER] Webhook processing error:', error);
    // Return 200 to prevent retry, but log the error
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle payment status change event
 */
async function handlePaymentStatusChanged(
  evt: NaverPayWebhookEvent,
  dedupeKey: string
) {
  // Find ledger by merchantPayKey
  const ledgers = await prisma.ledger.findMany({
    where: {
      meta: { not: Prisma.JsonNull },
    },
  });

  const ledger = ledgers.find(
    (l) => (l.meta as any)?.merchantPayKey === evt.merchantPayKey
  );

  if (!ledger) {
    console.warn(`[PG/NAVER] Ledger not found for order: ${evt.merchantPayKey}`);
    return;
  }

  // Map Naver Pay status to our ledger status
  let ledgerStatus: 'pending' | 'completed' | 'failed';
  switch (evt.paymentStatus) {
    case 'PAYMENT_COMPLETE':
    case 'PURCHASER_CONFIRM':
      ledgerStatus = 'completed';
      break;
    case 'PAYMENT_CANCEL':
    case 'REFUND':
      ledgerStatus = 'failed';
      break;
    default:
      ledgerStatus = 'pending';
  }

  // Update ledger
  await prisma.ledger.update({
    where: { id: ledger.id },
    data: {
      status: ledgerStatus,
      processedAt: evt.paymentDate ? parseDateString(evt.paymentDate) : new Date(),
      meta: {
        ...(ledger.meta as any),
        paymentId: evt.paymentId,
        paymentStatus: evt.paymentStatus,
        webhookProcessedAt: new Date().toISOString(),
        dedupeKey,
      },
    },
  });

  console.log(`[PG/NAVER] Ledger ${ledger.id} updated to ${ledgerStatus}`);
}

/**
 * Parse Naver Pay date string (YYYYMMDDHHmmss) to Date
 */
function parseDateString(dateStr: string): Date {
  if (dateStr.length !== 14) return new Date();

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const hours = parseInt(dateStr.substring(8, 10));
  const minutes = parseInt(dateStr.substring(10, 12));
  const seconds = parseInt(dateStr.substring(12, 14));

  return new Date(year, month, day, hours, minutes, seconds);
}

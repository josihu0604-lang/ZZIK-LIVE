import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { hmacVerify } from '@/lib/signing';
import { verifyWebhookSignature } from '@/lib/payments/toss-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Webhook Event Types
type TossWebhookEvent = {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'VIRTUAL_ACCOUNT_DEPOSIT';
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  approvedAt?: string;
  canceledAt?: string;
  [key: string]: any;
};

/**
 * 토스페이먼츠 웹훅 엔드포인트
 * POST /api/pg/toss
 * 
 * Handles payment status changes from Toss Payments
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sigHeaderName = process.env.TOSS_SIG_HEADER || 'x-toss-signature';
  const sig = req.headers.get(sigHeaderName);
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET!;

  // HMAC 서명 검증
  if (!verifyWebhookSignature(sig, raw, webhookSecret)) {
    console.error('[PG/TOSS] Invalid webhook signature');
    return new Response('Bad signature', { status: 400 });
  }

  const evt = JSON.parse(raw) as TossWebhookEvent;
  
  // 멱등성 키 (dedupeKey)
  const dedupeKey = `toss:webhook:${evt.paymentKey}:${evt.eventType}`;

  console.log('[PG/TOSS] Webhook received:', {
    eventType: evt.eventType,
    status: evt.status,
    paymentKey: evt.paymentKey,
    orderId: evt.orderId,
  });

  try {
    // Handle different event types
    switch (evt.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(evt, dedupeKey);
        break;
      
      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        await handleVirtualAccountDeposit(evt, dedupeKey);
        break;
      
      default:
        console.log('[PG/TOSS] Unknown event type:', evt.eventType);
    }

    // 성공 응답 (PG 서버에 2xx 응답 필수)
    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error('[PG/TOSS] Webhook processing error:', error);
    // Return 200 to prevent retry, but log the error
    return NextResponse.json({ 
      ok: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Handle payment status change event
 */
async function handlePaymentStatusChanged(
  evt: TossWebhookEvent,
  dedupeKey: string
) {
  // Find ledger by orderId
  // Note: Prisma doesn't support JSON path queries in TypeScript elegantly
  // We query all ledgers and filter in-memory
  const ledgers = await prisma.ledger.findMany({
    where: {
      meta: { not: Prisma.JsonNull },
    },
  });

  const ledger = ledgers.find(
    (l) => (l.meta as any)?.orderId === evt.orderId
  );

  if (!ledger) {
    console.warn(`[PG/TOSS] Ledger not found for order: ${evt.orderId}`);
    return;
  }

  // Map Toss status to our ledger status
  let ledgerStatus: 'pending' | 'completed' | 'failed';
  switch (evt.status) {
    case 'DONE':
      ledgerStatus = 'completed';
      break;
    case 'CANCELED':
    case 'ABORTED':
    case 'EXPIRED':
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
      processedAt: evt.approvedAt ? new Date(evt.approvedAt) : new Date(),
      meta: {
        ...(ledger.meta as any),
        paymentKey: evt.paymentKey,
        paymentStatus: evt.status,
        webhookProcessedAt: new Date().toISOString(),
        dedupeKey,
      },
    },
  });

  console.log(`[PG/TOSS] Ledger ${ledger.id} updated to ${ledgerStatus}`);
}

/**
 * Handle virtual account deposit event
 */
async function handleVirtualAccountDeposit(
  evt: TossWebhookEvent,
  dedupeKey: string
) {
  // Similar to payment status changed, but specifically for virtual account
  await handlePaymentStatusChanged(evt, dedupeKey);
}

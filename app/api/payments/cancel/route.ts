/**
 * Payment Cancellation API
 * POST /api/payments/cancel
 * 
 * Cancel or refund a payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  cancelPayment,
  getPayment,
  TossPaymentError,
} from '@/lib/payments/toss-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Request Schema
const CancelPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  cancelReason: z.string().min(1),
  cancelAmount: z.number().positive().optional(),
  refundAccount: z.object({
    bank: z.string(),
    accountNumber: z.string(),
    holderName: z.string(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = CancelPaymentSchema.parse(await req.json());

    // 1. Verify payment exists
    const payment = await getPayment(body.paymentKey);

    if (payment.status === 'CANCELED' || payment.status === 'PARTIAL_CANCELED') {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_CANCELED',
          message: 'Payment is already canceled',
        },
        { status: 400 }
      );
    }

    if (payment.status !== 'DONE') {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_CANCELABLE',
          message: `Payment status ${payment.status} cannot be canceled`,
        },
        { status: 400 }
      );
    }

    // 2. Cancel payment with Toss
    let cancelResult;
    try {
      cancelResult = await cancelPayment({
        paymentKey: body.paymentKey,
        cancelReason: body.cancelReason,
        cancelAmount: body.cancelAmount,
        refundReceiveAccount: body.refundAccount,
      });
    } catch (error) {
      if (error instanceof TossPaymentError) {
        return NextResponse.json(
          {
            success: false,
            error: 'CANCEL_FAILED',
            message: error.message,
            code: error.code,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 3. Update ledger status
    // Note: Prisma doesn't support JSON path queries in TypeScript elegantly
    // We query all ledgers and filter in-memory (consider adding paymentKey as separate field for production)
    const ledgers = await prisma.ledger.findMany({
      where: {
        meta: { not: Prisma.JsonNull },
      },
    });

    const ledger = ledgers.find(
      (l) => (l.meta as any)?.paymentKey === body.paymentKey
    );

    if (ledger) {
      await prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          status: 'failed', // Mark as failed for canceled payments
          meta: {
            ...(ledger.meta as any),
            canceledAt: cancelResult.canceledAt,
            cancelAmount: cancelResult.cancelAmount,
            cancelReason: cancelResult.cancelReason,
            paymentStatus: cancelResult.status,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      paymentKey: cancelResult.paymentKey,
      orderId: cancelResult.orderId,
      status: cancelResult.status,
      canceledAt: cancelResult.canceledAt,
      cancelAmount: cancelResult.cancelAmount,
      cancelReason: cancelResult.cancelReason,
    });
  } catch (error) {
    console.error('Payment cancellation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

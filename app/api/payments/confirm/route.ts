/**
 * Payment Confirmation API
 * POST /api/payments/confirm
 * 
 * Called after user completes payment on Toss checkout page
 * This confirms the payment and updates our database
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  confirmPayment,
  TossPaymentError,
  type TossPaymentResponse,
} from '@/lib/payments/toss-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Request Schema
const ConfirmPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = ConfirmPaymentSchema.parse(await req.json());

    // 1. Confirm payment with Toss Payments
    let payment: TossPaymentResponse;
    try {
      payment = await confirmPayment(body);
    } catch (error) {
      if (error instanceof TossPaymentError) {
        return NextResponse.json(
          {
            success: false,
            error: 'PAYMENT_FAILED',
            message: error.message,
            code: error.code,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 2. Find the ledger entry by orderId
    // Note: Prisma doesn't support JSON path queries in TypeScript elegantly
    // We query all ledgers and filter in-memory (consider adding orderId as separate field for production)
    const ledgers = await prisma.ledger.findMany({
      where: {
        meta: { not: Prisma.JsonNull },
      },
    });

    const ledger = ledgers.find(
      (l) => (l.meta as any)?.orderId === body.orderId
    );

    if (!ledger) {
      return NextResponse.json(
        {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: `Order ${body.orderId} not found in database`,
        },
        { status: 404 }
      );
    }

    // 3. Update ledger with payment information
    await prisma.ledger.update({
      where: { id: ledger.id },
      data: {
        status: payment.status === 'DONE' ? 'completed' : 'pending',
        processedAt: payment.approvedAt ? new Date(payment.approvedAt) : new Date(),
        meta: {
          ...(ledger.meta as any),
          paymentKey: payment.paymentKey,
          paymentMethod: payment.method,
          paymentStatus: payment.status,
          approvedAt: payment.approvedAt,
          receiptUrl: payment.receipt?.url,
          cardInfo: payment.card ? {
            company: payment.card.company,
            number: payment.card.number,
            installmentPlanMonths: payment.card.installmentPlanMonths,
          } : undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: payment.orderId,
      paymentKey: payment.paymentKey,
      status: payment.status,
      amount: payment.totalAmount,
      approvedAt: payment.approvedAt,
      receiptUrl: payment.receipt?.url,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);

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

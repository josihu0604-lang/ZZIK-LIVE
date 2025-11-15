/**
 * Naver Pay Payment Cancellation API
 * POST /api/payments/naver/cancel
 * 
 * Cancel or refund a Naver Pay payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  cancelPayment,
  getPayment,
  calculateTaxAmounts,
  NaverPayError,
} from '@/lib/payments/naver-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Request Schema
const CancelNaverPaymentSchema = z.object({
  paymentId: z.string().min(1),
  cancelAmount: z.number().positive(),
  cancelReason: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = CancelNaverPaymentSchema.parse(await req.json());

    // 1. Verify payment exists and is cancelable
    const payment = await getPayment(body.paymentId);

    if (!payment.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
        { status: 404 }
      );
    }

    if (
      payment.body.paymentStatus === 'PAYMENT_CANCEL' ||
      payment.body.paymentStatus === 'REFUND'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_CANCELED',
          message: 'Payment is already canceled',
        },
        { status: 400 }
      );
    }

    if (
      payment.body.paymentStatus !== 'PAYMENT_COMPLETE' &&
      payment.body.paymentStatus !== 'PURCHASER_CONFIRM'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_CANCELABLE',
          message: `Payment status ${payment.body.paymentStatus} cannot be canceled`,
        },
        { status: 400 }
      );
    }

    // 2. Calculate tax amounts for cancellation
    const { taxScopeAmount, taxExScopeAmount } = calculateTaxAmounts(body.cancelAmount);

    // 3. Cancel payment with Naver Pay
    let cancelResult;
    try {
      cancelResult = await cancelPayment({
        paymentId: body.paymentId,
        cancelAmount: body.cancelAmount,
        cancelReason: body.cancelReason,
        taxScopeAmount,
        taxExScopeAmount,
      });
    } catch (error) {
      if (error instanceof NaverPayError) {
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

    if (!cancelResult.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_RESPONSE',
          message: 'Invalid cancel response from Naver Pay',
        },
        { status: 500 }
      );
    }

    // 4. Update ledger status
    const ledgers = await prisma.ledger.findMany({
      where: {
        meta: { not: Prisma.JsonNull },
      },
    });

    const ledger = ledgers.find(
      (l) => (l.meta as any)?.paymentId === body.paymentId
    );

    if (ledger) {
      await prisma.ledger.update({
        where: { id: ledger.id },
        data: {
          status: 'failed', // Mark as failed for canceled payments
          meta: {
            ...(ledger.meta as any),
            canceledAt: cancelResult.body.cancelDate,
            cancelAmount: cancelResult.body.cancelAmount,
            cancelReason: body.cancelReason,
            paymentStatus: 'PAYMENT_CANCEL',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: cancelResult.body.paymentId,
      merchantPayKey: cancelResult.body.merchantPayKey,
      cancelAmount: cancelResult.body.cancelAmount,
      cancelDate: cancelResult.body.cancelDate,
      cancelReason: body.cancelReason,
    });
  } catch (error) {
    console.error('Naver Pay cancellation error:', error);

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

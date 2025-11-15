/**
 * Naver Pay Payment Confirmation API
 * POST /api/payments/naver/confirm
 * 
 * Called after user completes payment on Naver Pay page
 * This confirms the payment and updates our database
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  confirmPayment,
  NaverPayError,
  type NaverPaymentResponse,
} from '@/lib/payments/naver-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Request Schema
const ConfirmNaverPaymentSchema = z.object({
  paymentId: z.string().min(1),
  merchantPayKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = ConfirmNaverPaymentSchema.parse(await req.json());

    // 1. Confirm payment with Naver Pay
    let payment: NaverPaymentResponse;
    try {
      payment = await confirmPayment({ paymentId: body.paymentId });
    } catch (error) {
      if (error instanceof NaverPayError) {
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

    if (!payment.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_RESPONSE',
          message: 'Invalid payment response from Naver Pay',
        },
        { status: 500 }
      );
    }

    // 2. Find the ledger entry by merchantPayKey
    const ledgers = await prisma.ledger.findMany({
      where: {
        meta: { not: Prisma.JsonNull },
      },
    });

    const ledger = ledgers.find(
      (l) => (l.meta as any)?.merchantPayKey === body.merchantPayKey
    );

    if (!ledger) {
      return NextResponse.json(
        {
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: `Order ${body.merchantPayKey} not found in database`,
        },
        { status: 404 }
      );
    }

    // 3. Map Naver Pay status to our ledger status
    let ledgerStatus: 'pending' | 'completed' | 'failed';
    switch (payment.body.paymentStatus) {
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

    // 4. Update ledger with payment information
    await prisma.ledger.update({
      where: { id: ledger.id },
      data: {
        status: ledgerStatus,
        processedAt: payment.body.paymentDate
          ? parseDateString(payment.body.paymentDate)
          : new Date(),
        meta: {
          ...(ledger.meta as any),
          paymentId: payment.body.paymentId,
          paymentStatus: payment.body.paymentStatus,
          primaryPayMeans: payment.body.primaryPayMeans,
          primaryPayAmount: payment.body.primaryPayAmount,
          npointPayAmount: payment.body.npointPayAmount,
          giftCardAmount: payment.body.giftCardAmount,
          adminFee: payment.body.adminFee,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      merchantPayKey: payment.body.merchantPayKey,
      paymentId: payment.body.paymentId,
      status: payment.body.paymentStatus,
      amount: payment.body.totalPayAmount,
      paymentDate: payment.body.paymentDate,
    });
  } catch (error) {
    console.error('Naver Pay confirmation error:', error);

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

/**
 * Payment Details API
 * GET /api/payments/[paymentKey]
 * 
 * Get payment details by payment key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayment, TossPaymentError } from '@/lib/payments/toss-client';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> }
) {
  try {
    const { paymentKey } = await params;

    if (!paymentKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PAYMENT_KEY',
          message: 'Payment key is required',
        },
        { status: 400 }
      );
    }

    // Get payment from Toss Payments
    let payment;
    try {
      payment = await getPayment(paymentKey);
    } catch (error) {
      if (error instanceof TossPaymentError) {
        return NextResponse.json(
          {
            success: false,
            error: 'PAYMENT_NOT_FOUND',
            message: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentKey: payment.paymentKey,
        orderId: payment.orderId,
        orderName: payment.orderName,
        status: payment.status,
        method: payment.method,
        totalAmount: payment.totalAmount,
        balanceAmount: payment.balanceAmount,
        currency: payment.currency,
        requestedAt: payment.requestedAt,
        approvedAt: payment.approvedAt,
        receiptUrl: payment.receipt?.url,
        card: payment.card,
        virtualAccount: payment.virtualAccount,
        transfer: payment.transfer,
        failure: payment.failure,
      },
    });
  } catch (error) {
    console.error('Payment retrieval error:', error);

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

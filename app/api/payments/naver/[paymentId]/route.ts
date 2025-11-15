/**
 * Naver Pay Payment Details API
 * GET /api/payments/naver/[paymentId]
 * 
 * Retrieve detailed payment information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayment, NaverPayError } from '@/lib/payments/naver-client';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PAYMENT_ID',
          message: 'Payment ID is required',
        },
        { status: 400 }
      );
    }

    // Get payment details from Naver Pay
    let payment;
    try {
      payment = await getPayment(paymentId);
    } catch (error) {
      if (error instanceof NaverPayError) {
        return NextResponse.json(
          {
            success: false,
            error: 'PAYMENT_NOT_FOUND',
            message: error.message,
            code: error.code,
          },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!payment.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_RESPONSE',
          message: 'Invalid response from Naver Pay',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: payment.body,
    });
  } catch (error) {
    console.error('Naver Pay get payment error:', error);

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

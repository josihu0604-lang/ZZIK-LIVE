/**
 * Naver Pay Payment Request API
 * POST /api/payments/naver/request
 * 
 * Creates a payment request and returns payment URL for user redirection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requestPayment,
  generateMerchantPayKey,
  calculateTaxAmounts,
  formatNaverPayDate,
  NaverPayError,
  type NaverPaymentRequest,
} from '@/lib/payments/naver-client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Request Schema
const NaverPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  productName: z.string().min(1),
  productCount: z.number().positive().optional(),
  userId: z.string().optional(), // TODO: Get from session
  returnUrl: z.string().url().optional(),
  useCfmYmdt: z.string().optional(), // YYYYMMDDHHmmss format
});

export async function POST(req: NextRequest) {
  try {
    const body = NaverPaymentRequestSchema.parse(await req.json());

    // Generate unique merchant pay key
    const merchantPayKey = generateMerchantPayKey('NPY');

    // Calculate tax amounts
    const { taxScopeAmount, taxExScopeAmount } = calculateTaxAmounts(body.amount);

    // Prepare payment request
    const paymentRequest: NaverPaymentRequest = {
      merchantPayKey,
      productName: body.productName,
      totalPayAmount: body.amount,
      taxScopeAmount,
      taxExScopeAmount,
      returnUrl: body.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payments/naver/complete`,
      productCount: body.productCount,
      merchantUserKey: body.userId || 'guest',
      useCfmYmdt: body.useCfmYmdt || formatNaverPayDate(new Date(Date.now() + 86400000 * 7)), // 7 days from now
    };

    // Request payment from Naver Pay
    let paymentUrl: string;
    try {
      const result = await requestPayment(paymentRequest);
      paymentUrl = result.paymentUrl;
    } catch (error) {
      if (error instanceof NaverPayError) {
        return NextResponse.json(
          {
            success: false,
            error: 'PAYMENT_REQUEST_FAILED',
            message: error.message,
            code: error.code,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Create ledger entry (pending status)
    const userId = body.userId || 'demo-user'; // TODO: Get from authenticated session
    
    // Get current balance
    const lastLedger = await prisma.ledger.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });

    const currentBalance = lastLedger?.balance || 0;

    await prisma.ledger.create({
      data: {
        userId,
        type: 'credit',
        amount: body.amount,
        balance: currentBalance + body.amount,
        reason: `Naver Pay: ${body.productName}`,
        status: 'pending',
        meta: {
          merchantPayKey,
          productName: body.productName,
          productCount: body.productCount,
          paymentProvider: 'naver',
          requestedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      merchantPayKey,
      paymentUrl,
      amount: body.amount,
      productName: body.productName,
    });
  } catch (error) {
    console.error('Naver Pay request error:', error);

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

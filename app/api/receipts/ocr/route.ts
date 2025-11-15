import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  receiptId: z.string().min(1),
  ok: z.boolean()
});

export async function POST(req: NextRequest) {
  // Parse request body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: 'INVALID_PARAMS',
        details: parsed.error.flatten()
      },
      { status: 422 }
    );
  }
  
  // Apply rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 
             req.headers.get('x-real-ip') ?? 
             'unknown';
  const rl = await rateLimit('receipts_ocr', ip);
  
  if (rl.used > rl.limit) {
    return NextResponse.json(
      { error: 'RATE_LIMIT' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(rl.reset)
        }
      }
    );
  }
  
  const { receiptId, ok } = parsed.data;
  
  try {
    // Find the receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId }
    });
    
    if (!receipt) {
      return NextResponse.json(
        { error: 'RECEIPT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Update OCR status
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: { 
        ocrStatus: ok ? 'ok' : 'fail'
      }
    });
    
    // If OCR succeeded, update verification
    if (ok) {
      await prisma.verification.upsert({
        where: {
          userId_placeId: {
            userId: receipt.userId,
            placeId: receipt.placeId
          }
        },
        update: { receiptOk: true },
        create: {
          userId: receipt.userId,
          placeId: receipt.placeId,
          receiptOk: true
        }
      });
      
      console.log(
        `Receipt OCR success - receipt: ${receiptId}, ` +
        `place: ${receipt.placeId}`
      );
    } else {
      console.log(
        `Receipt OCR failed - receipt: ${receiptId}`
      );
    }
    
    return NextResponse.json(
      {
        ocrStatus: updatedReceipt.ocrStatus
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset)
        }
      }
    );
  } catch (error) {
    console.error('Receipt OCR error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';
import { parseRequestJsonOrDefault, errorResponse, commonErrors } from '@/lib/api';

const schema = z.object({
  receiptId: z.string().min(1),
  ok: z.boolean(),
});

export async function POST(req: NextRequest) {
  // Parse request body
  const body = await parseRequestJsonOrDefault(req, {});
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return errorResponse('INVALID_PARAMS', 422, JSON.stringify(parsed.error.flatten()));
  }

  // Apply rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
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
          'Retry-After': String(rl.reset),
        },
      }
    );
  }

  const { receiptId, ok } = parsed.data;

  try {
    // Find the receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return commonErrors.notFound('Receipt');
    }

    // Update OCR status
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrStatus: ok ? 'ok' : 'fail',
      },
    });

    // If OCR succeeded, update verification
    if (ok) {
      await prisma.verification.upsert({
        where: {
          userId_placeId: {
            userId: receipt.userId,
            placeId: receipt.placeId,
          },
        },
        update: { receiptOk: true },
        create: {
          userId: receipt.userId,
          placeId: receipt.placeId,
          receiptOk: true,
        },
      });
    }
    // OCR failed case - no action needed

    return NextResponse.json(
      {
        ocrStatus: updatedReceipt.ocrStatus,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      }
    );
  } catch (error) {
    console.error('Receipt OCR error:', error);
    return commonErrors.internalError();
  }
}

import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  placeId: z.string().min(1),
  amount: z.number().nonnegative(),
  fileKey: z.string().min(3), // Storage key for uploaded file
});

export async function POST(req: NextRequest) {
  // Parse request body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PARAMS',
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  // Apply rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = await rateLimit('receipts_upload', ip);

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

  const { placeId, amount, fileKey } = parsed.data;

  try {
    // TODO: Replace 'current' with actual user ID from session
    const userId = 'current';

    // Verify place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      return NextResponse.json({ error: 'PLACE_NOT_FOUND' }, { status: 404 });
    }

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        placeId,
        amount,
        fileKey,
        ocrStatus: 'pending',
      },
    });

    // Log for monitoring (no PII)
    console.log(
      `Receipt uploaded - place: ${placeId}, ` + `amount: ${amount}, receiptId: ${receipt.id}`
    );

    return NextResponse.json(
      {
        receiptId: receipt.id,
        ocrStatus: receipt.ocrStatus,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      }
    );
  } catch (error) {
    console.error('Receipt upload error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

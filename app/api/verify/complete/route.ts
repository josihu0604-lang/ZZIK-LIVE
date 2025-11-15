import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  placeId: z.string().min(1),
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
  const rl = await rateLimit('verify_complete', ip);

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

  const { placeId } = parsed.data;

  try {
    // TODO: Replace 'current' with actual user ID from session
    const userId = 'current';

    // Get verification status
    const verification = await prisma.verification.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    });

    // Extract verification flags
    const gpsOk = verification?.gpsOk ?? false;
    const qrOk = verification?.qrOk ?? false;
    const receiptOk = verification?.receiptOk ?? false;

    // Apply reward policy: GPS required + (QR OR Receipt)
    const allowed = gpsOk && (qrOk || receiptOk);

    // Log verification result
    console.log(
      `Verification complete - place: ${placeId}, ` +
        `gps: ${gpsOk}, qr: ${qrOk}, receipt: ${receiptOk}, ` +
        `allowed: ${allowed}`
    );

    return NextResponse.json(
      {
        allowed,
        gpsOk,
        qrOk,
        receiptOk,
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
    console.error('Verification complete error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

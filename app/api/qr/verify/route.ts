import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sha256 } from '@/lib/hash';
import { rateLimit } from '@/lib/server/rate-limit';
import { withIdempotency } from '@/lib/server/idempotency';
import { randomUUID } from 'crypto';

const schema = z.object({
  token: z.string().min(8).max(256),
  placeId: z.string().min(1),
  locGeohash5: z.string().length(5),
});

type VerificationState = 'ok' | 'expired' | 'used' | 'invalid';

interface VerifyResult {
  state: VerificationState;
}

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const requestId = randomUUID();

  // Parse request body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PARAMS',
        details: parsed.error.flatten(),
      },
      {
        status: 422,
        headers: {
          'X-Request-Id': requestId,
        },
      }
    );
  }

  // Check for idempotency key
  const idemKey = req.headers.get('idempotency-key');
  if (!idemKey) {
    return NextResponse.json(
      { error: 'IDEMPOTENCY_KEY_REQUIRED' },
      {
        status: 422,
        headers: {
          'X-Request-Id': requestId,
        },
      }
    );
  }

  // Apply rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = await rateLimit('qr_verify', ip);

  if (rl.used > rl.limit) {
    return NextResponse.json(
      { error: 'RATE_LIMIT' },
      {
        status: 429,
        headers: {
          'X-Request-Id': requestId,
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(rl.reset),
        },
      }
    );
  }

  const { token, placeId, locGeohash5 } = parsed.data;

  // Execute verification with idempotency
  const exec = async (): Promise<VerifyResult> => {
    const tokenHash = sha256(token);

    try {
      // Find the QR token
      const qrToken = await prisma.qRToken.findUnique({
        where: { codeHash: tokenHash },
      });

      if (!qrToken) {
        return { state: 'invalid' };
      }

      // Verify place ID matches
      if (qrToken.placeId !== placeId) {
        return { state: 'invalid' };
      }

      // Check if already used
      if (qrToken.status === 'used') {
        return { state: 'used' };
      }

      // Check if revoked or other invalid status
      if (qrToken.status !== 'issued') {
        return { state: 'invalid' };
      }

      // Check expiration
      const ageSec = Math.floor((Date.now() - new Date(qrToken.createdAt).getTime()) / 1000);

      if (ageSec > qrToken.ttlSec) {
        // Update status to expired
        await prisma.qRToken.update({
          where: { id: qrToken.id },
          data: { status: 'expired' },
        });
        return { state: 'expired' };
      }

      // Success - mark as used and update verification
      // TODO: Replace 'current' with actual user ID from session
      const userId = 'current';

      await prisma.$transaction([
        // Mark QR token as used
        prisma.qRToken.update({
          where: { id: qrToken.id },
          data: {
            status: 'used',
            usedAt: new Date(),
          },
        }),
        // Update or create verification record
        prisma.verification.upsert({
          where: {
            userId_placeId: {
              userId,
              placeId,
            },
          },
          update: { qrOk: true },
          create: {
            userId,
            placeId,
            qrOk: true,
          },
        }),
      ]);

      // Log geohash5 for analytics (privacy-preserving)
      console.log(`QR verification success - place: ${placeId}, geohash5: ${locGeohash5}`);

      return { state: 'ok' };
    } catch (error) {
      console.error('QR verification error:', error);
      return { state: 'invalid' };
    }
  };

  // Execute with idempotency
  const { replay, value } = await withIdempotency(
    `qr:${idemKey}`,
    exec,
    60 * 60 * 24 // 24 hours
  );

  const t1 = performance.now();
  const duration = (t1 - t0).toFixed(1);

  // Return response
  return NextResponse.json(
    { status: value.state },
    {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(rl.reset),
        'X-Verification-State': value.state,
        'X-Idempotent-Replay': replay ? '1' : '0',
        'Server-Timing': `app;dur=${duration}`,
      },
    }
  );
}

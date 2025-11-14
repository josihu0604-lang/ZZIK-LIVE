import 'server-only';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withIdempotency } from '@/lib/server/idempotency';
import { rateLimit } from '@/lib/server/rate-limit';
import { z } from 'zod';

const schema = z.object({ 
  voucherId: z.string().min(1).max(50)
});

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  
  // Parse and validate body
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

  // Check for Idempotency-Key header
  const idemKey = req.headers.get('idempotency-key');
  if (!idemKey) {
    return NextResponse.json(
      { error: 'IDEMPOTENCY_KEY_REQUIRED' }, 
      { status: 422 }
    );
  }

  // Apply rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rl = await rateLimit('wallet_redeem', ip, 60, 60); // 60 requests per minute
  
  if (rl.used > rl.limit) {
    return NextResponse.json(
      { error: 'RATE_LIMIT' }, 
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(rl.reset - Math.floor(Date.now() / 1000))
        }
      }
    );
  }

  // Execute with idempotency
  const exec = async () => {
    const voucher = await prisma.voucher.findUnique({ 
      where: { id: parsed.data.voucherId } 
    });
    
    if (!voucher) {
      return { ok: false, reason: 'not_found' as const };
    }
    
    if (voucher.status === 'used') {
      return { ok: true, state: 'used' as const, usedAt: voucher.usedAt };
    }
    
    if (voucher.status !== 'issued') {
      return { ok: false, reason: 'invalid_state' as const, currentState: voucher.status };
    }

    // Check expiration
    if (voucher.expiresAt < new Date()) {
      // Update status to expired
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'expired' }
      });
      return { ok: false, reason: 'expired' as const };
    }

    // Redeem the voucher
    const updated = await prisma.voucher.update({
      where: { id: voucher.id },
      data: { 
        status: 'used', 
        usedAt: new Date() 
      }
    });
    
    return { 
      ok: true, 
      state: 'used' as const, 
      usedAt: updated.usedAt,
      voucherId: updated.id,
      offerId: updated.offerId
    };
  };

  // Use idempotency wrapper with 24 hour TTL
  const { replay, value } = await withIdempotency(
    `redeem:${idemKey}:${parsed.data.voucherId}`, 
    exec, 
    60 * 60 * 24
  );
  
  const t1 = performance.now();
  const duration = (t1 - t0).toFixed(1);

  // Generate request ID for tracing
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  return NextResponse.json(value, {
    status: value.ok ? 200 : 422,
    headers: {
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(rl.reset),
      'X-Idempotent-Replay': replay ? '1' : '0',
      'X-Request-Id': requestId,
      'Server-Timing': `app;dur=${duration}`
    }
  });
}
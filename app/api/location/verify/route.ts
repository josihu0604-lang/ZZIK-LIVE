// app/api/location/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/server/idempotency';
import { checkRate, withRateHeaders } from '@/lib/server/rate-limit';
import { log } from '@/lib/server/logger';
import { verifyLocation } from '@/lib/location/verification';

/**
 * Location Verification Endpoint with Idempotency
 * 1. Rate limiting: 20 req/min per IP
 * 2. Idempotency: Required for all requests
 * 3. Distance verification: ≤ 100m from claimed location
 * 4. 4-state management: pending -> processing -> success/failed
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'unknown';

  // Rate limiting (20 requests per minute per IP)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rateMeta = await checkRate('location', ip, 20, 60);
  const allowed = rateMeta.remaining >= 0;

  if (!allowed) {
    log('warn', 'location.verify.rate_limited', {
      ip,
      request_id: requestId,
    });
    const res = new NextResponse('Too Many Requests', { status: 429 });
    return withRateHeaders(res, rateMeta);
  }

  // Idempotency key required
  const idemKey = req.headers.get('idempotency-key') ?? '';

  const idemResult = await withIdempotency(idemKey, async () => {
    try {
      // Safely parse JSON
      let body;
      try {
        body = await req.json();
      } catch (_parseError) {
        log('warn', 'location.verify.invalid_json', {
          request_id: requestId,
          took_ms: Date.now() - started,
        });

        const res = new NextResponse(
          JSON.stringify({ state: 'failed', message: 'Invalid JSON payload' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        return withRateHeaders(res, rateMeta);
      }

      const { placeId, userGeohash5, userId } = body;

      // Validation
      if (!placeId || !userGeohash5) {
        log('warn', 'location.verify.invalid_payload', {
          request_id: requestId,
          took_ms: Date.now() - started,
        });

        const res = new NextResponse(
          JSON.stringify({ state: 'failed', message: 'Missing required fields' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        return withRateHeaders(res, rateMeta);
      }

      // Perform location verification
      const result = await verifyLocation(placeId, userGeohash5, userId);

      log('info', 'location.verify.completed', {
        state: result.state,
        request_id: requestId,
        place_id: placeId,
        distance: result.distance,
        took_ms: Date.now() - started,
      });

      const res = new NextResponse(
        JSON.stringify({
          state: result.state,
          message: result.message,
          distance: result.distance,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );

      return withRateHeaders(res, rateMeta);
    } catch (error: any) {
      log('error', 'location.verify.failed', {
        error: error?.message,
        request_id: requestId,
        took_ms: Date.now() - started,
      });

      const res = new NextResponse(
        JSON.stringify({ state: 'failed', message: 'Verification failed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

      return withRateHeaders(res, rateMeta);
    }
  });

  return idemResult.value;
}

// Explicitly block other methods
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

// app/api/receipt/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/server/idempotency';
import { checkRate, withRateHeaders } from '@/lib/server/rate-limit';
import { log } from '@/lib/server/logger';
import { verifyReceipt } from '@/lib/receipt/verification';

/**
 * Receipt Verification Endpoint with Idempotency
 * 1. Rate limiting: 5 req/min per IP (OCR is expensive)
 * 2. Idempotency: Required for all requests
 * 3. OCR result caching to prevent duplicate processing
 * 4. 4-state management: pending -> processing -> success/failed
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'unknown';

  // Rate limiting (5 requests per minute per IP - OCR is expensive)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { allowed, ...rateMeta } = await checkRate(`receipt:${ip}`, 5, 60);

  if (!allowed) {
    log('warn', 'receipt.verify.rate_limited', {
      ip,
      request_id: requestId,
    });
    const res = new NextResponse('Too Many Requests', { status: 429 });
    return withRateHeaders(res, rateMeta);
  }

  // Idempotency key required
  const idemKey = req.headers.get('idempotency-key') ?? '';

  return withIdempotency(idemKey, async () => {
    try {
      const body = await req.json();
      const { userId, placeId, mediaUrl, expectedTotal } = body;

      // Validation
      if (!userId || !placeId || !mediaUrl) {
        log('warn', 'receipt.verify.invalid_payload', {
          request_id: requestId,
          took_ms: Date.now() - started,
        });

        const res = new NextResponse(
          JSON.stringify({ 
            state: 'failed', 
            message: 'Missing required fields: userId, placeId, mediaUrl' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        return withRateHeaders(res, rateMeta);
      }

      // Perform receipt verification with OCR
      const result = await verifyReceipt({
        userId,
        placeId,
        mediaUrl,
        expectedTotal,
      });

      log('info', 'receipt.verify.completed', {
        state: result.state,
        request_id: requestId,
        user_id: userId,
        place_id: placeId,
        ocr_confidence: result.confidence,
        took_ms: Date.now() - started,
      });

      const res = new NextResponse(
        JSON.stringify({
          state: result.state,
          message: result.message,
          ocrData: result.ocrData,
          confidence: result.confidence,
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
      log('error', 'receipt.verify.failed', {
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
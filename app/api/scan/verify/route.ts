import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { VerifyPolicy, type VerifyFail } from '@/lib/policy';
import { ScanVerifyReq } from '@/lib/z';
import { verifySignedQr } from '@/lib/qr';
import { enqueue } from '@/lib/queue';
import { enqueueSettlement } from '@/lib/redis-queue';
import { upsertVerification } from '@/lib/db/verification';

export const runtime = 'nodejs';

/**
 * Haversine 거리 계산 (미터 단위)
 */
const withinMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa =
    s1 * s1 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
};

// TODO: DB에서 매장 정보 읽기 (현재는 데모 데이터)
const STORES: Record<string, { lat: number; lng: number; radius: number }> = {
  gangnam: { lat: 37.4979, lng: 127.0276, radius: 120 },
  seongsu: { lat: 37.5446, lng: 127.0565, radius: 120 },
  hongdae: { lat: 37.5563, lng: 126.9220, radius: 120 },
};

/**
 * QR 스캔 검증 API (삼중 검증: GPS + QR + 영수증)
 * POST /api/scan/verify
 */
export async function POST(req: NextRequest) {
  try {
    const body = ScanVerifyReq.parse(await req.json());

    // 1) QR 파싱: ZZIK|storeId|missionId|ts|nonce|sig
    const parts = body.raw.split('|');
    if (parts.length < 6) {
      return NextResponse.json(
        { ok: false, reason: 'MALFORMED' satisfies VerifyFail },
        { status: 422 }
      );
    }

    const [vendor, storeId, missionId, tsStr] = parts;
    if (vendor !== 'ZZIK') {
      return NextResponse.json(
        { ok: false, reason: 'MALFORMED' as VerifyFail },
        { status: 422 }
      );
    }

    // 2) 만료 검증
    const now = Date.now();
    const qrTs = Number(tsStr || 0);
    if (!qrTs || now - qrTs > VerifyPolicy.qr.expiryMs) {
      return NextResponse.json(
        { ok: false, reason: 'EXPIRED' as VerifyFail },
        { status: 410 }
      );
    }

    // 3) 서명 검증
    if (VerifyPolicy.qr.requireSignature && !verifySignedQr(body.raw)) {
      return NextResponse.json(
        { ok: false, reason: 'SIGNATURE' as VerifyFail },
        { status: 422 }
      );
    }

    // 4) 매장 지오펜스 검증
    const store = STORES[storeId];
    if (!store) {
      return NextResponse.json(
        { ok: false, reason: 'MALFORMED' as VerifyFail },
        { status: 422 }
      );
    }

    let near = false;
    let distance = Infinity;

    if (body.location?.lat && body.location?.lng) {
      distance = withinMeters(
        { lat: body.location.lat, lng: body.location.lng },
        { lat: store.lat, lng: store.lng }
      );
      const margin = Math.min(
        VerifyPolicy.geo.maxAccuracyM,
        body.location.accuracy ?? 0
      );
      const radius = store.radius ?? VerifyPolicy.geo.defaultRadiusM;
      near = distance <= radius + margin;
    }

    if (!near) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'GEOFENCE' as VerifyFail,
          geofence: {
            center: { lat: store.lat, lng: store.lng },
            radius: store.radius ?? VerifyPolicy.geo.defaultRadiusM,
            distance,
          },
        },
        { status: 403 }
      );
    }

    // 5) 영수증 검증 (정책에 따라 필수 여부 결정)
    if (VerifyPolicy.receipt.required && !body.evidence?.receiptId) {
      return NextResponse.json(
        { ok: false, reason: 'RULE' as VerifyFail },
        { status: 422 }
      );
    }

    // 6) Database에 검증 결과 저장
    // TODO: 실제 인증 시스템 연동 시 req.headers에서 userId 추출
    const userId = 'demo-user'; // 임시 사용자 ID
    
    // Prepare GPS metadata
    const gpsMetadata = body.location ? {
      accuracy: body.location.accuracy ?? -1,
      confidence: body.location.confidence ?? 0,
      distance: Math.round(distance),
      ts: Date.now(),
    } : null;
    
    await upsertVerification({
      userId,
      placeId: storeId,
      gpsOk: true, // GPS 검증 통과
      qrOk: true, // QR 검증 통과
      receiptOk: !!body.evidence?.receiptId, // 영수증 있으면 true
      gpsMetadata,
    });

    // 7) 정산 큐 등록 (Bull Queue - Redis 기반 영속적 큐)
    const amount = 5800; // TODO: 미션/캠페인별 금액 규칙
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`ms:${userId}:${storeId}:${missionId}:${amount}`)
      .digest('hex');

    // Redis Queue로 정산 작업 등록 (자동 재시도 + DLQ)
    await enqueueSettlement({
      userId,
      placeId: storeId,
      missionId,
      amount,
      idempotencyKey,
      metadata: {
        qrToken: body.raw,
        receiptId: body.evidence?.receiptId,
      },
    });

    return NextResponse.json({
      ok: true,
      missionId,
      nextAction: 'SETTLEMENT_ENQUEUED',
      verification: {
        gpsOk: true,
        qrOk: true,
        receiptOk: !!body.evidence?.receiptId,
      },
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'MALFORMED' as VerifyFail },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, reason: 'MALFORMED' as VerifyFail },
      { status: 400 }
    );
  }
}

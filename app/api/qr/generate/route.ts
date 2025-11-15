import { NextRequest, NextResponse } from 'next/server';
import QR from 'qrcode';
import { generateSignedQr } from '@/lib/qr';

export const runtime = 'nodejs';

/**
 * 서명된 QR 코드 생성
 * GET /api/qr/generate?storeId=xxx&missionId=xxx&format=json|png
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const missionId = searchParams.get('missionId');
  const format = (searchParams.get('format') || 'json').toLowerCase();

  if (!storeId || !missionId) {
    return NextResponse.json(
      { error: 'storeId and missionId required' },
      { status: 400 }
    );
  }

  const { full } = generateSignedQr(storeId, missionId);

  if (format === 'png') {
    const png = await QR.toBuffer(full, {
      type: 'png',
      errorCorrectionLevel: 'M',
      width: 512,
    });
    return new NextResponse(png as unknown as BodyInit, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  }

  return NextResponse.json({ qr: full });
}

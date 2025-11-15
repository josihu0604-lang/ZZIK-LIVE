import crypto from 'crypto';

/**
 * 서명된 QR 생성 및 검증
 * 포맷: ZZIK|storeId|missionId|ts|nonce|sig
 */

export function buildQrPayload(
  storeId: string,
  missionId: string,
  ts: number,
  nonce: string
): string {
  return `ZZIK|${storeId}|${missionId}|${ts}|${nonce}`;
}

export function signQrPayload(
  payload: string,
  secret: string = process.env.ZZIK_API_SIGN_SECRET!
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
}

export function generateSignedQr(
  storeId: string,
  missionId: string
): {
  full: string;
  ts: number;
  nonce: string;
  sig: string;
} {
  const ts = Date.now();
  const nonce = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const base = buildQrPayload(storeId, missionId, ts, nonce);
  const sig = signQrPayload(base);
  const full = `${base}|${sig}`;
  
  return { full, ts, nonce, sig };
}

export function verifySignedQr(
  full: string,
  secret: string = process.env.ZZIK_API_SIGN_SECRET!
): boolean {
  const parts = full.split('|');
  if (parts.length < 6) return false;
  
  const sig = parts.pop()!;
  const base = parts.join('|');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(base)
    .digest('base64url');
  
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  
  return (
    sigBuf.length === expBuf.length &&
    crypto.timingSafeEqual(sigBuf, expBuf)
  );
}

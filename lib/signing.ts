import crypto from 'crypto';

/**
 * HMAC SHA256 서명 생성
 */
export function hmacSign(body: string, secret: string): string {
  return 'v1=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * HMAC SHA256 서명 검증 (타이밍 안전)
 */
export function hmacVerify(
  sigHeader: string | null | undefined,
  body: string,
  secret: string
): boolean {
  if (!sigHeader) return false;
  const expected = hmacSign(body, secret);
  const a = Buffer.from(sigHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

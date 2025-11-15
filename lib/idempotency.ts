/**
 * 멱등성 키 저장소 (개발용 메모리 / 운영은 Redis 권장)
 */
const mem = new Map<string, number>(); // key -> expireTimestamp

/**
 * 멱등성 키 락 획득 시도
 */
export async function idempTryLock(
  key: string,
  ttlMs: number = 60_000
): Promise<boolean> {
  const now = Date.now();
  
  // 만료된 키 정리
  for (const [k, exp] of [...mem.entries()]) {
    if (exp < now) mem.delete(k);
  }
  
  // 이미 락이 있으면 실패
  if (mem.has(key)) return false;
  
  // 락 설정
  mem.set(key, now + ttlMs);
  return true;
}

/**
 * 멱등성 키 락 해제
 */
export async function idempUnlock(key: string): Promise<void> {
  mem.delete(key);
}

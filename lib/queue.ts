/**
 * 정산 큐 시스템 (메모리 + DLQ + 지수 백오프)
 * 운영 환경에서는 Redis/SQS로 교체 권장
 */

export type Job<T = any> = {
  id: string;
  type: 'settlement';
  payload: T;
  attempts: number;
  nextAt: number; // due timestamp
  maxAttempts: number;
};

const Q: Job[] = [];
const DLQ: Job[] = [];

/**
 * 큐에 작업 추가
 */
export async function enqueue(
  job: Omit<Job, 'attempts' | 'nextAt'> & Partial<Pick<Job, 'attempts' | 'nextAt'>>
): Promise<void> {
  Q.push({
    attempts: job.attempts ?? 0,
    nextAt: job.nextAt ?? Date.now(),
    ...job,
  } as Job);
}

/**
 * 실행 준비된 작업 가져오기
 */
export async function popReady(
  type: Job['type'],
  limit: number = 10
): Promise<Job[]> {
  const now = Date.now();
  const picked: Job[] = [];
  
  for (let i = Q.length - 1; i >= 0 && picked.length < limit; i--) {
    if (Q[i].type === type && Q[i].nextAt <= now) {
      picked.push(...Q.splice(i, 1));
    }
  }
  
  return picked;
}

/**
 * 실패한 작업을 지수 백오프로 재큐잉
 */
export async function requeueBackoff(job: Job): Promise<void> {
  const backoff = Math.min(60_000, 2 ** job.attempts * 1000); // 최대 60초
  job.nextAt = Date.now() + backoff;
  Q.push(job);
}

/**
 * Dead Letter Queue로 이동
 */
export async function pushDLQ(job: Job, error?: string): Promise<void> {
  if (error) (job as any).error = error;
  DLQ.push(job);
}

/**
 * DLQ 목록 조회
 */
export async function listDLQ(n: number = 50): Promise<Job[]> {
  return DLQ.slice(-n);
}

/**
 * DLQ에서 재큐잉
 */
export async function requeueFromDLQ(idx: number): Promise<boolean> {
  const job = DLQ.splice(idx, 1)[0];
  if (!job) return false;
  
  job.attempts = 0;
  job.nextAt = Date.now();
  Q.push(job);
  return true;
}

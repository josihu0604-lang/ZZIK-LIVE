# ZZIK LIVE vNext 로드맵

**기준 날짜:** 2024-11-13  
**현재 상태:** UI 하드닝 완료 (PR #1)

---

## 🎯 전체 개요

UI와 기본 하드닝이 완료된 상태에서, vNext는 다음 3개 핵심 PR로 제품 가치를 실현합니다:

1. **PR #20: DB 통합 & 스모크** - 데이터 레이어 구축
2. **PR #17: Mapbox Core + Search 1.0** - 핵심 기능 최적화
3. **PR #18: QR & Wallet 완성도** - 사용자 경험 완성

---

## 📋 Phase 1: DB 통합 & 스모크 (PR #20)

### 목표

실제 데이터로 동작하는 시스템 구축 및 성능 기준선 확립

### 작업 항목

#### 1.1 인프라 설정

- [x] Docker Compose (Postgres16+PostGIS + Redis)
- [x] PostGIS 확장 자동 설치 스크립트
- [x] DB 셋업 자동화 스크립트 (`scripts/db-setup.sh`)

#### 1.2 Prisma 스키마 강화

```prisma
model Place {
  id         String   @id @default(uuid())
  name       String
  geohash6   String   @db.VarChar(6)
  geom       Unsupported("geometry(Point, 4326)")?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([geohash6])
  @@index([created_at(sort: Desc)])
  // GIST index on geom (added via migration SQL)
}
```

#### 1.3 K6 성능 테스트

- [x] 종합 API 테스트 스크립트 (`k6/api-comprehensive.js`)
- [ ] 성능 예산 달성:
  - `/api/offers`: p95 ≤ 150ms
  - `/api/wallet/summary`: p95 ≤ 100ms
  - `/api/search`: p95 ≤ 120ms
  - `/api/qr/verify`: p95 ≤ 800ms
  - `/api/places/nearby`: p95 ≤ 100ms

#### 1.4 수락 기준 (AC)

- [ ] 모든 라우트 2xx 또는 예상된 4xx 응답 (5xx = 0)
- [ ] K6 결과 Markdown 표 커밋
- [ ] 데이터베이스 마이그레이션 무손실 실행
- [ ] 시드 데이터 100+ 레코드 생성 확인

### 예상 소요 시간

**3-5일**

---

## 🗺️ Phase 2: Mapbox Core + Search 1.0 (PR #17)

### 목표

9셀 프리페치와 고도화된 검색 알고리즘으로 사용자 경험 향상

### 작업 항목

#### 2.1 9셀 프리페치 전략

- [x] `lib/map/nine-cell-prefetch.ts` 구현
- [ ] 중앙 + 8방향 셀 동시 페치
- [ ] 캐시 키: `geohash6|zoom|ver`
- [ ] TTL: 60초 (메모리 캐시, 추후 Redis로 전환)

#### 2.2 Supercluster Web Worker

```typescript
// workers/map-cluster.worker.ts
import Supercluster from 'supercluster';

self.onmessage = (e) => {
  const { points, bounds, zoom } = e.data;
  const index = new Supercluster({ radius: 40, maxZoom: 16 });
  index.load(points);
  const clusters = index.getClusters(bounds, zoom);
  self.postMessage({ clusters });
};
```

#### 2.3 마커 Diff 렌더링

- [ ] 이전 마커 상태 추적
- [ ] 추가/삭제/업데이트만 DOM 조작
- [ ] `map.moveend`/`map.zoomend` 100ms throttle

#### 2.4 Search 1.0 점수식

- [x] `lib/search/scoring.ts` 구현
- [ ] BM25 유사 텍스트 관련성 (50%)
- [ ] 지리적 근접성 선형 감쇠 (30%)
- [ ] 인기도 로그 스케일링 (20%)
- [ ] 나이 페널티 지수 감쇠 (10%)
- [ ] 캐시 키: `q|geohash5|radius|lang|ver`

#### 2.5 `/api/places/nearby` 최적화

```sql
-- SQL with ST_DWithin and GIST index
SELECT id, name, ST_AsText(geom) as location,
       ST_Distance(geom, ST_GeogFromText('POINT(lng lat)')) as distance_m
FROM places
WHERE ST_DWithin(
  geom,
  ST_GeogFromText('POINT(lng lat)'),
  5000 -- 5km max radius
)
ORDER BY distance_m
LIMIT 25;
```

#### 2.6 수락 기준 (AC)

- [ ] 9셀 프리페치 캐시 히트율 ≥70%
- [ ] 마커 diff 렌더: 업데이트 시 DOM 조작 ≤10%
- [ ] Search p95 ≤ 80ms, p99 ≤ 150ms
- [ ] Nearby p95 ≤ 100ms
- [ ] Map pan/zoom 60fps 유지 (Chrome DevTools Performance 확인)

### 예상 소요 시간

**5-7일**

---

## 📱 Phase 3: QR & Wallet 완성도 (PR #18)

### 목표

4상태 UX 완성 및 Wallet 고성능 렌더링

### 작업 항목

#### 3.1 QR 4상태 UX 강화

```typescript
// QR 상태별 UI
type QRState = 'success' | 'already_used' | 'expired' | 'invalid';

const stateConfig: Record<QRState, StateConfig> = {
  success: {
    icon: '✅',
    title: '검증 성공!',
    message: '포인트가 적립되었습니다.',
    action: { label: '내 지갑 보기', href: '/wallet' },
    haptic: [50, 100, 50], // 성공 패턴
  },
  already_used: {
    icon: '⚠️',
    title: '이미 사용된 QR 코드',
    message: '이 코드는 이미 사용되었습니다.',
    action: { label: '다른 오퍼 보기', href: '/offers' },
    haptic: [100], // 경고
  },
  expired: {
    icon: '⏰',
    title: '기한 만료',
    message: '이 오퍼는 만료되었습니다.',
    action: { label: '비슷한 오퍼 찾기', href: '/offers?category=similar' },
    haptic: [100],
  },
  invalid: {
    icon: '❌',
    title: '인식 실패',
    message: '조명을 확인하고 QR 코드를 화면 중앙에 맞춰주세요.',
    action: { label: '다시 시도', onClick: () => retry() },
    haptic: [50, 50],
  },
};
```

#### 3.2 멱등성 및 리트라이 UX

- [ ] 요청 중 버튼 비활성화 (`isSubmitting` 상태)
- [ ] 실패 시 새 `Idempotency-Key` 생성 (재사용 금지)
- [ ] 네트워크 에러 시 자동 재시도 (최대 3회, exponential backoff)
- [ ] 타임아웃 경고 토스트 (≥800ms 소요 시)

#### 3.3 Wallet 임박 정렬 & 페이지네이션

```typescript
// Keyset pagination for Wallet
const getVouchers = async (cursor?: string, limit = 20) => {
  const vouchers = await prisma.voucher.findMany({
    where: {
      userId: currentUserId,
      status: { in: ['active', 'expiring_soon'] },
    },
    orderBy: [
      { expiresAt: 'asc' }, // Expiring first
      { id: 'desc' }, // Tie-breaker
    ],
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = vouchers.length > limit;
  const items = hasMore ? vouchers.slice(0, -1) : vouchers;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
};
```

#### 3.4 오프스크린 프리페치

- [ ] Intersection Observer로 하단 1페이지 감지
- [ ] 스크롤 도달 전 자동 페치
- [ ] 스켈레톤 상태 표시
- [ ] 60fps 유지 (1,000+ 행)

#### 3.5 수락 기준 (AC)

- [ ] QR 4상태 모두 구현 및 haptic 피드백 동작
- [ ] 멱등성 키 재사용 0건 (로그 검증)
- [ ] Wallet 스크롤 60fps (1,000+ vouchers, Chrome DevTools)
- [ ] 임박 ≤7일 vouchers 상단 고정 확인
- [ ] 키셋 페이지네이션 정확성 (중복/누락 0건)

### 예상 소요 시간

**4-6일**

---

## 🚀 Phase 4: 파이프라인 & 게이트 강화

### 목표

CI/CD 완전 자동화 및 품질 게이트 확립

### 작업 항목

#### 4.1 ESLint Peer Dependency 해결

```json
// package.json
{
  "devDependencies": {
    "eslint": "9.12.0",
    "eslint-config-next": "15.0.0"
  },
  "overrides": {
    "eslint": "9.12.0"
  }
}
```

- [ ] `npm run lint:why` 실행 및 충돌 체인 확인
- [ ] 버전 동기화
- [ ] CI에서 `eslint --print-config` 검증

#### 4.2 GitHub Actions 워크플로우

- [x] `verify-pr.yml` - PR 게이트 (type/lint/format/coverage/privacy/headers)
- [x] `k6-performance.yml` - 성능 테스트 (일일 실행 + 수동 트리거)
- [x] `accessibility.yml` - a11y 회귀 테스트 (axe-core 통합 예정)

#### 4.3 수락 기준 (AC)

- [ ] 모든 워크플로우 올그린 (0 실패)
- [ ] PR 코멘트에 자동 결과 표시
- [ ] K6 결과 아티팩트 업로드
- [ ] Coverage 80% 미만 시 PR 블록

### 예상 소요 시간

**2-3일**

---

## 📊 진행 상황 추적

### Phase 완료 현황

| Phase      | PR  | 상태      | 완료일     | 담당자       |
| ---------- | --- | --------- | ---------- | ------------ |
| UI 하드닝  | #1  | ✅ 완료   | 2024-11-13 | AI Assistant |
| DB 통합    | #20 | 🔄 준비   | -          | -            |
| Map+Search | #17 | 🔄 준비   | -          | -            |
| QR+Wallet  | #18 | ⏳ 대기   | -          | -            |
| 파이프라인 | -   | 🔄 진행중 | -          | -            |

### 다음 작업 우선순위

1. **즉시 실행 (병렬 가능)**
   - [ ] PR #20 생성 및 DB 설정 스크립트 실행
   - [ ] PR #17 생성 및 9셀 프리페치 구현

2. **DB 완료 후**
   - [ ] K6 성능 테스트 실행 및 기준선 설정
   - [ ] Search 알고리즘 실제 데이터로 튜닝

3. **Map 완료 후**
   - [ ] PR #18 생성 및 QR/Wallet 완성도 작업

4. **모든 PR 머지 후**
   - [ ] ESLint 이슈 최종 해결
   - [ ] 파이프라인 완전 자동화

---

## 🎯 성공 지표

### Phase 1 완료 기준

- [x] DB 컨테이너 헬스체크 통과
- [ ] 마이그레이션 무손실 실행
- [ ] K6 모든 엔드포인트 예산 충족
- [ ] 시드 데이터 100+ 레코드

### Phase 2 완료 기준

- [ ] 9셀 캐시 히트율 ≥70%
- [ ] Search p95 ≤ 80ms
- [ ] Map 60fps 유지

### Phase 3 완료 기준

- [ ] QR 4상태 모두 동작
- [ ] Wallet 1,000+ 행 60fps
- [ ] 멱등성 100% 준수

### Phase 4 완료 기준

- [ ] CI 워크플로우 올그린
- [ ] ESLint 0 에러
- [ ] PR 자동 검증 완료

---

## 📝 상태 보고 템플릿

```markdown
### Day N 상태 (YYYY-MM-DD)

- **DB**: [상태]
- **Mapbox**: [상태]
- **Search**: [성능 지표]
- **QR/Wallet**: [완성도]
- **파이프라인**: [워크플로우 상태]
- **리스크**: [있음/없음, 상세]
- **다음**: [다음 작업 목록]
```

---

## 🚨 알려진 리스크 및 대응

### 리스크 1: DB 성능

- **증상**: p95 예산 초과
- **대응**: GIST 인덱스 추가, 쿼리 플랜 분석, 캐시 계층 도입

### 리스크 2: ESLint 충돌

- **증상**: Peer dependency 해결 실패
- **대응**: `overrides` 사용, 최신 `eslint-config-next` 버전 동기화

### 리스크 3: Map 성능 저하

- **증상**: 마커 많을 때 60fps 미달
- **대응**: Clustering 반경 조정, Web Worker 분리, diff 렌더링 최적화

---

**마지막 업데이트:** 2024-11-13  
**다음 리뷰:** Phase 1 완료 후

# ZZIK LIVE v2.0 제품급 설계 대비 구현 갭 분석

**분석 시점**: 2025-11-13  
**기준 문서**: ZZIK LIVE 4탭 제품급 설계 보강 문서 v2.0  
**현재 구현**: PR #1 (100% 기본 스펙 완료)

---

## 📊 전체 갭 요약

| 영역             | v2.0 요구사항       | 현재 구현      | 갭 상태               |
| ---------------- | ------------------- | -------------- | --------------------- |
| 0. 전역 규격     | ✅ 토큰/모션/접근성 | ✅ 기본 토큰   | 🟡 라이트/다크 미분리 |
| 1. 백엔드        | ✅ ERD/API/보안     | ❌ Mock only   | 🔴 **전체 미구현**    |
| 2. API 계약      | ✅ Zod 스키마/에러  | ❌ Mock 응답   | 🔴 **전체 미구현**    |
| 3. 화면/컴포넌트 | ✅ 상세 사양        | ✅ 기본 구현   | 🟡 일부 미세 조정     |
| 4. 상태 머신     | ✅ ASCII 다이어그램 | ❌ 미정의      | 🔴 **미구현**         |
| 5. 계측          | ✅ 스키마/규칙      | ✅ 기본 이벤트 | 🟡 배치/PII 규칙      |
| 6. 성능 예산     | ✅ 예산/최적화      | ✅ 기본 최적화 | 🟡 측정/모니터링      |
| 7. 테스트        | ✅ 유닛/통합/E2E    | ❌ 없음        | 🔴 **전체 미구현**    |
| 8. 보안/운영     | ✅ CSP/알림/롤아웃  | ❌ 없음        | 🔴 **미구현**         |
| 9. 마이크로카피  | ✅ 정의됨           | ✅ 대부분 적용 | 🟢 거의 완료          |
| 10. 수용 기준    | ✅ 정의됨           | ✅ 대부분 충족 | 🟡 검증 필요          |

**종합 점수 (정정)**:

- **관점 A (4탭 제품 기능)**: **50/100**
  - 프론트엔드: 80-85%
  - 백엔드(제품): 0%
  - 테스트(제품): 0%
  - 보안/운영: 20-25%

- **관점 B (레포 전체)**: **55-60/100**
  - 검색 백엔드: 60%
  - 테스트(전반): 10-20%
  - 보안/운영: 35-40%

**평가 근거**:

- "백엔드 0%"는 **4탭 제품(오퍼/QR/지갑) 기준 타당**
- 검색 API(/api/search), DQ 모니터링, 보안 헤더 등 **전역 자산은 이미 존재**
- 테스트 0%는 과소평가 (검색 통합 테스트, 부하 스크립트 보유)

---

## 🔴 Critical Gaps (High Priority)

### 1. 백엔드 데이터 모델 & API (0%)

**v2.0 요구사항**:

```sql
-- 7개 핵심 테이블
User, Place, Offer, OfferInbox, Voucher, QrToken, Ledger, Reel

-- 제약/인덱스
- OfferInbox: UNIQUE(user_id, offer_id) 멱등성
- Voucher: INDEX(status, expire_at)
- Place: geohash6 + GIST(geom)
- QrToken: UNIQUE(code_hash), CHECK(ttl 60-86400)
```

**현재 상태**: ❌ 없음 (Mock 데이터만)

**필요 작업**:

1. PostgreSQL + PostGIS 스키마 정의
2. Prisma/Drizzle ORM 설정
3. 마이그레이션 스크립트
4. Seed 데이터

**예상 시간**: 8-12시간

---

### 2. API 계약 구현 (0%)

**v2.0 요구사항**:

```typescript
// 8개 엔드포인트 + Zod 검증
GET  /api/offers?filter&cursor
POST /api/offers/:id/accept (Idempotency-Key)
GET  /api/wallet/summary
GET  /api/wallet/vouchers?status&cursor
GET  /api/wallet/ledger?cursor
POST /api/qr/verify
GET  /api/places/nearby?geohash5&radius
GET  /api/search?q&lat&lng&radius
```

**현재 상태**: ❌ 없음 (프론트엔드 Mock만)

**필요 작업**:

1. Next.js API Routes 구현
2. Zod 스키마 정의
3. 에러 핸들링 (공통 포맷)
4. 멱등성 키 처리
5. Rate limiting (30RPM/10RPM)

**예상 시간**: 12-16시간

---

### 3. 테스트 인프라 (0%)

**v2.0 요구사항**:

```yaml
유닛: tokenize 20케이스, score 10시나리오
통합: API 엔드포인트 필터/페이지네이션/멱등성
E2E: 핵심 플로우 (오퍼→지갑→QR)
부하: k6 60s/100QPS, p95≤80ms, p99≤120ms
```

**현재 상태**: ❌ 테스트 없음

**필요 작업**:

1. Vitest 설정 (유닛)
2. Playwright 설정 (E2E)
3. k6 스크립트 (부하)
4. 테스트 데이터 픽스처

**예상 시간**: 10-14시간

---

### 4. 상태 머신 정의 (0%)

**v2.0 요구사항**:

```
오퍼 수락:
idle → submitting → success{voucher_id} → invalidate(wallet)
                 └→ error{409|410|network}

QR 검증:
ready → detected → verifying → success|already_used|expired|invalid
```

**현재 상태**: ❌ 암묵적 상태만

**필요 작업**:

1. XState 또는 Zustand FSM 구현
2. 상태 전이 로직
3. 에러 복구 전략

**예상 시간**: 4-6시간

---

## 🟡 Medium Priority Gaps

### 5. 다크 모드 토큰 (30%)

**v2.0 요구사항**:

```css
:root.dark {
  --txt-prim: #f9fafb;
  --txt-sec: #d1d5db;
  --bg: #0b1220;
  --bg-muted: #0f172a;
  --card: #0f172a;
  --card-br: #1e293b;
  --overlay: rgba(2, 6, 23, 0.72);
}
```

**현재 상태**: 🟡 라이트 모드 토큰만

**필요 작업**:

1. `globals.css`에 `.dark` 토큰 추가
2. Tailwind `darkMode: 'class'` 설정
3. 다크 모드 토글 컴포넌트

**예상 시간**: 2-3시간

---

### 6. 계측 배치 전송 & PII 규칙 (60%)

**v2.0 요구사항**:

```typescript
// 배치 전송: 50 이벤트 / 10초 / 100KB
// PII 금지: 원본 좌표 → geohash5
// sendBeacon 우선
```

**현재 상태**: 🟡 기본 이벤트 전송, 배치 없음

**필요 작업**:

1. Analytics 배치 큐 구현
2. geohash 변환 (lat/lng → geohash5)
3. sendBeacon fallback

**예상 시간**: 3-4시간

---

### 7. 성능 모니터링 (40%)

**v2.0 요구사항**:

```yaml
LCP p75: ≤1.4-2.0s
INP p75: ≤200ms
CLS: ≤0.05
캐시: 오퍼/지갑 30s SWR
```

**현재 상태**: 🟡 최적화 적용, 측정 없음

**필요 작업**:

1. Web Vitals 계측 (`web-vitals` 라이브러리)
2. RUM (Real User Monitoring)
3. 성능 대시보드

**예상 시간**: 4-5시간

---

### 8. 보안 헤더 & CSP (0%)

**v2.0 요구사항**:

```
CSP: camera/map/analytics 도메인만
frame-ancestors 'none'
권한: 위치/카메라 3상태 UI
```

**현재 상태**: ❌ 없음

**필요 작업**:

1. `next.config.js` 헤더 설정
2. CSP 정책 정의
3. 권한 프롬프트 UI 개선

**예상 시간**: 2-3시간

---

## 🟢 Low Priority / Nearly Complete

### 9. 컴포넌트 미세 조정 (85%)

**필요 작업**:

- [ ] ReelTile: IO 기반 단일 재생 (1시간)
- [ ] QRScanner: 레이저 라인 애니메이션 (30분)
- [ ] OfferCard: 스켈레톤 로딩 6개 (30분)
- [ ] VoucherList: 정렬 임박순→최근발급 (15분)

**예상 시간**: 2-3시간

---

### 10. 마이크로카피 검증 (95%)

**현재 vs v2.0**:

- ✅ "장소, 체험권 검색…" → 구현됨
- ✅ "전체 지도 보기" → 구현됨
- ✅ "수락" / "나중에" → 구현됨
- 🟡 "QR 코드를 프레임에 맞춰 주세요" → 확인 필요
- ✅ 지갑 빈 상태 → 구현됨

**예상 시간**: 30분 (검증만)

---

## 📋 즉시 실행 목록 (v2.0 Section 12)

### ✅ 이미 완료된 항목

1. ~~오퍼 수락→지갑 반영→QR 검증 플로우~~ ✅ (Mock 레벨)
2. ~~미니지도→전체 지도 딥링크~~ ✅
3. ~~PlaceSheet→오퍼 CTA 연결~~ ✅

### 🔴 미완료 항목

4. **멱등 API 구현** (백엔드) → 0% ❌
5. **릴스 IO 단일 재생** → 0% ❌
6. **유닛/통합/E2E 테스트** → 0% ❌
7. **알림 임계값 설정** → 0% ❌

---

## 🎯 권장 실행 순서

### Phase 1: 백엔드 기반 (Critical)

**목표**: API 실제 작동, 멱등성 보장

1. **PostgreSQL + PostGIS 스키마** (8h)
   - 7개 테이블 생성
   - 제약/인덱스 적용
   - Seed 데이터

2. **API Routes 구현** (12h)
   - 8개 엔드포인트
   - Zod 검증
   - 멱등성 키 (Idempotency-Key)
   - Rate limiting

3. **상태 머신** (6h)
   - 오퍼 수락 FSM
   - QR 검증 FSM
   - 에러 복구

**Phase 1 Total**: 26시간 (3-4일)

---

### Phase 2: 테스트 & 품질 (Critical)

**목표**: 안정성 검증

4. **테스트 인프라** (10h)
   - Vitest 유닛 테스트
   - Playwright E2E
   - k6 부하 테스트

5. **성능 모니터링** (5h)
   - Web Vitals 계측
   - RUM 대시보드

**Phase 2 Total**: 15시간 (2일)

---

### Phase 3: 보안 & 운영 (Medium)

**목표**: 프로덕션 준비

6. **보안 헤더 & CSP** (3h)
7. **알림 임계값 설정** (2h)
8. **다크 모드** (3h)

**Phase 3 Total**: 8시간 (1일)

---

### Phase 4: 폴리싱 (Low)

**목표**: UX 완성도

9. **컴포넌트 미세 조정** (3h)
   - 릴스 IO 단일 재생
   - QR 레이저 라인
   - 스켈레톤 로딩

10. **계측 배치 & PII** (4h)

**Phase 4 Total**: 7시간 (1일)

---

## 📊 최종 요약

### 현재 상태

- **프론트엔드**: 90% ✅
- **백엔드**: 0% ❌
- **테스트**: 0% ❌
- **보안/운영**: 10% ❌

### 완전 구현까지

- **예상 시간**: **56시간** (7일 풀타임)
- **Critical Path**: Phase 1 (백엔드) → Phase 2 (테스트)

### 배포 가능 시점

- **MVP 배포 (Phase 1)**: +3-4일 (백엔드 완성)
- **Production Ready (Phase 1-3)**: +6-7일
- **100% v2.0 Spec**: +7-8일

---

## 🚨 즉시 시작해야 할 작업

### Option A: 백엔드 우선 (권장)

```bash
1. PostgreSQL + PostGIS 설정
2. Prisma/Drizzle ORM 스키마
3. API Routes 구현 시작
```

### Option B: 프론트엔드 폴리싱 (빠른 개선)

```bash
1. 릴스 IO 단일 재생
2. QR 레이저 애니메이션
3. 다크 모드 토큰
```

**추천**: Option A → 실제 작동하는 백엔드 없이는 v2.0 스펙 달성 불가

---

**다음 단계**: 어떤 Phase부터 시작할지 결정 필요

# ZZIK LIVE v2.0 구현 로드맵

**현재 상태**: 프론트엔드 90%, 백엔드 0%, 테스트 0%  
**목표**: v2.0 제품급 설계 100% 구현  
**예상 기간**: 7일 (56시간)

---

## 🎯 Phase별 우선순위

```
Phase 1 (Critical) → Phase 2 (Critical) → Phase 3 (Medium) → Phase 4 (Low)
    26시간             15시간              8시간             7시간
```

---

## 📅 Day-by-Day Plan

### Day 1-2: PostgreSQL + API 기반 (16h)

- [ ] PostgreSQL + PostGIS 설정
- [ ] 7개 테이블 스키마 (User/Place/Offer/OfferInbox/Voucher/QrToken/Ledger/Reel)
- [ ] Prisma/Drizzle ORM 설정
- [ ] 마이그레이션 & Seed 데이터

### Day 3-4: API Routes 구현 (16h)

- [ ] GET /api/offers (필터/커서)
- [ ] POST /api/offers/:id/accept (멱등)
- [ ] GET /api/wallet/summary
- [ ] GET /api/wallet/vouchers
- [ ] GET /api/wallet/ledger
- [ ] POST /api/qr/verify
- [ ] GET /api/places/nearby
- [ ] GET /api/search
- [ ] Zod 스키마 전체
- [ ] Rate limiting

### Day 5: 상태 머신 + 테스트 셋업 (8h)

- [ ] XState/Zustand FSM (오퍼 수락/QR 검증)
- [ ] Vitest 설정
- [ ] Playwright 설정
- [ ] 첫 테스트 작성

### Day 6: 테스트 작성 (8h)

- [ ] 유닛 테스트 (20+ 케이스)
- [ ] 통합 테스트 (API 엔드포인트)
- [ ] E2E 테스트 (핵심 플로우)
- [ ] k6 부하 테스트

### Day 7: 보안 & 폴리싱 (8h)

- [ ] CSP 헤더 설정
- [ ] 다크 모드 토큰
- [ ] 성능 모니터링 (Web Vitals)
- [ ] 릴스 IO 단일 재생
- [ ] 최종 검증

---

## 🚀 Quick Wins (빠른 개선, 우선 실행 가능)

**소요 시간**: 2-3시간  
**효과**: 사용자 경험 즉시 개선

### 1. 다크 모드 지원 (2h)

```bash
# globals.css에 토큰 추가
:root.dark {
  --txt-prim:#F9FAFB; --txt-sec:#D1D5DB;
  --bg:#0B1220; --bg-muted:#0F172A;
}

# Tailwind 설정
darkMode: 'class'

# 토글 컴포넌트
<DarkModeToggle />
```

### 2. 릴스 단일 재생 (1h)

```typescript
// IntersectionObserver로 가시 타일만 재생
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) playVideo(entry.target);
      else pauseVideo(entry.target);
    });
  },
  { threshold: 0.6 }
);
```

### 3. QR 레이저 애니메이션 (30min)

```css
.qr-laser {
  animation: scan 2s ease-in-out infinite;
}
@keyframes scan {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(100%);
  }
}
```

---

## 📊 완성도 추적

### 현재 (Day 0)

```
프론트엔드:  ████████████████████░░  90%
백엔드:      ░░░░░░░░░░░░░░░░░░░░░░   0%
테스트:      ░░░░░░░░░░░░░░░░░░░░░░   0%
보안/운영:   ██░░░░░░░░░░░░░░░░░░░░  10%
```

### 목표 (Day 7)

```
프론트엔드:  ████████████████████████ 100%
백엔드:      ████████████████████████ 100%
테스트:      ████████████████████████ 100%
보안/운영:   ████████████████████████ 100%
```

---

## 🔗 관련 문서

- **SPEC_V2_GAP_ANALYSIS.md**: 상세 갭 분석
- **FINAL_COMPLETION_SUMMARY.md**: 현재 구현 상태
- **PR #1**: https://github.com/josihu0604-lang/ASDASD/pull/1

---

## 🎬 시작 명령어

### Option A: 백엔드 우선 (권장)

```bash
# 1. PostgreSQL 컨테이너 시작
docker run -d \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=zzik \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# 2. Prisma 설정
npm install prisma @prisma/client
npx prisma init

# 3. 스키마 작성 시작
# prisma/schema.prisma
```

### Option B: Quick Wins 먼저

```bash
# 1. 다크 모드 토큰 추가
# app/globals.css 수정

# 2. 릴스 IO 구현
# components/pass/ReelsCarousel.tsx

# 3. QR 레이저 추가
# components/scan/QRScannerView.tsx
```

---

**추천**: Option A (백엔드) → 실제 API 없이는 v2.0 완성 불가

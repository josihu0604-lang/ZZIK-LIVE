# 📁 ZZIK LIVE - 프로젝트 파일 구조

## 📋 프로젝트 개요
Next.js 16 (Turbopack) 기반 PWA 앱 - 로컬 상점 체험권 구매 플랫폼

---

## 🗂️ 디렉토리 구조

```
webapp/
├── 📱 app/                          # Next.js App Router
│   ├── (tabs)/                      # 탭 기반 메인 화면 (레이아웃 그룹)
│   │   ├── layout.tsx              # 탭 레이아웃 + BottomTabBar
│   │   ├── pass/                   # 체험권 탐색 (릴스 + 지도)
│   │   ├── offers/                 # 오퍼 목록
│   │   ├── scan/                   # QR 스캔
│   │   └── wallet/                 # 지갑
│   │       └── passes/             # 보유 체험권 상세
│   ├── api/                         # API Routes
│   │   ├── analytics/              # 분석 이벤트 수집
│   │   ├── health/                 # 헬스 체크
│   │   ├── places/nearby/          # 근처 장소 검색
│   │   ├── search/                 # 통합 검색
│   │   └── wallet/                 # 지갑 관련 API
│   ├── auth/                        # 인증 화면
│   │   ├── login/                  # 로그인
│   │   ├── verify-otp/             # OTP 인증
│   │   └── permissions/            # 권한 요청
│   ├── splash/                      # 스플래시 화면
│   ├── layout.tsx                   # 루트 레이아웃
│   ├── page.tsx                     # 홈 (리다이렉트)
│   └── globals.css                  # 글로벌 스타일 (디자인 토큰)
│
├── 🧩 components/                   # 재사용 가능 컴포넌트
│   ├── auth/
│   │   └── AuthGate.tsx            # 인증 가드
│   ├── navigation/
│   │   ├── BottomTabBar.tsx        # 하단 탭 네비게이션
│   │   └── RouteTracker.tsx        # 라우트 추적 (분석용)
│   ├── offers/
│   │   └── OfferCard.tsx           # 오퍼 카드
│   ├── pass/
│   │   ├── FilterChips.tsx         # 필터 칩
│   │   ├── MiniMap.tsx             # 미니맵
│   │   ├── ReelsCarousel.tsx       # 릴스 캐러셀
│   │   └── SearchBar.tsx           # 검색 바
│   ├── scan/
│   │   └── QRScannerView.tsx       # QR 스캐너
│   ├── states/
│   │   ├── EmptyState.tsx          # 빈 상태
│   │   ├── ErrorState.tsx          # 에러 상태
│   │   └── LoadingState.tsx        # 로딩 상태
│   └── wallet/
│       └── WalletSummary.tsx       # 지갑 요약
│
├── 📚 lib/                          # 유틸리티 & 라이브러리
│   ├── analytics/                   # 분석 시스템
│   │   ├── client.ts               # 클라이언트 분석
│   │   └── schema.ts               # 분석 스키마
│   ├── server/                      # 서버 유틸리티
│   │   ├── idempotency.ts          # 멱등성 보장
│   │   ├── logger.ts               # 로거
│   │   ├── rate-limit.ts           # Rate Limiting
│   │   └── redis.ts                # Redis 클라이언트
│   ├── analytics.ts                # 분석 메인
│   ├── button-presets.ts           # 버튼 프리셋
│   ├── hash.ts                     # 해시 유틸
│   ├── prisma.ts                   # Prisma 클라이언트
│   ├── redis.ts                    # Redis 설정
│   └── search.ts                   # 검색 로직
│
├── 🎨 types/                        # TypeScript 타입 정의
│   └── index.ts                    # 전역 타입
│
├── 🧪 tests/                        # 테스트 코드
│   ├── e2e/                        # E2E 테스트 (Playwright)
│   │   ├── guest.guard.spec.ts
│   │   └── login.a11y.spec.ts
│   └── unit/                       # 단위 테스트 (Vitest)
│       └── server/
│
├── 📄 prisma/                       # 데이터베이스 스키마
│   └── schema.prisma               # Prisma 스키마
│
├── 🔧 scripts/                      # 스크립트
│   ├── auto-fix.sh
│   ├── dev-server-monitor.sh
│   ├── error-analyzer.sh
│   └── health-check.sh
│
├── 📖 docs/                         # API 문서
│   └── openapi.yaml
│
├── 🎯 Configuration Files
│   ├── next.config.ts              # Next.js 설정
│   ├── tsconfig.json               # TypeScript 설정
│   ├── eslint.config.mjs           # ESLint 설정
│   ├── playwright.config.ts        # Playwright 설정
│   ├── vitest.config.ts            # Vitest 설정
│   ├── postcss.config.mjs          # PostCSS 설정
│   ├── docker-compose.yml          # Docker Compose
│   ├── Dockerfile                  # Docker 이미지
│   ├── ecosystem.config.js         # PM2 설정
│   ├── proxy.ts                    # 프록시 설정
│   └── package.json                # NPM 의존성
│
└── 📚 Documentation
    ├── README.md                   # 프로젝트 소개
    ├── ARCHITECTURE.md             # 아키텍처 문서
    ├── DEV_GUIDE.md                # 개발 가이드
    ├── QUICKSTART.md               # 빠른 시작
    ├── PROJECT_SUMMARY.md          # 프로젝트 요약
    ├── OPERATIONS_GUIDE.md         # 운영 가이드
    ├── SERVER_MANAGEMENT.md        # 서버 관리
    ├── CHECKLIST.md                # 체크리스트
    ├── CONTRIBUTING.md             # 기여 가이드
    └── LICENSE                     # 라이선스
```

---

## 🔑 주요 파일 설명

### 앱 구조
- **`app/(tabs)/`**: 탭 기반 메인 화면 그룹
  - `pass/`: 체험권 탐색 (릴스 + 미니맵)
  - `offers/`: 새로운 오퍼 목록
  - `scan/`: QR 스캔 기능
  - `wallet/`: 지갑 (포인트, 스탬프, 체험권)

- **`app/api/`**: 백엔드 API 엔드포인트
  - 분석, 검색, 지갑, 헬스체크 등

- **`app/auth/`**: 인증 플로우
  - 로그인, OTP 인증, 권한 요청

### 컴포넌트
- **`components/navigation/`**: 네비게이션 컴포넌트
  - `BottomTabBar`: 하단 탭 네비게이션
  - `RouteTracker`: 페이지 전환 추적

- **`components/states/`**: 상태 UI
  - 로딩, 에러, 빈 상태 화면

### 라이브러리
- **`lib/analytics/`**: 사용자 행동 분석 시스템
- **`lib/server/`**: 서버 측 유틸리티
  - Rate limiting, 멱등성, 로깅

### 스타일
- **`app/globals.css`**: 디자인 토큰 기반 CSS 변수
  - 색상, 간격, 타이포그래피, 반응형

---

## 🎨 디자인 시스템

### CSS 변수 (Design Tokens)
```css
/* 색상 */
--brand, --brand-hover, --brand-active
--text-primary, --text-secondary, --text-tertiary
--bg-base, --bg-subtle
--danger, --success

/* 간격 */
--sp-1 ~ --sp-5 (4px ~ 32px)

/* 반경 */
--radius-sm, --radius-md, --radius-lg, --radius-xl

/* 애니메이션 */
--dur-sm, --dur-md, --dur-lg
--ease-in, --ease-out, --ease-in-out

/* 그림자 */
--elev-1, --elev-2, --elev-3
```

---

## 🚀 기술 스택

### Frontend
- **Next.js 16** (Turbopack)
- **React 19**
- **TypeScript**
- **CSS Variables** (디자인 토큰)

### Backend
- **Next.js API Routes**
- **Prisma** (PostgreSQL ORM)
- **Redis** (캐싱/세션)

### Testing
- **Playwright** (E2E)
- **Vitest** (Unit)

### DevOps
- **Docker** + **Docker Compose**
- **PM2** (프로세스 관리)
- **Nginx** (프록시)

---

## 📦 주요 의존성

```json
{
  "next": "^16.0.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "prisma": "^6.19.0",
  "redis": "^4.7.0",
  "lucide-react": "latest"
}
```

---

## 🔒 환경 변수

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# API Keys
KAKAO_MAP_API_KEY="..."
```

---

## 🧹 정리된 항목

### ✅ 삭제된 파일
- ❌ `CRITICAL_ISSUES_FIXED.md`
- ❌ `CURRENT_STATE.md`
- ❌ `DEEP_ANALYSIS_AND_SOLUTION.md`
- ❌ `FULLSTACK_STATUS_REPORT.md`
- ❌ `INTEGRATION_SUCCESS_REPORT.md`
- ❌ `MODERN_TOOLS_ANALYSIS.md`
- ❌ `NANO_PARTICLE_ANALYSIS_FINAL.md`
- ❌ `REAL_FIX_SUMMARY.md`
- ❌ `SOLUTION_SUMMARY.md`
- ❌ `logs/` (로그 디렉토리)
- ❌ `tsconfig.tsbuildinfo` (빌드 캐시)

### ✅ 유지된 문서
- ✅ `README.md` - 프로젝트 소개
- ✅ `ARCHITECTURE.md` - 아키텍처 설계
- ✅ `DEV_GUIDE.md` - 개발 가이드
- ✅ `QUICKSTART.md` - 빠른 시작
- ✅ `PROJECT_SUMMARY.md` - 프로젝트 요약
- ✅ `OPERATIONS_GUIDE.md` - 운영 가이드
- ✅ `SERVER_MANAGEMENT.md` - 서버 관리

---

## 📊 프로젝트 통계

- **총 파일 수**: ~100개 (node_modules 제외)
- **TypeScript 파일**: ~60개
- **컴포넌트**: 15개
- **API 엔드포인트**: 6개
- **테스트 파일**: 4개

---

**마지막 업데이트**: 2025-11-15
**빌드 상태**: ✅ 성공
**서버 상태**: ✅ 실행 중

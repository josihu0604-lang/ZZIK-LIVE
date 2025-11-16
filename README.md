# ZZIK LIVE

나노 크리에이터 × 로컬 비즈니스 매칭 플랫폼

GPS 기반 삼중 검증 시스템으로 나노 크리에이터(팔로워 100~10,000명)와 로컬 비즈니스를 연결하는 혁신적인 마케팅 플랫폼입니다.

## 🔗 개발 서버 (고정 주소)

**Live Demo:** https://3000-ika6c7p2vsovx61qfxeth-5185f4aa.sandbox.novita.ai

**API Health Check:** https://3000-ika6c7p2vsovx61qfxeth-5185f4aa.sandbox.novita.ai/api/health

**진행 상황:** 6% 완료 (Step 6/100)

## 🚀 프로젝트 개요

ZZIK LIVE는 다음 두 가지 핵심 문제를 해결합니다:

1. **접근성**: 대형 인플루언서 섭외의 높은 비용과 복잡한 프로세스로 인해 영세 자영업자들이 접근하기 어려운 문제
2. **신뢰성**: 허위 리뷰와 조작된 콘텐츠로 인한 신뢰성 문제

### 핵심 차별점

- **GPS 위치 추적** + **QR 코드 스캔** + **영수증 사진 업로드** 삼중 검증
- 실내 정확도 3미터 이내의 위치 검증 (Wi-Fi 삼각측량 + iBeacon)
- 실제 방문 없이는 미션 완료 불가능

### 비즈니스 모델

- **B2B 중심 수익 구조**: 파트너 브랜드 월 150만원 구독료
- **플랫폼 수수료**: 크리에이터 미션 보상의 25%
- **목표**: 2025년 20개 → 2027년 200개 파트너

## 📱 주요 기능

### 4-Tab 네비게이션

1. **체험권 (Pass/LIVE)**: 
   - 검색 및 필터
   - LIVE 릴스 가로 캐러셀
   - Mapbox 지도 통합 (핀/클러스터)
   - GPS 기반 위치 검증

2. **받은 오퍼 (Offers)**:
   - 브랜드 맞춤 제안
   - 만료 임박 알림
   - 필터링 (전체/새로온/만료임박)

3. **QR 스캔 (Scan)**:
   - 실시간 카메라 스캔
   - 바코드/QR 인식
   - 체험권 사용 확인

4. **지갑 (Wallet)**:
   - 포인트/스탬프 관리
   - 보유 체험권
   - 거래내역
   - 결제수단 관리

## 🛠 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables (Design Tokens)
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Analytics**: Custom event tracking system
- **Location**: Geolocation API + Mapbox (planned)

## 🎨 디자인 시스템

### 디자인 토큰

프로젝트는 CSS 변수 기반의 완전한 디자인 토큰 시스템을 사용합니다:

- **Colors**: Text, Background, Brand, States
- **Spacing**: 4px grid system (--sp-0 ~ --sp-12)
- **Border Radius**: --radius-sm ~ --radius-full
- **Motion**: --dur-fast, --dur-md, --dur-slow
- **Shadows**: --elev-1, --elev-2

### 애니메이션

- Pin pulse (지도 핀 강조)
- Badge pop (배지 등장)
- Fade up (콘텐츠 진입)
- Shimmer (로딩 상태)

### 접근성 (A11y)

- WCAG AA 준수 (텍스트 대비 ≥4.5:1)
- 키보드 네비게이션 지원
- ARIA 속성 완비
- 스크린 리더 지원
- `prefers-reduced-motion` 지원

## 📦 프로젝트 구조

```
webapp/
├── app/
│   ├── (tabs)/              # 탭 기반 레이아웃
│   │   ├── pass/            # 체험권 탭
│   │   │   ├── page.tsx
│   │   │   ├── map/
│   │   │   ├── live/[id]/
│   │   │   └── [passId]/
│   │   ├── offers/          # 오퍼 탭
│   │   │   ├── page.tsx
│   │   │   └── [offerId]/
│   │   ├── scan/            # QR 스캔 탭
│   │   │   └── page.tsx
│   │   └── wallet/          # 지갑 탭
│   │       ├── page.tsx
│   │       ├── passes/
│   │       ├── transactions/
│   │       └── payments/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── navigation/          # 네비게이션 컴포넌트
│   │   └── BottomTabBar.tsx
│   ├── pass/                # 체험권 관련 컴포넌트
│   │   ├── SearchBar.tsx
│   │   ├── FilterChips.tsx
│   │   ├── ReelsCarousel.tsx
│   │   └── MiniMap.tsx
│   ├── offers/              # 오퍼 관련 컴포넌트
│   │   └── OfferCard.tsx
│   ├── scan/                # 스캔 관련 컴포넌트
│   │   └── QRScannerView.tsx
│   ├── wallet/              # 지갑 관련 컴포넌트
│   │   └── WalletSummary.tsx
│   └── states/              # 상태 컴포넌트
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       └── ErrorState.tsx
├── lib/
│   ├── analytics.ts         # 분석 시스템
│   └── button-presets.ts    # 버튼 스타일 프리셋
├── types/
│   └── index.ts             # TypeScript 타입 정의
└── public/
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.17 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### 환경 변수

`.env.local` 파일 생성:

```env
# Mapbox (지도 기능)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# API Endpoints
NEXT_PUBLIC_API_URL=https://api.zziklive.com

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## 📊 분석 이벤트

플랫폼은 다음 주요 이벤트를 추적합니다:

### 라우트 이벤트
- `route_view`: 페이지 조회

### 지도/LIVE 이벤트
- `map_view`: 지도 조회
- `pin_tap`: 핀 클릭
- `place_sheet_open`: 장소 시트 열기
- `reel_view_start/end`: 릴스 재생 시작/종료
- `reel_action`: 릴스 액션 (좋아요/공유/저장/길찾기)

### 체험권 이벤트
- `pass_view`: 체험권 상세 조회
- `purchase_click`: 구매 클릭

### 오퍼 이벤트
- `offers_view`: 오퍼 리스트 조회
- `offer_view`: 오퍼 상세 조회
- `offer_accept/dismiss`: 오퍼 수락/거부

### QR 스캔 이벤트
- `qr_scan_start`: 스캔 시작
- `qr_scan_result`: 스캔 성공
- `qr_error`: 스캔 오류

### 지갑 이벤트
- `wallet_view`: 지갑 조회
- `wallet_section_open`: 지갑 섹션 열기
- `voucher_open/use`: 체험권 열기/사용
- `payment_add/remove`: 결제수단 추가/삭제

## 🎯 성능 목표

- **LCP (Largest Contentful Paint)**: ≤ 2.5초
- **INP (Interaction to Next Paint)**: ≤ 200ms
- **CLS (Cumulative Layout Shift)**: ≤ 0.1

## 🔒 보안 고려사항

- GPS 위치 데이터는 geohash5로 익명화
- PII (개인 식별 정보) 수집 금지
- 결제 정보는 토큰화 처리
- HTTPS 필수

## 📱 모바일 최적화

- 터치 타겟 ≥48×48px
- Safe Area 준수
- 스와이프 제스처 지원
- 반응형 디자인

## 🌐 브라우저 지원

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- iOS Safari 14+
- Android Chrome 90+

## 🔄 향후 계획

### Phase 1 (현재)
- [x] 기본 UI/UX 구현
- [x] 4-Tab 네비게이션
- [x] 디자인 토큰 시스템
- [x] 분석 시스템

### Phase 2
- [ ] Mapbox GL JS 통합
- [ ] 실제 GPS 검증
- [ ] QR 스캐너 라이브러리 통합 (zxing-wasm)
- [ ] 백엔드 API 연동

### Phase 3
- [ ] 결제 시스템 통합
- [ ] 푸시 알림
- [ ] 소셜 공유
- [ ] 멤버십 시스템

### Phase 4
- [ ] 크리에이터 대시보드
- [ ] 브랜드 파트너 포털
- [ ] 고급 분석 대시보드
- [ ] AI 추천 시스템

## 🤝 기여하기

이 프로젝트는 현재 비공개 개발 중입니다.

## 📄 라이선스

Copyright © 2024 ZZIK LIVE. All rights reserved.

---

## 🔗 링크

- **Live Demo**: https://3000-i7yp3yojfq5yxuz35b779-8f57ffe2.sandbox.novita.ai
- **Documentation**: [개발 문서 참조]
- **Business Plan**: [사업계획서 참조]

## 📞 연락처

프로젝트 관련 문의: [연락처 정보]

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

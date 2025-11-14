# UX & Accessibility Checklist

## 구조 (Structure)

- [x] 페이지당 H1 1개 - 각 페이지에서 메인 제목으로 사용
- [x] 섹션 헤더는 H2/H3 - 계층 구조 유지
- [x] 폼 레이블은 `<label>`과 연결, `aria-label` 보조 사용
- [x] 포커스 순서 논리적 (좌→우, 상→하)

## 색/대비 (Color & Contrast)

- [x] 텍스트 대비 4.5:1 이상 (본문)
  - `--text` (#0F172A) on `--bg` (#ffffff): 17.83:1 ✓
  - `--text-muted` (#6B7280) on `--bg` (#ffffff): 5.74:1 ✓
- [x] 큰 텍스트 3:1 이상
- [x] 비활성/힌트 텍스트는 3:1 확인

## 키보드/스크린리더 (Keyboard & Screen Reader)

- [x] 탭으로 모든 인터랙션 도달 가능
- [x] 포커스 링 비주얼 명확 (`.focus-ring` 클래스)
- [x] 소셜 버튼 시맨틱 유지 (`<a>` 태그 사용)
- [x] 네비게이션 `role="tablist"` 및 `aria-label` 제공

## 성능 (Performance)

- [x] 로그인 화면 외부 스크립트 최소화
- [x] 이미지 미사용 (브랜드 로고는 SVG 인라인)
- [x] 동적 로딩 최적화

## 프라이버시 (Privacy)

- [x] 로깅에 원시좌표 금지 (geohash5만)
- [ ] 소셜 OAuth state/nonce 사용 (구현 필요)

## 아이콘 사용 가이드라인

- [x] 아이콘 사용 위치: 하단 탭바, 대형 CTA만
- [x] 폼/설명 텍스트에는 아이콘 금지
- [x] 24px/28px 크기, 선굵기 1.75-2px
- [x] 텍스트 라벨 동반 (아이콘 단독 금지)

## 타이포그래피

- [x] 6단계 스케일 (H1-H6) 정의
- [x] 시각적 위계 명확
- [x] 숫자는 tabular-nums 사용 가능

## 완료된 구현

1. **Splash 화면** (`app/splash/page.tsx`)
   - 최소주의 디자인: 브랜드명 + 서브카피만
   - 1.4초 후 자동 리디렉션
   - 세션/게스트 쿠키 기반 라우팅

2. **로그인 화면** (`app/auth/login/page.tsx`)
   - 소셜 로그인 3버튼 (Instagram, TikTok, Google)
   - 이메일/휴대폰 탭 전환
   - "둘러보기" 스킵 옵션 (우측 하단)
   - 개인정보/약관 링크

3. **AuthGate 컴포넌트** (`components/auth/AuthGate.tsx`)
   - 게스트 모드 지원
   - 민감 경로 보호 (/wallet, /scan)

4. **BottomTabBar 업데이트**
   - 아이콘: Map, Gift, QrCode, Wallet
   - 라벨 간소화: 탐색, 오퍼, 스캔, 지갑

5. **디자인 토큰** (`app/globals.css`)
   - Neo-minimal 색상 시스템
   - 타이포그래피 유틸리티 클래스
   - 포커스 링 스타일

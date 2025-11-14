# 🧭 ZZIK LIVE — UX/UI & Accessibility Checklist

## 📋 Overview
이 문서는 ZZIK LIVE 프로젝트의 UX/UI 및 접근성 체크리스트입니다.
WCAG 2.1 AA 기준을 준수하며, 모바일 우선 설계를 따릅니다.

**최종 업데이트**: 2025-11-14  
**담당**: Frontend Team

---

## ✅ P0 Priority (즉시 완료 필수)

### 1. Navigation & Accessibility

- [x] **BottomTabBar SVG Icons**
  - [x] 이모지 → `lucide-react` SVG 아이콘 변경
  - [x] `role="tablist"` 추가
  - [x] 각 탭 `role="tab"` + `aria-selected` 적용
  - [x] 활성 탭 `aria-current="page"` 설정
  - [x] 48×48px 최소 터치 타깃 적용
  - [x] 키보드 포커스 스타일 (`outline: 3px solid`)

**파일**: `components/navigation/BottomTabBar.tsx`  
**검증**: Playwright @a11y 탭 포커스 순서, axe-core 위반 0

### 2. Map Performance

- [x] **MapView 최적화**
  - [x] Dynamic import 유지
  - [x] `moveend/zoomend` 100ms throttle
  - [x] Supercluster Web Worker 분리
  - [x] 핀 `tabindex=0` + `aria-label` 추가

**파일**: `components/map/MapView.tsx`, `components/map/cluster.worker.ts`  
**검증**: k6 지도 구간 p95 < 1.5s, CPU 프로파일·키보드 포커스 가능

### 3. QR Scanner Reliability

- [x] **QR Scanner 폴백**
  - [x] `BarcodeDetector` → `jsQR` 폴백 구현
  - [x] 저조도 토치 버튼 추가
  - [x] 실패 4상태 토스트 + 진동
  - [x] 권한 거부 대체 UX

**파일**: `app/(tabs)/scan/_components/QRScannerView.tsx`  
**검증**: 실제 기기 테스트·axe(컨트롤 라벨)

### 4. Semantic HTML & Landmarks

- [x] **헤딩 계층 (h1→h3)**
  - [x] 모든 페이지 `<h1>` 존재
  - [x] 섹션에 `aria-labelledby` 연결
  - [x] `role="main"` 추가

**파일**: `app/(tabs)/**/page.tsx`  
**검증**: axe-core Landmark/Heading 규칙 통과

### 5. Layout & Preconnect

- [x] **Layout 최적화**
  - [x] `<main role="main">` 추가
  - [x] `<nav role="navigation" aria-label="Bottom tabs">` 추가
  - [x] Mapbox preconnect (`<link rel="preconnect">`)
  - [x] 폰트 `display=swap` 설정

**파일**: `app/layout.tsx`  
**검증**: LCP p75 ≤ 2.5s·axe landmark

### 6. Colors & Contrast

- [x] **명도 대비 (WCAG AA 4.5:1)**
  - [x] 모든 텍스트/배경 조합 4.5:1 이상
  - [x] 포커스 링 (outline: 3px solid #3b82f6)
  - [x] 스켈레톤 애니메이션
  - [x] 8pt 그리드 리듬

**파일**: `app/globals.css`  
**검증**: wcag-contrast CLI·시각 확인

### 7. Privacy & Legacy Code

- [x] **레거시 코드 제거**
  - [x] `app/api/_disabled/**` 완전 제거
  - [x] Raw lat/lng 사용 라우트 삭제

**검증**: `npm run privacy:scan` 0 위반

---

## 🟡 P1 Priority (1주 내 완료)

### 8. Loading States

- [ ] **스켈레톤 통일**
  - [ ] 스켈레톤 스타일 통합
  - [ ] 아이콘 SVG 적용
  - [ ] 키보드 포커스 반영

**파일**: `components/common/*State.tsx`  
**검증**: 시각 점검·axe

### 9. List Virtualization

- [ ] **VirtualList 구현**
  - [ ] 오퍼 리스트에 가상 스크롤 적용
  - [ ] 지갑 리스트에 가상 스크롤 적용
  - [ ] 임박 뱃지/타이머 추가
  - [ ] 영업시간 노출

**파일**: `components/offers/**`, `components/lists/VirtualList.tsx`  
**검증**: 2천건 RUM FPS, p95 스크롤 지연 < 16ms

### 10. Wallet UX

- [ ] **지갑 개선**
  - [ ] 만료일 정렬 상단 고정
  - [ ] 키셋 페이지네이션 UI
  - [ ] 스켈레톤 로딩

**파일**: `components/wallet/**`  
**검증**: UX 흐름·k6

### 11. Onboarding Accessibility

- [ ] **온보딩 개선**
  - [ ] Swiper 라이브러리 적용
  - [ ] 포커스 트랩 + 스킵 버튼
  - [ ] 라이브 리전 에러 표시

**파일**: `app/onboarding/page.tsx`  
**검증**: E2E @a11y

### 12. Permission UI

- [ ] **권한 요청 컴포넌트화**
  - [ ] 위치/카메라/알림 권한 UI
  - [ ] 거부 시 대체 시뮬레이터
  - [ ] 명확한 설명 텍스트

**파일**: `components/permissions/**`  
**검증**: 퍼널 완료율 로그

---

## 🟢 P2 Priority (2주 내 완료)

### 13. Design Tokens

- [ ] **토큰 시스템 통합**
  - [ ] `lib/ui-tokens.ts` 생성
  - [ ] 컬러/공간/레이디우스/섀도우/듀레이션 통합
  - [ ] CSS Modules 점진 전환

**파일**: `lib/ui-tokens.ts`, `styles/globals.css`  
**검증**: 디자인 리뷰

### 14. Reels Accessibility

- [ ] **Reels 개선**
  - [ ] `<track kind="captions">` 자막 추가
  - [ ] LQIP 포스터
  - [ ] 키보드 단축키 (`k/m`)

**파일**: `components/reels/ReelsCarousel.tsx`  
**검증**: E2E·메트릭

### 15. Map Prefetch

- [ ] **지도 프리페치**
  - [ ] geohash6 9셀 프리페치 훅
  - [ ] viewport 기반 예측 로딩

**파일**: `components/map/MapPrefetch.ts`  
**검증**: 초기 로드 p95 < 1s

---

## 🔍 Testing & Validation

### Automated Tests

```bash
# Full UX/UI verification suite
npm run verify:uxui

# Accessibility audit
npm run a11y:report

# Performance smoke test
npm run perf:smoke
```

### Manual Testing Checklist

- [ ] 키보드 네비게이션 (Tab, Enter, Escape)
- [ ] 스크린리더 (NVDA/JAWS/VoiceOver)
- [ ] 색상 대비 도구 (WebAIM Contrast Checker)
- [ ] 모바일 디바이스 (iOS/Android 실기기)
- [ ] 저조도 환경 (QR Scanner torch)

---

## 📊 Success Metrics

### Core Web Vitals
- **LCP**: p75 ≤ 2.5s
- **FID**: p75 ≤ 100ms
- **CLS**: p75 ≤ 0.1

### Accessibility
- **axe-core violations**: 0
- **WCAG 2.1 AA compliance**: 100%
- **Keyboard navigation**: 100% 기능

### Performance
- **Map initial load**: p95 ≤ 1.5s
- **QR scan result**: p95 ≤ 0.8s
- **List scroll FPS**: p95 ≥ 55

---

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 🔄 Review Cycle

- **Daily**: 신규 PR에 대한 a11y 자동 검사
- **Weekly**: 전체 UX/UI 체크리스트 리뷰
- **Monthly**: 사용자 피드백 반영 및 메트릭 분석

---

**마지막 검증일**: 2025-11-14  
**다음 검증 예정일**: 2025-11-21

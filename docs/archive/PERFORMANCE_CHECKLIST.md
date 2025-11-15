# ZZIK LIVE 성능 최적화 체크리스트

## LCP (Largest Contentful Paint) - 목표: < 2.5s

### ✅ 완료된 최적화

1. **이미지 최적화**
   - Next.js Image 컴포넌트 사용
   - priority 속성 (첫 이미지)
   - loading="eager" (첫 이미지)
   - lazy loading (나머지)
   - sizes 속성 지정

2. **폰트 최적화**
   - -apple-system, BlinkMacSystemFont (시스템 폰트)
   - 웹폰트 미사용 (로딩 시간 절약)

3. **Critical CSS**
   - Tailwind JIT 모드
   - CSS 변수 사용 (globals.css)
   - 인라인 중요 스타일

### 📋 추가 권장사항

- [ ] CDN 이미지 최적화 (WebP, AVIF)
- [ ] 이미지 크기 최적화 (responsive breakpoints)
- [ ] Preconnect to image domains
  ```html
  <link rel="preconnect" href="https://images.unsplash.com" />
  ```

---

## INP (Interaction to Next Paint) - 목표: < 200ms

### ✅ 완료된 최적화

1. **인터랙션 피드백**
   - 200ms 이내 CTA 피드백 (opacity + pointer-events)
   - 180ms 성공 애니메이션
   - hover/active 상태 즉시 반영

2. **애니메이션 최적화**
   - duration-[var(--dur-fast)]: 120ms
   - duration-[var(--dur-md)]: 200ms
   - opacity/transform만 사용 (GPU 가속)
   - prefers-reduced-motion 대응

3. **Debounce/Throttle**
   - 검색 입력 debounce (권장)
   - 스크롤 이벤트 throttle (권장)

### 📋 추가 권장사항

- [ ] Virtual scrolling (긴 리스트)
- [ ] useTransition for non-urgent updates
- [ ] Offload heavy computation to Web Workers

---

## CLS (Cumulative Layout Shift) - 목표: < 0.1

### ✅ 완료된 최적화

1. **이미지 크기 지정**
   - fill 속성 + 부모 크기 고정
   - 명시적 width/height

2. **스켈레톤 UI**
   - SkeletonCard, SkeletonList
   - 로딩 시 레이아웃 유지

3. **폰트 로딩**
   - 시스템 폰트 사용 (layout shift 없음)

4. **동적 콘텐츠**
   - 배지: 절대 위치 (absolute)
   - 토스트: fixed 위치
   - Bottom sheet: transform (layout 영향 없음)

### 📋 추가 권장사항

- [ ] aspect-ratio CSS 사용
- [ ] Ad slots 크기 미리 확보
- [ ] Sticky elements 최소화

---

## 추가 Web Vitals

### FID (First Input Delay) - 목표: < 100ms

✅ 이미 INP로 대체됨 (Chrome 96+)

### TTFB (Time to First Byte) - 목표: < 800ms

- Vercel/Cloudflare 배포 시 자동 최적화
- Edge functions 활용

### FCP (First Contentful Paint) - 목표: < 1.8s

✅ 시스템 폰트 + critical CSS

---

## 번들 크기 최적화

### ✅ 완료

1. **Code Splitting**
   - Next.js App Router 자동 분할
   - 탭별 route segments
   - dynamic import 준비

2. **Tree Shaking**
   - lucide-react 개별 import
   - ES modules 사용

3. **압축**
   - Turbopack 자동 압축
   - gzip/brotli (Vercel 자동)

### 📋 추가 권장사항

```bash
# 번들 분석
npm run build -- --analyze

# 미사용 코드 제거
npx depcheck
```

---

## 네트워크 최적화

### ✅ 완료

1. **이미지 도메인 설정**
   - next.config.ts remotePatterns
   - images.unsplash.com

2. **API 최적화**
   - 모의 데이터로 빠른 응답 (mock)
   - 실제 API 목표: ≤ 800ms

### 📋 추가 권장사항

- [ ] SWR/React Query (캐싱)
- [ ] Optimistic updates
- [ ] Request deduplication
- [ ] Background fetch for prefetch

---

## 측정 도구

### 브라우저 DevTools

```bash
# Lighthouse 실행
1. Chrome DevTools > Lighthouse
2. Mode: Navigation
3. Device: Mobile
4. Category: Performance, Accessibility
```

### 실제 사용자 측정 (RUM)

```typescript
// web-vitals 설치
npm install web-vitals

// _app.tsx 또는 layout.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### CLI 도구

```bash
# PageSpeed Insights
npx psi https://your-domain.com --strategy=mobile

# WebPageTest
https://www.webpagetest.org/
```

---

## 체크리스트 실행

### Step C-2 완료 조건

- [x] 접근성 스크립트 실행
- [x] 성능 체크리스트 문서화
- [ ] Lighthouse 점수 측정 (배포 후)
  - Performance: ≥ 90
  - Accessibility: ≥ 95
  - Best Practices: ≥ 90
  - SEO: ≥ 90

### 배포 후 점검

```bash
# 1. 배포 URL 확인
echo "https://your-vercel-app.vercel.app"

# 2. Lighthouse 실행
npx lighthouse https://your-vercel-app.vercel.app --view

# 3. 결과 확인
# - LCP < 2.5s
# - INP < 200ms
# - CLS < 0.1
```

---

## 이미 구현된 최적화 요약

✅ **이미지**

- Next.js Image 컴포넌트
- priority + lazy loading
- sizes 속성

✅ **애니메이션**

- 120~200ms 지속시간
- GPU 가속 (transform/opacity)
- prefers-reduced-motion

✅ **번들**

- Code splitting (App Router)
- Tree shaking (개별 import)
- Turbopack 최적화

✅ **스타일**

- CSS 변수
- Tailwind JIT
- 시스템 폰트

✅ **UX**

- 200ms 이내 피드백
- 스켈레톤 UI
- 터치 타겟 48×48px

---

**결론**: 대부분의 성능 최적화가 이미 구현되어 있습니다. 배포 후 Lighthouse로 실측하고, 필요 시 추가 최적화를 진행하면 됩니다.

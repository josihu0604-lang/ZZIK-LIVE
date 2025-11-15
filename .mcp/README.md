# MCP Configuration - ZZIK LIVE

## 📋 Overview

Model Context Protocol (MCP) 최상 세팅으로 AI 개발 환경을 최적화합니다.

## 🎯 주요 기능

### 1. 프로젝트 컨텍스트 (`config.json`)

- **코드베이스 맵핑**: 전체 프로젝트 구조 및 의존성
- **품질 기준**: TypeScript strict, ESLint, Prettier
- **테스팅 전략**: Unit (Vitest) + E2E (Playwright) + A11y
- **보안 정책**: Privacy guards, protected routes, headers
- **AI 최적화**: 컨텍스트 우선순위, 코드 생성 스타일

### 2. AI 프롬프트 템플릿 (`prompts.json`)

#### 코드 리뷰
```json
{
  "name": "Code Review - ZZIK LIVE Standards",
  "checks": ["TypeScript", "Accessibility", "Privacy", "Performance", "Security", "UI"]
}
```

#### 컴포넌트 생성
```json
{
  "name": "Generate React Component",
  "outputs": ["TypeScript", "ARIA", "Neo-minimal design", "Error boundaries"]
}
```

#### API 엔드포인트
```json
{
  "name": "Create API Endpoint",
  "includes": ["Rate limiting", "Validation", "Error handling", "Privacy"]
}
```

#### 기타 프롬프트
- Test Generation (Unit + E2E + A11y)
- Bug Fix & Debug
- Refactoring
- Accessibility Audit
- Performance Optimization
- Security Review
- Documentation Generation

### 3. 개발 도구 (`tools.json`)

#### 코드 분석
- `typeCheck`: TypeScript strict 검사
- `lint`: ESLint 자동 수정
- `format`: Prettier 포매팅

#### 테스팅
- `unit`: Vitest 단위 테스트 (70% 커버리지)
- `e2e`: Playwright E2E 테스트
- `a11y`: WCAG 2.1 AA 준수 검사
- `consoleErrors`: 콘솔 오류 자동 검증

#### 성능
- `bundleAnalyzer`: 번들 크기 분석
- `lighthouse`: 성능 측정 (90+ 목표)
- `k6`: 부하 테스트

#### 데이터베이스
- `migrate`: Prisma 마이그레이션
- `seed`: 테스트 데이터 시드
- `studio`: Prisma Studio (Port 5555)
- `validate`: 스키마 검증

#### 배포
- `preview`: Vercel 미리보기 배포
- `production`: 프로덕션 배포 (사전 검증)

## 🚀 사용 방법

### 기본 사용

```bash
# AI에게 프롬프트 템플릿 사용 요청
"Use the 'componentGeneration' prompt to create a LoginButton component"

# 도구 실행
"Run the 'typeCheck' tool"
"Execute 'e2e' tests"
```

### 단축키

```bash
q - Type check
l - Lint
f - Format
t - Unit tests
e - E2E tests
a - A11y tests
b - Build
d - Dev server
s - DB Studio
m - Migrate
p - Preview deploy
c - Commit
g - Push
```

### 컨텍스트 활용

AI는 자동으로 다음을 참조합니다:
- 프로젝트 구조 및 규칙
- 코드 스타일 가이드
- 보안 및 프라이버시 정책
- 테스팅 전략
- 성능 목표

## 📊 품질 게이트

### 필수 통과 기준

#### 코드 품질
- ✅ TypeScript strict mode
- ✅ ESLint 0 errors
- ✅ Prettier formatted

#### 테스팅
- ✅ Unit tests 70%+ coverage
- ✅ E2E tests pass
- ✅ A11y WCAG 2.1 AA

#### 성능
- ✅ LCP ≤ 1.5s
- ✅ Lighthouse 90+
- ✅ Bundle optimized

#### 보안
- ✅ No raw coordinates
- ✅ Protected routes
- ✅ Security headers
- ✅ npm audit clean

## 🎨 디자인 시스템

### Neo-Minimal Tokens

```css
/* Colors */
--text: #0F172A
--text-muted: #6B7280
--brand: #10B981
--border: #E5E7EB
--focus: #2563EB

/* Typography */
--h1: 2.0rem
--h2: 1.75rem
--body: 1rem

/* Classes */
.text-h1, .text-h2, .text-body
.focus-ring
.tabular
```

### 컴포넌트 규칙
- Functional components only
- TypeScript strict
- ARIA attributes
- Text-first design
- Minimal icons (tabs/CTA only)

## 🔒 보안 & 프라이버시

### Privacy Guards
```typescript
// ✅ Good
log({ geohash5: 'u33db' })

// ❌ Bad
log({ lat: 37.5665, lng: 126.9780 })
```

### Protected Routes
```typescript
// Client: AuthGate component
// Server: proxy.ts middleware
['/wallet', '/scan', '/offers/accept']
```

### API Security
```typescript
// Rate limiting in proxy.ts
// Zod validation
// Error handling
// Request logging
```

## 📈 성능 목표

| Metric | Target |
|--------|--------|
| LCP | ≤ 1.5s |
| FID | ≤ 100ms |
| CLS | ≤ 0.1 |
| TTI | ≤ 3.0s |
| Lighthouse | 90+ |

## 🧪 테스트 전략

### Unit Tests (Vitest)
```typescript
// lib/**/*.spec.ts
// Coverage: 70%+
// Mocking: Yes
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/**/*.spec.ts
// Browsers: Chromium
// Parallel: Yes
```

### A11y Tests
```typescript
// @axe-core/playwright
// Standard: WCAG 2.1 AA
// Zero violations
```

## 📝 코딩 컨벤션

### 파일 구조
```
components/[category]/[ComponentName].tsx
app/[route]/page.tsx
lib/[domain]/[function].ts
tests/[unit|e2e]/[name].spec.ts
```

### Import 순서
```typescript
// 1. React/Next
import { useState } from 'react'
import Link from 'next/link'

// 2. Third-party
import { z } from 'zod'

// 3. Internal
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

// 4. Relative
import styles from './styles.module.css'
```

### 네이밍
- Components: `PascalCase`
- Files: `kebab-case`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

## 🔄 워크플로우

### Development
```bash
npm run dev         # Start dev server
npm run lint        # Lint code
npm run typecheck   # Type check
npm test            # Run tests
```

### Pre-commit
```bash
lint-staged         # Auto-format
type-check          # TypeScript
test:unit           # Unit tests
```

### Pre-merge
```bash
test:e2e            # E2E tests
build               # Production build
lighthouse          # Performance audit
```

### Deployment
```bash
vercel --target=preview  # Staging
vercel --prod            # Production
```

## 📚 참고 문서

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - 시스템 아키텍처
- [VERIFICATION_GUIDE.md](../VERIFICATION_GUIDE.md) - 검증 가이드
- [OPERATIONS_GUIDE.md](../OPERATIONS_GUIDE.md) - 운영 가이드
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 기여 가이드

## 🤖 AI 최적화

### 컨텍스트 우선순위
1. Current file (현재 작업 중인 파일)
2. Related components (연관 컴포넌트)
3. Type definitions (타입 정의)
4. Recent changes (최근 변경사항)

### 코드 생성 스타일
- Functional programming
- TypeScript strict
- React Hooks
- No classes
- Minimal dependencies

### 리팩토링 원칙
- Preserve tests
- Update documentation
- Ask for breaking changes
- Maintain accessibility

## 🎯 성공 지표

### 개발 속도
- ✅ AI 컨텍스트 활용으로 30% 빠른 개발
- ✅ 템플릿 기반 코드 생성으로 일관성 향상
- ✅ 자동화 도구로 수동 작업 감소

### 코드 품질
- ✅ TypeScript strict 100% 준수
- ✅ 테스트 커버리지 70%+
- ✅ A11y 위반 0건

### 성능
- ✅ Lighthouse 90+ 달성
- ✅ LCP 1.5s 이하
- ✅ Zero console errors

## 🔧 트러블슈팅

### MCP 연결 실패
```bash
# VS Code 재시작
# .mcp/ 디렉토리 권한 확인
chmod -R 755 .mcp/
```

### 도구 실행 실패
```bash
# npm 의존성 재설치
npm ci

# 캐시 정리
npm run clean
```

### 성능 이슈
```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer

# 프로파일링
npm run dev
# DevTools > Performance
```

## 📞 지원

문제가 발생하면:
1. [GitHub Issues](https://github.com/josihu0604-lang/ZZIK-LIVE/issues)
2. 개발팀 Slack #dev-support
3. dev@zzik.live

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

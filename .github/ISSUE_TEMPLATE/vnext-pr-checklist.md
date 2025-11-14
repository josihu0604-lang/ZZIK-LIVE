---
name: vNext PR Checklist
about: Comprehensive checklist for vNext PRs (DB, Map, Search, QR, Wallet)
title: '[vNext] '
labels: 'type:feature, prio:high'
assignees: ''
---

## 📝 Summary

<!-- Brief description of changes -->

## 🎯 Related PR Numbers

<!-- #20 (DB), #17 (Map+Search), #18 (QR+Wallet) -->

## ✅ Implementation Checklist

### DB Integration (#20)

- [ ] Docker Compose (Postgres16+PostGIS) added
- [ ] Prisma schema with indexes:
  - [ ] `@@index([geohash6])`
  - [ ] `GIST(geom)`
  - [ ] `@@index([user_id, status])`
  - [ ] `@@index([created_at(desc)])`
- [ ] Migrations executed successfully
- [ ] Seed data loaded (users, places, offers, vouchers, QR tokens)
- [ ] K6 smoke tests pass with budgets:
  - [ ] `/api/offers` p95 ≤ 150ms
  - [ ] `/api/wallet/summary` p95 ≤ 100ms
  - [ ] `/api/search` p95 ≤ 120ms
  - [ ] `/api/qr/verify` p95 ≤ 800ms

### Mapbox Core + Search 1.0 (#17)

- [ ] 9-cell prefetch implemented (center + 8 neighbors)
- [ ] Supercluster in Web Worker for clustering
- [ ] Marker diff rendering (minimize DOM updates)
- [ ] Map events throttled (100ms for moveend/zoomend)
- [ ] `/api/places/nearby` optimized:
  - [ ] ST_DWithin + GIST index used
  - [ ] Radius capped at ≤5km
  - [ ] Response limited to 25 results
  - [ ] p95 ≤ 100ms
- [ ] Search scoring algorithm:
  - [ ] BM25-like text relevance (50% weight)
  - [ ] Geo proximity with linear decay (30% weight)
  - [ ] Popularity from clicks/saves (20% weight)
  - [ ] Age decay penalty (10% penalty)
  - [ ] Cache key: `q|geohash5|radius|lang|ver`
  - [ ] p95 ≤ 80ms, p99 ≤ 150ms

### QR & Wallet Reliability (#18)

- [ ] QR 4-state UX enhanced:
  - [ ] Success: Clear redemption guide
  - [ ] 410 Already used/expired: Emphasized warning + location guide
  - [ ] Invalid: Distance/lighting/framing guidance
- [ ] Duplicate submission prevention (button lock during request)
- [ ] Idempotency-Key regeneration on retry (no reuse)
- [ ] Wallet improvements:
  - [ ] Expiring ≤7d vouchers pinned to top
  - [ ] Active/Expired/Used tabs separated
  - [ ] Keyset pagination + skeleton states
  - [ ] Offscreen 1-page prefetch
  - [ ] 1,000+ rows scroll at 60fps

### Pipeline & Gates

- [ ] ESLint peer dependency resolved
- [ ] GitHub Actions workflows added:
  - [ ] `verify-pr.yml` (type/lint/format/coverage/privacy/headers)
  - [ ] `k6-performance.yml` (comprehensive API tests)
  - [ ] `accessibility.yml` (axe-core integration)
- [ ] All workflows pass with 0 errors

## 🔐 Security & Privacy

- [ ] No raw lat/lng in code, logs, analytics (privacy scan passes)
- [ ] Security headers present (10/10)
- [ ] Idempotency-Key enforced for mutations
- [ ] QR verify blocks CORS from external origins
- [ ] No tokens/keys exposed in client bundle

## ⚡ Performance

- [ ] K6 smoke tests pass all budgets
- [ ] LCP p75 ≤ 2.5s (mobile, throttled 4G)
- [ ] Map first tile ≤ 1.5s
- [ ] Map pan/zoom 60fps maintained
- [ ] Dynamic imports for heavy components (Mapbox, QR, Reels)
- [ ] LQIP placeholders for images
- [ ] Preconnect hints for external resources

## ♿ Accessibility

- [ ] 48×48px minimum touch targets
- [ ] Predictable focus order
- [ ] ARIA labels on all icons
- [ ] Color contrast ≥ AA (4.5:1)
- [ ] Modal/Sheet focus trap working
- [ ] Keyboard navigation supported

## 📊 Testing Evidence

<!-- Paste K6 results, coverage report, accessibility scan -->

### K6 Results

```
[Paste k6-results.md here]
```

### Coverage

- Lines: \_\_\_%
- Branches: \_\_\_%
- Functions: \_\_\_%
- Statements: \_\_\_%

### Accessibility

- Critical: 0
- Serious: 0
- Moderate: \_\_\_
- Minor: \_\_\_

## 🚀 Deployment Plan

- [ ] Staging deployment verified
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] Canary deployment configuration ready (10% for 30min)

## 📝 Documentation

- [ ] API changes documented
- [ ] Schema changes documented
- [ ] Performance benchmarks recorded
- [ ] Known issues/limitations listed

## 🎯 Acceptance Criteria (AC)

<!-- Copy from vNext pack section 2.4 -->

- [ ] All API routes return 2xx or expected 4xx (5xx = 0)
- [ ] Performance budgets met for all endpoints
- [ ] Privacy scan: 0 violations
- [ ] Security headers: 10/10
- [ ] Accessibility: 0 critical/serious issues
- [ ] Test coverage: Lines ≥80%, Branches ≥75%

## 🔍 Review Checklist

- [ ] Code follows project conventions
- [ ] Tests added for new functionality
- [ ] No sensitive data in commits
- [ ] PR description is complete and clear
- [ ] Related issues linked

## 📷 Screenshots/Videos

<!-- Add screenshots or videos demonstrating changes -->

---

**Priority:** High  
**Estimated Time:** **\_  
**Reviewer:** @\_**

# ZZIK LIVE - Acceptance Testing Checklist

## 📋 Pre-Merge Requirements

All items must pass before merging to main or deploying to production.

---

## 1. Functional Tests (UI)

### 1.1 First-Run Journey

- [ ] Open `/splash` → auto-progress to `/onboarding` (first-time users)
- [ ] Swipe through 3 onboarding slides smoothly
- [ ] Press "Get Started" → redirects to `/auth/login`
- [ ] Login via email tab → success sets `zl_auth` cookie
- [ ] Redirect to `/(tabs)/explore` after successful auth
- [ ] Complete flow takes ≤ 90s on first run

### 1.2 AuthGuard & Middleware

- [ ] Protected routes redirect unauthenticated users to `/splash`
- [ ] `next` query parameter preserved during auth redirect
- [ ] After login, user redirected to originally requested page
- [ ] Authenticated users cannot access `/splash` or `/onboarding`
- [ ] API routes return 401 for unauthenticated requests

### 1.3 Tab Behavior

**Explore Tab:**

- [ ] Map renders without SSR crashes
- [ ] GPS permission requested lazily (not on mount)
- [ ] Permission denied shows fallback component
- [ ] Re-request CTA visible and functional
- [ ] Map centers on user location after permission granted
- [ ] First map tile loads ≤ 1.5s
- [ ] Pan/zoom maintains 60fps

**Offers Tab:**

- [ ] List renders with skeleton loaders
- [ ] Expiring badges visible on items with `expires_in ≤ 48h`
- [ ] Top 3 items surface expiring offers first
- [ ] Infinite scroll works smoothly
- [ ] Tapping offer shows details sheet

**Scan Tab:**

- [ ] Camera permission prompt appears
- [ ] Permission denied shows fallback UI with settings guidance
- [ ] QR scanner shows 4-state UI:
  - [ ] `success` - green checkmark with haptic feedback
  - [ ] `already_used` - error message with retry CTA
  - [ ] `expired` - clear expiration message
  - [ ] `invalid` - invalid code message
- [ ] Laser animation visible during scanning
- [ ] Flash/torch toggle works (if device supports)

**Wallet Tab:**

- [ ] Keyset pagination loads smoothly
- [ ] "Expiring soon" vouchers pinned to top
- [ ] Vouchers with `expires_in ≤ 7d` show warning badge
- [ ] Infinite scroll maintains 60fps with 200+ items
- [ ] Skeleton states during loading

### 1.4 Error Scenarios

- [ ] Offline mode shows `OfflineState` component
- [ ] Network errors show retry CTA
- [ ] Permission denied shows clear re-request guidance
- [ ] Empty states have helpful CTAs

---

## 2. Security & Privacy

### 2.1 Raw Coordinates Protection

- [ ] No raw `lat`/`lng` in analytics events
- [ ] Only `geohash5` present in tracking calls
- [ ] `privacy:scan` script passes with 0 violations
- [ ] API responses use geohash5, not raw coords

### 2.2 Security Headers

- [ ] All pages include security headers:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Cross-Origin-Opener-Policy: same-origin`
  - [ ] `Cross-Origin-Resource-Policy: same-origin`
  - [ ] `Content-Security-Policy` with nonce
- [ ] `headers:verify` script passes
- [ ] HSTS enabled in production

### 2.3 QR Verification Security

- [ ] `/api/qr/verify` blocks CORS from external origins
- [ ] Requires `Idempotency-Key` header
- [ ] Returns 403 for invalid origin
- [ ] Returns 400 for missing idempotency key

### 2.4 Request Logging

- [ ] All requests include `x-request-id` header
- [ ] Logs contain `request_id` for tracing
- [ ] No PII (email, phone, raw coords) in logs
- [ ] Only geohash5 logged for location data

---

## 3. Performance

### 3.1 Core Web Vitals (Mobile, Throttled 4G)

- [ ] LCP p75 ≤ 2.5s
- [ ] CLS ≤ 0.1
- [ ] TTI ≤ 5.0s
- [ ] First Contentful Paint ≤ 1.8s

### 3.2 Explore Tab Performance

- [ ] First map tile ≤ 1.5s
- [ ] Pan/zoom 60fps (measure with DevTools)
- [ ] No layout shift during map load
- [ ] Geolocation callback ≤ 500ms

### 3.3 API Latency (p95)

- [ ] `/api/offers` ≤ 150ms
- [ ] `/api/wallet` ≤ 100ms
- [ ] `/api/search` ≤ 120ms (when DB connected)
- [ ] `/api/health` ≤ 50ms

### 3.4 Bundle Size

- [ ] Main bundle ≤ 200KB gzipped
- [ ] Dynamic imports used for heavy components (Map, QR, Reels)
- [ ] No duplicate dependencies in bundle

---

## 4. Accessibility

### 4.1 Touch Targets

- [ ] All critical CTAs ≥ 48×48px
- [ ] Bottom tab bar items ≥ 48×48px
- [ ] Buttons in sheets ≥ 44×44px

### 4.2 Screen Reader Support

- [ ] Tab bar announces active tab
- [ ] Map has `aria-label="Explore map"`
- [ ] Loading states have `role="status"` and `aria-live="polite"`
- [ ] Error alerts have `role="alert"`
- [ ] Icon buttons have `aria-label`

### 4.3 Keyboard Navigation

- [ ] Focus order is predictable
- [ ] Tab navigation works in sheets
- [ ] Escape closes sheets
- [ ] Enter/Space activates buttons

### 4.4 Visual Accessibility

- [ ] Color contrast ≥ AA (4.5:1 for text)
- [ ] Focus visible on all interactive elements
- [ ] No color-only information
- [ ] Sheet `aria-expanded` attribute updates

---

## 5. Cross-Browser & Device Testing

### 5.1 Browsers

- [ ] Chrome/Edge (latest)
- [ ] Safari iOS 15+ (mobile)
- [ ] Samsung Internet (Android)

### 5.2 Devices

- [ ] iPhone 13 (iOS 16+)
- [ ] Pixel 7 (Android 13+)
- [ ] iPad (tablet layout if supported)

### 5.3 Features

- [ ] BarcodeDetector API works (Chrome/Edge)
- [ ] Fallback message on unsupported browsers (Firefox/Safari)
- [ ] Geolocation works on all devices
- [ ] Camera access works on all devices

---

## 6. Manual Test Scripts

### 6.1 First-Run Journey (90s target)

```
1. Open incognito/private window
2. Navigate to http://localhost:3000
3. Observe auto-redirect to /splash
4. Wait for auto-progress to /onboarding (3s)
5. Swipe through 3 slides (10s)
6. Tap "Get Started" button
7. Select "Email" tab on /auth/login
8. Enter test email: test@zzik.live
9. Enter OTP: 123456
10. Observe redirect to /(tabs)/explore
11. Total time: _____ seconds (target ≤90s)
```

### 6.2 Explore Flow

```
1. Open /(tabs)/explore
2. Observe permission prompt
3. Deny once → see fallback component
4. Tap "Request Again" CTA
5. Allow permission → map centers on location
6. Measure map first tile time: _____ ms (target ≤1.5s)
7. Pan around map → verify 60fps
8. Zoom in/out → verify smooth transitions
```

### 6.3 Scan Flow

```
1. Open /(tabs)/scan
2. Grant camera permission
3. Observe red laser animation
4. Simulate QR decode (or use test button)
5. Verify 4-state UI appears:
   - Success: green checkmark + haptic
   - Already used: error + retry CTA
   - Expired: expiration message
   - Invalid: invalid code message
6. Deny camera → see fallback with settings guidance
```

### 6.4 Wallet Flow

```
1. Open /(tabs)/wallet
2. Verify expiring vouchers pinned to top
3. Scroll through 200+ items
4. Observe skeleton loaders during pagination
5. Measure scroll performance: _____ fps (target 60fps)
6. Tap voucher → details sheet opens
```

---

## 7. Automated Verification Commands

Run these commands to verify all requirements:

```bash
# Type check + lint + format
npm run typecheck
npm run lint
npm run format:check

# Unit tests with coverage (maintain Lines ≥80%, Branches ≥75%)
npm run test:coverage

# E2E smoke tests
npm run test:e2e:smoke

# Security & privacy
npm run headers:verify
npm run privacy:scan

# Performance smoke (requires running server)
npm run dev &
sleep 5
npm run bench:smoke

# Full verification suite
npm run verify:pr
```

---

## 8. Known Gaps & Next Tasks

### DB-Backed Data

- [ ] Hook UI to real API once DB and Prisma ready
- [ ] Replace mock data with actual queries
- [ ] Test pagination with real data volume

### Search 1.0

- [ ] Implement composite scoring
- [ ] Add cache layer with 30-60s TTL
- [ ] Expose diagnostics pill in Explore tab

### Reels

- [ ] Integrate lightweight HLS player
- [ ] Add thumbnail LQIP placeholders
- [ ] Measure completion rate

### QR Decode

- [ ] Integrate jsQR or ZXing for non-Chrome browsers
- [ ] Throttle decode to 10-12 fps for performance
- [ ] Add haptic feedback on success

### A11y Polish

- [ ] Add focus ring styles to all interactive elements
- [ ] Ensure aria-labels on all icon buttons in PlaceSheet
- [ ] Test with VoiceOver and TalkBack

---

## 9. Pre-Release Checklist

### Staging

- [ ] Full Lighthouse audit (desktop + mobile)
- [ ] Run complete E2E suite (26 cases)
- [ ] Performance profiling with real data
- [ ] Security headers verified in production build

### Canary Deployment

- [ ] Deploy to 10% of traffic for 30 minutes
- [ ] Monitor error rate (must be < 0.3%)
- [ ] Monitor p95 latency (API ≤150ms)
- [ ] Auto-rollback if thresholds exceeded

### Rollout

- [ ] Gradual increase: 10% → 25% → 50% → 100%
- [ ] Monitor each stage for 15 minutes
- [ ] Ready for immediate rollback if issues detected

---

## 10. Owner Responsibilities

| Component          | Owner          | Status |
| ------------------ | -------------- | ------ |
| UI Shell & Routing | FE Lead        | ✅     |
| Security & Privacy | Platform Lead  | ✅     |
| Map/Scan/Wallet    | Feature Owners | 🔄     |
| Analytics/DQ       | Data Lead      | 🔄     |

---

**Last Updated:** 2024-11-13  
**Version:** 1.0.0  
**Status:** Ready for Verification

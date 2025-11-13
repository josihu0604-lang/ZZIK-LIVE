# ZZIK LIVE - Technical Architecture

## 📐 System Architecture Overview

ZZIK LIVE is built as a modern, mobile-first Progressive Web Application (PWA) using Next.js 16 with the App Router architecture.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Pass   │  │  Offers  │  │   Scan   │  │  Wallet  │   │
│  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘         │
│                  BottomTabBar Navigation                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      Next.js App Router                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Server Components  │  Client Components           │    │
│  │  • SEO Optimization │  • Interactive UI            │    │
│  │  • Data Fetching    │  • Real-time Updates         │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                         API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Analytics   │  │  Voucher     │  │  Payment     │     │
│  │  API         │  │  API         │  │  API         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Mapbox GL   │  │  GPS/iBeacon │  │  QR Scanner  │     │
│  │  (Maps)      │  │  (Location)  │  │  (zxing)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🏗 Application Structure

### Directory Organization

```
webapp/
├── app/                          # Next.js App Router
│   ├── (tabs)/                   # Tab-based layout group
│   │   ├── layout.tsx            # Shared layout with BottomTabBar
│   │   ├── pass/                 # Pass/LIVE tab
│   │   │   ├── page.tsx          # Main pass discovery page
│   │   │   ├── map/              # Full-screen map view
│   │   │   ├── live/[id]/        # Individual reel player
│   │   │   └── [passId]/         # Pass detail page
│   │   ├── offers/               # Offers tab
│   │   │   ├── page.tsx          # Offers list
│   │   │   └── [offerId]/        # Offer detail
│   │   ├── scan/                 # QR Scanner tab
│   │   │   └── page.tsx          # Scanner interface
│   │   └── wallet/               # Wallet tab
│   │       ├── page.tsx          # Wallet home
│   │       ├── passes/           # Voucher management
│   │       ├── transactions/     # Transaction history
│   │       └── payments/         # Payment methods
│   ├── api/                      # API Routes
│   │   └── analytics/            # Analytics endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root redirect
│   └── globals.css               # Global styles + tokens
│
├── components/                   # React Components
│   ├── navigation/               # Navigation components
│   │   └── BottomTabBar.tsx      # 4-tab navigation
│   ├── pass/                     # Pass-related components
│   │   ├── SearchBar.tsx         # Search interface
│   │   ├── FilterChips.tsx       # Category/distance filters
│   │   ├── ReelsCarousel.tsx     # Horizontal reel scroll
│   │   └── MiniMap.tsx           # Map component
│   ├── offers/                   # Offer components
│   │   └── OfferCard.tsx         # Offer card with actions
│   ├── scan/                     # Scanner components
│   │   └── QRScannerView.tsx     # Camera + QR detection
│   ├── wallet/                   # Wallet components
│   │   └── WalletSummary.tsx     # Stats display
│   └── states/                   # State components
│       ├── EmptyState.tsx        # Empty state UI
│       ├── LoadingState.tsx      # Loading + skeleton
│       └── ErrorState.tsx        # Error display
│
├── lib/                          # Utility libraries
│   ├── analytics.ts              # Event tracking system
│   └── button-presets.ts         # Button style utilities
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # Core type definitions
│
└── public/                       # Static assets
```

## 🎨 Design System Architecture

### Token-Based Theming

The entire application uses CSS custom properties (CSS variables) for theming, ensuring consistency and easy theme switching.

```css
/* Design Token Hierarchy */
:root {
  /* Level 1: Semantic Tokens */
  --text-primary, --text-secondary, --text-tertiary
  --bg-base, --bg-subtle, --bg-elev-1, --bg-elev-2
  --brand, --brand-hover, --brand-active
  
  /* Level 2: System Tokens */
  --sp-{0-12}     /* Spacing scale */
  --radius-{sm-xl}  /* Border radius */
  --dur-{fast-slow} /* Animation duration */
  
  /* Level 3: Component Tokens */
  Applied via Tailwind: bg-[var(--brand)]
}
```

### Component Composition Pattern

```
Page Component (Route)
  ├── Layout Component (Shared structure)
  │   └── BottomTabBar (Navigation)
  │
  ├── Feature Components (Business logic)
  │   ├── SearchBar
  │   ├── FilterChips
  │   └── ReelsCarousel
  │
  └── State Components (Conditional rendering)
      ├── LoadingState
      ├── EmptyState
      └── ErrorState
```

## 🔄 Data Flow Architecture

### Client-Side State Management

```typescript
// Component State Flow
User Interaction
  → Event Handler
  → Local State Update (useState/useReducer)
  → Analytics Event (optional)
  → UI Re-render
  → Server Request (if needed)
```

### Analytics Event Flow

```typescript
// Analytics Pipeline
User Action
  → Component Event Handler
  → analytics.track(event, properties)
  → Queue in Memory
  → Batch (10 events or 5 seconds)
  → POST /api/analytics
  → Server Processing
  → External Analytics Service (production)
```

### Example: Offer Acceptance Flow

```typescript
1. User clicks "Accept" button
   └─> handleAccept(offerId)

2. Local state update
   └─> Remove offer from list (optimistic)

3. Analytics tracking
   └─> analytics.offerAccept(offerId)

4. API call
   └─> POST /api/offers/accept { offerId }

5. Server response
   ├─> Success: Add to wallet
   └─> Error: Restore offer, show error
```

## 📱 Mobile-First Architecture

### Responsive Breakpoints

```typescript
// Tailwind default breakpoints
sm:  640px  // Small tablets
md:  768px  // Tablets
lg:  1024px // Desktop
xl:  1280px // Large desktop
```

### Touch Interaction Pattern

All interactive elements follow the mobile-first approach:

- Minimum touch target: **48×48px**
- Safe area insets: `env(safe-area-inset-*)`
- Gesture support: Swipe, pinch, tap
- Haptic feedback (planned)

## 🔐 Security Architecture

### GPS Triple Verification System

```
User visits location
  ├─> Layer 1: GPS Coordinates
  │   └─> Accuracy: ±3m (Wi-Fi + iBeacon)
  │
  ├─> Layer 2: QR Code Scan
  │   └─> Merchant-provided unique code
  │
  └─> Layer 3: Receipt Upload
      └─> OCR verification (planned)
```

### Data Privacy

- **Location data**: Anonymized with geohash5
- **PII**: Never logged to analytics
- **Payment**: Tokenized through payment provider
- **QR codes**: Time-limited, single-use

## 📊 Analytics Architecture

### Event Schema

```typescript
interface AnalyticsEvent {
  name: string;              // Event name (e.g., "pass_view")
  properties: {
    [key: string]: any;      // Event-specific data
    timestamp: string;       // ISO 8601
    user_agent: string;      // Browser info
  };
  timestamp: Date;           // Event time
}
```

### Event Categories

1. **Route Events**: Page navigation
2. **Engagement Events**: User interactions
3. **Commerce Events**: Purchase, refund
4. **Error Events**: Failed operations

### Batching Strategy

- **Client-side queue**: Max 10 events
- **Flush interval**: 5 seconds
- **Immediate flush**: On page unload
- **Retry logic**: 3 attempts with exponential backoff

## 🚀 Performance Architecture

### Optimization Strategies

#### 1. Code Splitting
```typescript
// Dynamic imports for heavy components
const MapboxMap = dynamic(() => import('./MapboxMap'), {
  loading: () => <LoadingState />,
  ssr: false,
});
```

#### 2. Image Optimization
```typescript
// Next.js Image component
<Image
  src={coverUrl}
  alt={title}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

#### 3. Route Prefetching
- Next.js automatic link prefetching
- Hover intent prefetching (planned)

#### 4. Caching Strategy
```
Browser Cache
  ├─> Static assets: 1 year
  ├─> API responses: 5 minutes
  └─> Images: 1 week
```

### Performance Metrics

Target Web Vitals:
- **LCP**: ≤ 2.5s (Hero image/content)
- **FID/INP**: ≤ 200ms (Interaction latency)
- **CLS**: ≤ 0.1 (Layout stability)

## ♿ Accessibility Architecture

### WCAG AA Compliance

#### Semantic HTML
```tsx
<nav role="tablist">
  <button role="tab" aria-selected={active}>
    Pass
  </button>
</nav>
```

#### Keyboard Navigation
- Tab order: Natural flow
- Focus indicators: 2px ring
- Skip links: To main content
- Escape key: Close modals

#### Screen Reader Support
- ARIA labels on all interactive elements
- Live regions for dynamic updates
- Alternative text for images
- Status announcements

#### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🔄 State Management Strategy

### Local State (useState)
- Component-specific UI state
- Form inputs
- Toggle states

### URL State (useSearchParams)
- Filters
- Search queries
- Pagination

### Server State (Future: React Query)
- API data caching
- Optimistic updates
- Background refetching

### Global State (Future: Context/Zustand)
- Authentication
- User preferences
- Cart/basket

## 🧪 Testing Strategy (Planned)

### Unit Tests
- Component rendering
- Utility functions
- Analytics tracking

### Integration Tests
- User flows
- API interactions
- State management

### E2E Tests (Playwright)
- Critical paths
- Payment flow
- QR scanning

### Accessibility Tests
- axe-core integration
- Keyboard navigation
- Screen reader testing

## 🚢 Deployment Architecture

### Build Process

```bash
1. Type checking (tsc)
2. Linting (ESLint)
3. Unit tests
4. Build (next build)
5. Bundle analysis
6. Deploy (Vercel/AWS)
```

### Environment Configuration

```
Development  → localhost:3000
Staging      → staging.zziklive.com
Production   → zziklive.com
```

### Feature Flags (Planned)

```typescript
const features = {
  mapboxIntegration: process.env.NEXT_PUBLIC_ENABLE_MAPBOX === 'true',
  qrScanner: process.env.NEXT_PUBLIC_ENABLE_QR === 'true',
  payment: process.env.NEXT_PUBLIC_ENABLE_PAYMENT === 'true',
};
```

## 📈 Scalability Considerations

### Client-Side
- Code splitting by route
- Lazy loading for images/videos
- Virtual scrolling for long lists
- Service worker for offline support

### Server-Side (Future)
- CDN for static assets
- API caching with Redis
- Database query optimization
- Horizontal scaling with load balancer

## 🔧 Development Workflow

### Git Workflow

```
main (production)
  ├── staging (pre-production)
  └── feature/* (development branches)
```

### Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation
style: Formatting
refactor: Code restructure
test: Add tests
chore: Maintenance
```

## 📚 Technology Stack Summary

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + CSS Variables
- **Icons**: Lucide React
- **Images**: Next.js Image Optimization

### Future Integrations
- **Maps**: Mapbox GL JS
- **QR Scanner**: zxing-wasm
- **State**: Zustand/Jotai
- **Forms**: React Hook Form
- **Validation**: Zod
- **HTTP**: Axios/fetch
- **Testing**: Vitest + Playwright

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: PostgreSQL (planned)
- **Cache**: Redis (planned)
- **CDN**: Cloudflare/Vercel Edge
- **Analytics**: Mixpanel/Amplitude (planned)

---

This architecture is designed to be:
- **Scalable**: Handles growth in users and features
- **Maintainable**: Clear separation of concerns
- **Performant**: Optimized for mobile devices
- **Accessible**: WCAG AA compliant
- **Secure**: Multiple verification layers

Last updated: 2024-11-13

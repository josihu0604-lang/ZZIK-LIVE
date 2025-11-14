# ZZIK LIVE Repository Setup

## 🏢 Overview

ZZIK LIVE is a location-based real-time experience platform implementing triple verification (GPS, QR, Receipt) with strict geo-privacy principles.

## 🔧 Core Requirements

### Runtime Environment

- **Node.js**: v20.19.5 (strict requirement)
- **npm**: 10.8.2 or higher
- **PostgreSQL**: 15+ with PostGIS extension
- **Redis**: 7+ (for caching and rate limiting)

### Workspace Structure

```
- apps/*      # Application packages
- packages/*  # Shared packages
- infra/*     # Infrastructure configurations
```

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd zzik-live

# 2. Install correct Node version
nvm install 20.19.5
nvm use 20.19.5

# 3. Install dependencies
npm ci

# 4. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 5. Setup database
npm run db:migrate
npm run db:seed

# 6. Run development server
npm run dev
```

## 🎯 Branch Strategy

- **main**: Production-ready code (protected)
  - Requires 1+ review
  - All CI checks must pass
  - No direct pushes
- **develop**: Integration branch
- **feature/\***: Feature development
- **hotfix/\***: Critical fixes
- **release/\***: Release preparation

## 🧹 Available Scripts

### Development

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server

### Quality Checks

- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking
- `npm run format` - Format with Prettier

### Testing

- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:load` - Run load tests with k6

### Database

- `npm run db:migrate` - Apply migrations
- `npm run db:seed` - Seed test data

### Utilities

- `npm run clean` - Clean build artifacts
- `npm run backup` - Create project backup
- `npm run health` - System health check

## 🔒 Security & Privacy

### Geo-Privacy Principle

- **NEVER** store or log raw coordinates (lat/lng)
- **ALWAYS** use geohash5 (5-character precision, ~4.9km x 4.9km)
- ESLint rules enforce this automatically

### Required Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: <policy>`
- `X-RateLimit-*` headers on all APIs

### API Requirements

- All mutation requests require `Idempotency-Key`
- Rate limiting applied per endpoint
- Request ID tracking for debugging

## 📊 Performance SLOs

### Data Quality

- Ingest success rate: ≥ 97%
- Data duplication: 0%
- Processing latency p95: ≤ 60s

### Application Performance

- LCP p75: ≤ 2.5s
- FID p75: ≤ 100ms
- CLS: ≤ 0.1
- Error rate: ≤ 0.3%

### API Performance

- Nearby search p95: ≤ 100ms
- Text search p95: ≤ 80ms
- QR validation p95: ≤ 50ms

## 🆘 CI/CD Pipeline

### GitHub Actions Workflows

1. **CI** (on push/PR)
   - Lint & type check
   - Unit tests
   - Build verification
   - Geo-privacy compliance check

2. **E2E** (on PR)
   - Playwright tests
   - Performance validation
   - Security header checks

3. **Security** (on push/PR + weekly)
   - CodeQL analysis
   - Dependency audit
   - Secret scanning
   - Geo-privacy validation

## 📝 Documentation

### Key Documents

- `docs/REPO_SETUP.md` - This document
- `docs/SECURITY.md` - Security policies and procedures
- `docs/OPERATIONS.md` - Operational procedures and SLOs
- `docs/CONTRIBUTING.md` - Contribution guidelines

### API Documentation

- OpenAPI/Swagger specs in `/apps/web/api-docs`
- Postman collections in `/docs/postman`

## 🏷️ Labels

### Type Labels

- `type:feature` - New features
- `type:bug` - Bug fixes
- `type:chore` - Maintenance tasks

### Component Labels

- `mapbox` - Map-related
- `qr` - QR code features
- `wallet` - Payment/wallet features
- `analytics` - Analytics tracking
- `security` - Security improvements
- `a11y` - Accessibility
- `perf` - Performance
- `docs` - Documentation

## 👥 Teams

### Code Ownership

- See `.github/CODEOWNERS` for detailed ownership
- Core teams: @core/engineers, @web/owners, @platform/owners

## 🚑 Emergency Procedures

### Hotfix Process

1. Create `hotfix/*` branch from `main`
2. Apply fix with tests
3. Create PR directly to `main`
4. Deploy after approval
5. Backport to `develop`

### Rollback Process

1. Identify last known good deployment
2. Revert via GitHub UI or `git revert`
3. Deploy reverted version
4. Create incident report

## 📞 Support

- **Slack**: #zzik-dev
- **On-call**: See PagerDuty schedule
- **Documentation**: Internal wiki

---

**Last Updated**: 2024
**Version**: 1.0.0

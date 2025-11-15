# ZZIK LIVE Operations Guide

## Environment Variables

### Required Secrets
- `DATABASE_URL`: PostgreSQL connection string with PostGIS extension
- `REDIS_URL`: Redis connection string for caching and rate limiting
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox API token for map features
- `NEXTAUTH_URL`: Application URL for authentication
- `NEXTAUTH_SECRET`: Secret for NextAuth.js session encryption (use `openssl rand -hex 32`)

### Optional Configuration
- `FEATURE_FEED_LABS`: Enable experimental feed feature (default: false)
- `REQUIRE_AUTH_FOR_VERIFY`: Require authentication for verification (default: false)
- `SEARCH_RANK_IMPL`: Search ranking implementation (tsrank|popularity, default: tsrank)

## Deployment

### Local Development
```bash
# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker compose up -d

# Run migrations
npx prisma migrate dev

# Seed data
psql "$DATABASE_URL" -f scripts/seed-mini.sql
psql "$DATABASE_URL" -f scripts/seed-verify.sql

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build Docker image
docker build -t zzik-live:latest .

# Run with docker-compose
docker compose -f docker-compose.yml up -d

# Run migrations
docker compose exec web npx prisma migrate deploy
```

## Branch Protection Rules

### Required Status Checks
1. **verify-pr**: Must pass before merging
   - Type checking
   - Linting (including privacy rules)
   - Unit tests with coverage
   - E2E tests
   - Accessibility tests
   - Security headers verification
   - Performance smoke tests

### Recommended Settings
- Require pull request reviews before merging
- Dismiss stale pull request approvals when new commits are pushed
- Require branches to be up to date before merging
- Include administrators in restrictions

## Monitoring & Alerts

### Health Checks
- **Endpoint**: `/api/health`
- **Expected Response**: `{"status":"ok"}`
- **Frequency**: Every 30 seconds
- **Alert Threshold**: 3 consecutive failures

### Key Metrics to Monitor
1. **Response Times**
   - p95 < 800ms for wallet operations
   - p95 < 80ms for nearby places
   - p95 < 150ms for search

2. **Error Rates**
   - 4xx errors < 5%
   - 5xx errors < 0.1%

3. **Database**
   - Connection pool utilization < 80%
   - Query execution time p95 < 100ms
   - PostGIS spatial index usage > 90%

4. **Redis**
   - Memory usage < 75%
   - Hit rate > 85%
   - Connection count < max connections - 10

## Rollback Procedures

### Code Rollback
```bash
# Identify last working commit
git log --oneline

# Revert to previous version
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

### Database Migration Rollback
```bash
# Check migration status
npx prisma migrate status

# Create down migration
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script > rollback.sql

# Apply rollback
psql "$DATABASE_URL" -f rollback.sql

# Reset to previous migration
npx prisma migrate resolve --rolled-back <migration-name>
```

## Security Considerations

### Rate Limiting
- Wallet operations: 60 requests/minute per IP
- Search operations: 100 requests/minute per IP
- Upload operations: 10 requests/minute per IP

### Privacy Protection
- Never log raw lat/lng coordinates
- Use geohash (5-6 characters) for location privacy
- PII data must be sanitized before logging
- ESLint rules enforce privacy constraints

### Headers Security
All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Troubleshooting

### Common Issues

#### PostGIS Extension Missing
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u "$REDIS_URL" ping

# Check Redis memory
redis-cli -u "$REDIS_URL" info memory
```

#### Slow Spatial Queries
```sql
-- Check if GIST index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'Place' AND indexdef LIKE '%gist%';

-- Create if missing
CREATE INDEX IF NOT EXISTS place_location_gist ON "Place" USING GIST(location);
```

## Performance Optimization

### Database
- Ensure GIST indexes on all geography columns
- Use connection pooling (default: 10 connections)
- Regular VACUUM ANALYZE for statistics

### Application
- Enable Redis caching for idempotency
- Use geohash prefixes for proximity filtering
- Implement cursor-based pagination for large datasets

### Client-Side
- Implement request debouncing
- Use Idempotency-Key for all mutations
- Cache search results for 60 seconds

## Contact & Support

- **On-Call**: Check PagerDuty rotation
- **Slack Channel**: #zzik-ops
- **Documentation**: /docs directory
- **Runbook**: /docs/runbook.md
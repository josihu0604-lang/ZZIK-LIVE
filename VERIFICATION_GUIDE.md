# 🔐 GPS×QR×Receipt Verification System v1

## Overview
Comprehensive triple verification system with 4-state QR validation, idempotency protection, and rate limiting.

## 🎯 Features

### 1. QR Code Verification
- **Endpoint**: `POST /api/qr/verify`
- **4 States**: `ok`, `expired`, `used`, `invalid`
- **Requirements**: Idempotency-Key header (mandatory)
- **Performance**: p95 < 800ms

### 2. GPS Location Verification  
- **Endpoint**: `POST /api/verify/location`
- **Threshold**: 120 meters from place location
- **Privacy**: Only geohash5 logged

### 3. Receipt Processing
- **Upload**: `POST /api/receipts/upload`
- **OCR**: `POST /api/receipts/ocr`
- **Status**: `pending`, `ok`, `fail`

### 4. Complete Verification
- **Endpoint**: `POST /api/verify/complete`
- **Policy**: GPS required AND (QR OR Receipt)

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure PostgreSQL and Redis are running
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zzik
export REDIS_URL=redis://localhost:6379
```

### Setup
```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Seed test data
psql "$DATABASE_URL" -f scripts/seed-verify.sql

# Start dev server
npm run dev
```

### Testing
```bash
# Run automated tests
./scripts/test-verify-endpoints.sh

# Run E2E tests
npm run test:e2e

# Run performance tests
k6 run k6/qr-smoke.js -e BASE_URL=http://localhost:3000
```

## 📊 API Examples

### QR Verification
```bash
curl -X POST http://localhost:3000/api/qr/verify \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: unique-key-123' \
  -d '{
    "token": "123456",
    "placeId": "p1",
    "locGeohash5": "wydm6"
  }'
```

**Response**:
```json
{
  "status": "ok"
}
```

**Headers**:
- `X-Request-Id`: Unique request identifier
- `X-RateLimit-Limit`: Rate limit ceiling
- `X-RateLimit-Remaining`: Requests remaining
- `X-Verification-State`: Verification result
- `X-Idempotent-Replay`: `1` if replayed, `0` if fresh

### Location Verification
```bash
curl -X POST http://localhost:3000/api/verify/location \
  -H 'Content-Type: application/json' \
  -d '{
    "placeId": "p1",
    "userGeohash5": "wydm6",
    "ts": 1731590400000
  }'
```

**Response**:
```json
{
  "gpsOk": true,
  "distanceMeters": 85
}
```

### Complete Verification
```bash
curl -X POST http://localhost:3000/api/verify/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "placeId": "p1"
  }'
```

**Response**:
```json
{
  "allowed": true,
  "gpsOk": true,
  "qrOk": true,
  "receiptOk": false
}
```

## 🔒 Security Features

### Rate Limiting
- **Limit**: 60 requests per minute per endpoint
- **Identifier**: SHA-256 hashed IP address
- **Response**: 429 status with retry headers

### Idempotency
- **Key**: Required for QR verification
- **TTL**: 24 hours
- **Storage**: Redis with fail-open design

### Privacy
- **Logging**: Only geohash5 (no raw coordinates)
- **IP Hashing**: SHA-256 for rate limiting
- **Token Security**: SHA-256 hashing

## 📈 Performance Targets

| Metric | Target | Actual |
|--------|--------|---------|
| QR Verify p95 | ≤ 800ms | ✅ Met |
| Location Verify p95 | ≤ 150ms | ✅ Met |
| Error Rate | < 1% | ✅ Met |

## ⚠️ Known Limitations

1. **Session Integration**: Currently using 'current' stub for userId
2. **Geohash Precision**: ~150m accuracy with geohash5
3. **OCR Stub**: Receipt OCR is currently a stub implementation

## 🔄 Rollback Plan

If issues arise:
```bash
# 1. Revert code
git revert <commit-hash>

# 2. Drop new tables
psql "$DATABASE_URL" -c 'DROP TABLE IF EXISTS "Verification" CASCADE;'

# 3. Clear Redis keys
redis-cli --scan --pattern "idem:*" | xargs redis-cli del
redis-cli --scan --pattern "rl:*" | xargs redis-cli del
```

## 📝 Database Schema

### Verification Model
```prisma
model Verification {
  id         String   @id @default(cuid())
  userId     String
  placeId    String
  gpsOk      Boolean  @default(false)
  qrOk       Boolean  @default(false)
  receiptOk  Boolean  @default(false)
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())
  
  @@unique([userId, placeId])
}
```

## 🧪 Testing Coverage

- ✅ Unit tests for idempotency utility
- ✅ Unit tests for rate limiting
- ✅ E2E tests for all endpoints
- ✅ Performance tests with k6
- ✅ 4-state validation tests
- ✅ Idempotency replay tests

## 📚 Related Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Security Guidelines](docs/SECURITY.md)
- [API Documentation](docs/API.md)
- [Database Schema](prisma/schema.prisma)
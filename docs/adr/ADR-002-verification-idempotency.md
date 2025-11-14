# ADR-002: Verification System Idempotency and State Management

## Status
Accepted

## Context
The ZZIK LIVE verification system requires protection against duplicate QR code redemptions and ensures exactly-once semantics for critical verification operations. Without idempotency guarantees, users could potentially:
- Redeem the same QR code multiple times
- Create race conditions in verification state updates
- Cause inconsistent reward distributions

## Decision

### 1. Idempotency Key Requirement
All state-changing verification operations (specifically QR verification) MUST include an `Idempotency-Key` header:
- **Format**: Any string identifier (recommended: UUID v4 or timestamp-based unique ID)
- **Validation**: Required for `/api/qr/verify`, returns 422 if missing
- **Scope**: Per-endpoint (QR verification keys are isolated from other operations)

### 2. Cache TTL Policy
Idempotency results are cached with the following TTL:
- **Default TTL**: 24 hours (86,400 seconds)
- **Rationale**: 
  - Covers typical user session lifetime
  - Prevents stale cache accumulation
  - Balances replay detection with storage costs
- **Storage**: Redis with fail-open design (continues on cache failure)

### 3. Key Naming Convention
Idempotency cache keys follow the pattern: `idem:{operation}:{client-key}`
- QR verification: `idem:qr:{idempotency-key}`
- Future operations can use: `idem:wallet:{idempotency-key}`, etc.

### 4. Response Headers
APIs utilizing idempotency MUST return:
```
X-Idempotent-Replay: 0   # First execution
X-Idempotent-Replay: 1   # Cached replay
```

### 5. 4-State QR Verification
QR tokens follow a strict state machine:
```
issued → used (success)
       → expired (TTL exceeded)
       → revoked (manual invalidation)
       
States returned to client:
- ok: Token successfully verified and marked as used
- used: Token already consumed
- expired: Token exceeded its TTL
- invalid: Token doesn't exist, wrong place, or revoked
```

### 6. Verification Policy
Complete verification requires:
```
gpsOk = true AND (qrOk = true OR receiptOk = true)
```

This policy ensures:
- Physical presence (GPS) is mandatory
- At least one proof of transaction (QR or receipt)
- Flexibility for users (can use either QR or receipt)

## Implementation Details

### Idempotency Utility
```typescript
// lib/server/idempotency.ts
export async function withIdempotency<T>(
  key: string,
  exec: () => Promise<T>,
  ttlSec: number = 86400
): Promise<IdempotencyResult<T>>
```

### QR Token State Transitions
```typescript
// Atomic transaction ensuring consistency
await prisma.$transaction([
  prisma.qRToken.update({
    where: { id: tokenId },
    data: { status: 'used', usedAt: new Date() }
  }),
  prisma.verification.upsert({
    where: { userId_placeId: { userId, placeId } },
    update: { qrOk: true },
    create: { userId, placeId, qrOk: true }
  })
]);
```

## Consequences

### Positive
- **Exactly-once semantics**: Duplicate requests return cached results
- **Race condition protection**: Atomic DB transactions prevent concurrent updates
- **Client resilience**: Clients can safely retry failed requests
- **Audit trail**: All state transitions are logged with geohash5 (privacy-preserving)

### Negative
- **Storage overhead**: Redis memory for 24h cache (mitigated by expiry)
- **Clock skew sensitivity**: Client-generated timestamps may vary (mitigated by server-side validation)
- **Key management**: Clients must generate unique keys per operation

### Risks
1. **Redis unavailability**: Mitigated by fail-open design (logs warning, continues execution)
2. **Key collision**: Extremely unlikely with UUID v4 (2^122 space)
3. **Replay attack**: Legitimate concern if attacker captures valid Idempotency-Key
   - Mitigation: HTTPS required, short TTL, user-session binding (future)

## Alternatives Considered

### 1. Database-based idempotency
**Rejected**: Higher latency, DB load, and complexity
- Would require additional table with cleanup jobs
- Slower than Redis for high-frequency reads

### 2. Shorter TTL (1-6 hours)
**Rejected**: Doesn't cover edge cases (user leaves mid-redemption, returns hours later)

### 3. No idempotency protection
**Rejected**: Unacceptable risk of duplicate redemptions and financial loss

### 4. Client-side duplicate prevention only
**Rejected**: Not sufficient - network failures, malicious actors, client bugs

## Migration Path
No migration needed for existing data. New endpoints:
- `/api/qr/verify` - idempotency required
- `/api/verify/location` - idempotency optional (safe to replay)
- `/api/verify/complete` - read-only, no idempotency needed

## Monitoring & Metrics
Track the following:
```
# Idempotency replay rate (should be <5% under normal conditions)
idem_replay_rate = replays / total_requests

# QR verification state distribution
qr_verify_state{state="ok|used|expired|invalid"}

# Average verification latency
qr_verify_p95_ms < 800
```

## References
- [RFC 5789](https://tools.ietf.org/html/rfc5789) - PATCH method and idempotency
- [Stripe API Idempotency](https://stripe.com/docs/api/idempotent_requests)
- [AWS DynamoDB Conditional Writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ConditionalUpdate)

## Changelog
- 2024-11-14: Initial version covering QR verification
- Future: Extend to wallet redemption, receipt processing
# ADR-003: Wallet Redeem Idempotency Implementation

## Status
Accepted

## Context
The wallet redeem functionality needs to handle duplicate requests gracefully to prevent double-spending of vouchers and ensure reliable client-server communication. Network issues, client retries, or user double-clicks could result in duplicate redemption attempts.

## Decision
We will implement idempotency using:
1. **Idempotency-Key header**: Required header for all redeem requests
2. **Redis-based caching**: Store results with 24-hour TTL
3. **State machine**: Voucher status transitions (issued → used, expired, revoked)
4. **Performance target**: p95 < 800ms response time

### Implementation Details
- Use Redis for idempotency key storage with atomic operations
- Combine idempotency key with voucher ID for unique cache keys
- Return `X-Idempotent-Replay: 1` header for replayed requests
- Rate limiting: 60 requests per minute per IP

## Alternatives Considered

### Alternative 1: Database-only unique constraints
- **Pros**: Simpler implementation, no Redis dependency
- **Cons**: Slower performance, harder to implement TTL, no replay detection

### Alternative 2: In-memory cache
- **Pros**: Fastest performance
- **Cons**: Lost on server restart, doesn't work with multiple instances

### Alternative 3: Distributed lock with timeout
- **Pros**: Strong consistency guarantees
- **Cons**: Complex implementation, potential deadlocks, slower performance

## Consequences

### Positive
- **Reliability**: Prevents double-spending even with network issues
- **Performance**: Fast response times with Redis caching
- **API Symmetry**: Consistent with industry standards (Stripe, etc.)
- **Observability**: Clear replay detection via headers
- **Scalability**: Works with multiple server instances

### Negative
- **Complexity**: Additional Redis dependency
- **Memory Usage**: Cache storage for 24 hours
- **Client Requirements**: Must generate and send Idempotency-Key

## Implementation Notes
- Clients should use UUID v4 for idempotency keys
- Keys are scoped to voucher ID to prevent cross-voucher conflicts
- Failed operations are not cached (only successful results)
- Cache TTL matches typical retry window (24 hours)

## References
- [Stripe Idempotency](https://stripe.com/docs/api/idempotent_requests)
- [RFC 7232 - HTTP Conditional Requests](https://tools.ietf.org/html/rfc7232)
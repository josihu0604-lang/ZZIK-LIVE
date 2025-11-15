# Schema Migration Required

## Overview
This document tracks database schema changes needed to match the application code expectations. These changes require Prisma schema updates and database migrations.

## QRToken Schema Missing Fields

**Location**: `prisma/schema.prisma` - `QRToken` model

### Required Changes

```prisma
model QRToken {
  id        String   @id @default(cuid())
  codeHash  String   @unique
  placeId   String
  place     Place    @relation(fields: [placeId], references: [id])
  status    String   @db.VarChar(16) // issued|used|expired|revoked
  ttlSec    Int      @default(600)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  // ⚠️ MISSING FIELDS - Required by lib/qr/verification.ts:
  usedBy    String?  // User ID who used the token (line 169)
  failReason String? // Reason for failure/expiry (lines 104, 152, 191, 246)
  
  @@index([placeId, status])
  @@index([status, createdAt])
  @@index([createdAt(sort: Desc)])
  @@index([codeHash, status])
}
```

### Affected Files

1. **lib/qr/verification.ts**
   - Line 104: `failReason: 'Token expired due to TTL'`
   - Line 138: `message: qrToken.failReason || undefined`
   - Line 152: `failReason: \`Distance too large...\``
   - Line 169: `usedBy: userId || 'anonymous'`
   - Line 191: `failReason: error.message || 'Internal error'`
   - Line 246: `failReason: 'Token expired due to TTL'`

2. **components/qr/QRScannerView.tsx**
   - Uses QR verification logic that depends on these fields

### Migration Steps

1. Update `prisma/schema.prisma` with missing fields
2. Run `npx prisma migrate dev --name add_qr_token_tracking_fields`
3. Run `npx prisma generate` to update TypeScript types
4. Remove `components/qr/**` and `lib/qr/**` from tsconfig.json excludes
5. Run `npx tsc --noEmit` to verify

### Impact Assessment

- **Data Loss Risk**: Low - adding nullable fields
- **Backward Compatibility**: Good - nullable fields won't break existing data
- **Urgency**: Medium - QR verification functionality incomplete without these fields

## Status

- [x] TypeScript errors identified and documented
- [x] Migration plan created
- [ ] Schema updated
- [ ] Migration executed
- [ ] TypeScript compilation verified
- [ ] Feature tested end-to-end

## Notes

These fields are essential for:
- **Audit trail**: Tracking which user redeemed which QR code (`usedBy`)
- **Error tracking**: Recording why tokens fail verification (`failReason`)
- **Debugging**: Understanding QR verification failures
- **Compliance**: User activity logging for security/fraud detection

The fields should be added before deploying QR code functionality to production.

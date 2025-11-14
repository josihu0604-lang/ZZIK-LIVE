# ZZIK LIVE Security Policy

## 🔒 Privacy First Principle

### Geo-Privacy Protection

#### ⛔ FORBIDDEN

- **NEVER** store, log, or transmit raw coordinates:
  - `lat`, `lng`, `latitude`, `longitude`
  - GPS coordinates in any format
  - Precise location data

#### ✅ REQUIRED

- **ALWAYS** use geohash5 (5-character precision)
  - Example: `u4pru` (~4.9km x 4.9km area)
  - Provides sufficient precision for business needs
  - Protects user privacy

#### Implementation

```typescript
// ❌ WRONG - Never do this
console.log(`User location: lat=${lat}, lng=${lng}`);

// ✅ CORRECT - Always use geohash5
console.log(`User area: geohash5=${geohash5}`);
```

## 🛵 Security Headers

### Required Headers

```typescript
// All responses must include these headers
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}
```

### Content Security Policy (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com;
  style-src 'self' 'unsafe-inline' https://api.mapbox.com;
  img-src 'self' data: blob: https://*.mapbox.com;
  font-src 'self' data:;
  connect-src 'self' https://api.mapbox.com https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Permissions Policy

```
Permissions-Policy:
  camera=(self),
  microphone=(),
  geolocation=(self),
  payment=(self),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

## 🆘 API Security

### Rate Limiting

All API endpoints must implement rate limiting:

```typescript
// Response headers for rate limiting
{
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '1699564800',
  'Retry-After': '60' // On 429 responses
}
```

### Rate Limits by Endpoint

| Endpoint              | Limit   | Window |
| --------------------- | ------- | ------ |
| /api/auth/\*          | 5 req   | 1 min  |
| /api/analytics        | 100 req | 1 min  |
| /api/map/search       | 30 req  | 1 min  |
| /api/qr/scan          | 10 req  | 1 min  |
| /api/receipt/validate | 5 req   | 1 min  |

### Idempotency

All mutation requests must include:

```
Idempotency-Key: <unique-key>
```

### Request Validation

- Input validation using Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection via tokens

## 🔐 Authentication & Authorization

### Session Management

- Sessions expire after 30 days of inactivity
- Refresh tokens rotate on use
- Secure, HttpOnly, SameSite cookies

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### MFA Support

- TOTP (Time-based One-Time Password)
- SMS backup (with rate limiting)
- Recovery codes (one-time use)

## 🛡️ Data Protection

### Encryption

#### At Rest

- Database: AES-256 encryption
- File storage: Encrypted S3 buckets
- Backups: Encrypted archives

#### In Transit

- TLS 1.3 minimum
- HSTS enforcement
- Certificate pinning for mobile apps

### PII Handling

- Minimal data collection
- Data retention policies:
  - User data: 2 years after last activity
  - Analytics: 90 days
  - Logs: 30 days
- Right to erasure (GDPR compliance)

## 🚑 Incident Response

### Severity Levels

1. **Critical**: Data breach, system compromise
2. **High**: Authentication bypass, PII exposure
3. **Medium**: XSS, CSRF vulnerabilities
4. **Low**: Information disclosure, minor issues

### Response Process

1. **Detection**: Automated alerts or user reports
2. **Triage**: Assess severity and impact
3. **Containment**: Isolate affected systems
4. **Remediation**: Apply fixes and patches
5. **Recovery**: Restore normal operations
6. **Post-mortem**: Document and learn

### Contact

**Security Team Email**: security@zzik.live
**Response Time**:

- Critical: 15 minutes
- High: 1 hour
- Medium: 4 hours
- Low: 24 hours

## 📝 Compliance

### Standards

- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PCI DSS (Payment Card Industry Data Security Standard)
- ISO 27001 (Information Security Management)

### Auditing

- Quarterly security audits
- Annual penetration testing
- Continuous vulnerability scanning
- Dependency security monitoring

## 🔍 Security Checklist

### Before Deployment

- [ ] All inputs validated
- [ ] No raw coordinates in code
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Authentication required where needed
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak information
- [ ] Dependencies updated
- [ ] Security scan passed

### Code Review

- [ ] No hardcoded secrets
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] Proper error handling
- [ ] Audit logging implemented
- [ ] Geohash5 used for all location data

## 🐛 Vulnerability Reporting

### Responsible Disclosure

1. Email security@zzik.live with details
2. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow 90 days for fix before public disclosure

### Bug Bounty Program

- Critical: $5,000 - $10,000
- High: $1,000 - $5,000
- Medium: $500 - $1,000
- Low: $100 - $500

## 📦 Dependencies

### Management

- Weekly automated dependency updates
- Security patches applied immediately
- Major updates tested in staging first

### Approved Libraries

- Authentication: Supabase Auth
- Validation: Zod
- Encryption: Node.js crypto
- Rate Limiting: express-rate-limit
- CORS: cors package

---

**Last Security Review**: 2024-01
**Next Review**: 2024-04
**Policy Version**: 1.0.0

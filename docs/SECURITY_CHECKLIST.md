# 🔒 ZZIK LIVE Security Checklist

> Last Updated: 2024-11-13
> Version: 2.0.0 (Hardening Pack)

## 📋 Quick Checklist

### ✅ Security Headers

- [ ] `X-Frame-Options: DENY` active
- [ ] `Content-Security-Policy` with `frame-ancestors 'none'`
- [ ] `Cross-Origin-Embedder-Policy: require-corp`
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] `Cross-Origin-Resource-Policy: same-origin`
- [ ] `Strict-Transport-Security` with preload
- [ ] All API responses include `X-RateLimit-*` headers
- [ ] QR verification allows only `Origin == APP_ORIGIN`

### ✅ Privacy & Data Protection

- [ ] Raw coordinates never logged (0 occurrences)
- [ ] Only geohash5 in logs/events
- [ ] All sensitive fields redacted in logs
- [ ] PII automatically removed from error messages
- [ ] Analytics events use geohash5 only

### ✅ Rate Limiting & Protection

- [ ] QR verify: 30 requests/minute per IP
- [ ] API endpoints have rate limits
- [ ] Idempotency-Key required for mutations
- [ ] Token bucket + sliding window implemented
- [ ] Composite rate limiting (IP + User)

### ✅ QR Verification (4-State System)

- [ ] States: `success`, `invalid`, `expired`, `already_used`
- [ ] Distance verification ≤ 50m
- [ ] TTL enforcement
- [ ] Device duplicate prevention
- [ ] Idempotency required

### ✅ Performance Targets

- [ ] `/places/nearby` p95 ≤ 100ms
- [ ] `/search` p95 ≤ 80ms, p99 ≤ 150ms
- [ ] LCP p75 ≤ 2.5s
- [ ] INP p75 ≤ 200ms
- [ ] Error rate < 0.5%

### ✅ Database Optimization

- [ ] PostGIS GIST indexes created
- [ ] Text search GIN indexes active
- [ ] Covering indexes for hot queries
- [ ] Materialized views refreshed daily
- [ ] VACUUM ANALYZE scheduled

### ✅ CI/CD Security

- [ ] CodeQL analysis enabled
- [ ] Secret scanning active
- [ ] Dependency review on PRs
- [ ] Security headers test in CI
- [ ] License compliance check

## 🚀 Quick Commands

```bash
# Security verification
npm run security:check        # Full security audit
npm run headers:verify        # Check security headers
npm run lint:privacy          # Check for privacy violations

# Testing
npm run test:security         # Run security-specific tests
npm run k6:smoke             # Performance & security smoke test

# Database
npm run db:indexes           # Apply performance indexes
npm run db:migrate           # Apply schema migrations

# Monitoring
npm run doctor               # System health check
```

## 📊 Monitoring & Alerts

### Key Metrics to Track

| Metric                       | Target  | Alert Threshold |
| ---------------------------- | ------- | --------------- |
| QR Verification Success Rate | ≥ 99%   | < 95%           |
| API Error Rate               | < 0.3%  | > 0.5%          |
| p95 Response Time            | < 150ms | > 200ms         |
| Rate Limit Violations        | < 1%    | > 5%            |
| CSP Violations               | 0       | > 10/hour       |

### Log Patterns to Monitor

```sql
-- Privacy violations (should be 0)
SELECT COUNT(*) FROM logs
WHERE message LIKE '%lat%'
   OR message LIKE '%lng%'
   OR message LIKE '%latitude%'
   OR message LIKE '%longitude%';

-- Rate limit abuse
SELECT ip, COUNT(*) as violations
FROM logs
WHERE status = 429
GROUP BY ip
HAVING COUNT(*) > 100;

-- QR verification failures
SELECT state, COUNT(*)
FROM qr_verifications
WHERE state != 'success'
GROUP BY state;
```

## 🔧 Troubleshooting

### Common Issues

#### 1. CSP Violations

**Symptom**: Scripts blocked, console errors
**Solution**:

```bash
# Check CSP report
grep "CSP" logs/app.log | tail -20

# Update nonce in middleware
# Add hash to CSP whitelist if needed
```

#### 2. Rate Limiting False Positives

**Symptom**: Legitimate users getting 429
**Solution**:

```javascript
// Increase limits in rate-limit.ts
checkAndConsume(key, 60); // Increase from 30 to 60
```

#### 3. QR Verification Failures

**Symptom**: High invalid/expired rates
**Solution**:

```sql
-- Check token TTL distribution
SELECT
  CASE
    WHEN age < 60 THEN '<1min'
    WHEN age < 300 THEN '1-5min'
    ELSE '>5min'
  END as age_bucket,
  COUNT(*)
FROM (
  SELECT EXTRACT(EPOCH FROM (used_at - created_at)) as age
  FROM qr_tokens
) t
GROUP BY age_bucket;
```

## 🚨 Incident Response

### Security Incident Checklist

1. **Detection**
   - [ ] Alert received
   - [ ] Severity assessed
   - [ ] Stakeholders notified

2. **Containment**
   - [ ] Affected systems identified
   - [ ] Rate limits tightened
   - [ ] Suspicious IPs blocked
   - [ ] Services degraded if needed

3. **Investigation**
   - [ ] Logs collected
   - [ ] Timeline established
   - [ ] Attack vector identified
   - [ ] Data exposure assessed

4. **Recovery**
   - [ ] Patches applied
   - [ ] Systems restored
   - [ ] Monitoring increased
   - [ ] Users notified if needed

5. **Post-Mortem**
   - [ ] Root cause documented
   - [ ] Lessons learned
   - [ ] Preventive measures implemented
   - [ ] Runbook updated

## 📚 Security Best Practices

### Development

1. **Never log raw coordinates**
   - Use geohash5 for all location tracking
   - Run `npm run lint:privacy` before commits

2. **Always use structured logging**
   - Import from `@/lib/server/logger`
   - Never use `console.log` directly

3. **Implement rate limiting**
   - Use `checkAndConsume` for all APIs
   - Add composite limits for critical endpoints

4. **Require idempotency**
   - Mutations must have `Idempotency-Key`
   - Cache responses for 5 minutes

### Deployment

1. **Environment Variables**
   - Use `.env.example` as template
   - Never commit `.env` files
   - Rotate secrets quarterly

2. **Security Headers**
   - Run `npm run headers:verify` after deploy
   - Check CSP reports daily
   - Update nonce implementation if needed

3. **Database**
   - Apply indexes before peak traffic
   - Run VACUUM ANALYZE weekly
   - Monitor slow query log

### Operations

1. **Monitoring**
   - Set up alerts for all thresholds
   - Review security logs daily
   - Track privacy compliance metrics

2. **Backups**
   - Daily automated backups
   - Test restore process monthly
   - Encrypt backups at rest

3. **Updates**
   - Patch dependencies weekly
   - Security updates within 24 hours
   - Test in staging first

## 🎯 Compliance & Audit

### Monthly Security Review

- [ ] Review access logs
- [ ] Check for unusual patterns
- [ ] Verify no PII in logs
- [ ] Update security headers if needed
- [ ] Review and update CSP policy
- [ ] Check dependency vulnerabilities
- [ ] Verify backup integrity
- [ ] Test incident response plan

### Quarterly Security Audit

- [ ] Penetration testing
- [ ] Code security review
- [ ] Infrastructure audit
- [ ] Access control review
- [ ] Compliance check (GDPR, KVKK)
- [ ] Security training for team
- [ ] Update threat model
- [ ] Review and rotate secrets

## 📞 Security Contacts

- **Security Team**: security@zzik.live
- **On-Call**: Use PagerDuty
- **Bug Bounty**: https://zzik.live/security/bounty

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team!

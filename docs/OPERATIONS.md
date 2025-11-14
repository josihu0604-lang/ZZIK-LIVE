# ZZIK LIVE Operations Manual

## 🎯 Service Level Objectives (SLOs)

### Data Quality Metrics

| Metric                 | Target | Measurement                                  |
| ---------------------- | ------ | -------------------------------------------- |
| Ingest Success Rate    | ≥ 97%  | Successfully processed events / Total events |
| Data Duplication       | 0%     | Duplicate events / Total events              |
| Processing Latency p95 | ≤ 60s  | Time from event creation to storage          |
| Error Rate             | ≤ 0.3% | Failed requests / Total requests             |

### Application Performance

| Metric                             | Target  | Measurement      |
| ---------------------------------- | ------- | ---------------- |
| LCP (Largest Contentful Paint) p75 | ≤ 2.5s  | Lighthouse / RUM |
| FID (First Input Delay) p75        | ≤ 100ms | RUM              |
| CLS (Cumulative Layout Shift)      | ≤ 0.1   | Lighthouse / RUM |
| TTFB (Time to First Byte) p95      | ≤ 600ms | Server metrics   |

### API Performance

| Endpoint       | p95 Target | p99 Target |
| -------------- | ---------- | ---------- |
| Nearby Search  | ≤ 100ms    | ≤ 200ms    |
| Text Search    | ≤ 80ms     | ≤ 150ms    |
| QR Validation  | ≤ 50ms     | ≤ 100ms    |
| Receipt Upload | ≤ 500ms    | ≤ 1000ms   |

### Availability

| Service         | Target Uptime | Measurement    |
| --------------- | ------------- | -------------- |
| Web Application | 99.9%         | Monthly uptime |
| API Services    | 99.95%        | Monthly uptime |
| Database        | 99.99%        | Monthly uptime |

## 📡 Monitoring & Alerting

### Key Metrics Dashboard

#### Real-time Metrics

- Active users (1min, 5min, 15min)
- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Database connections
- Memory usage
- CPU usage

#### Business Metrics

- QR scans per hour
- Verifications completed
- Map searches
- User registrations
- Receipt validations

### Alert Conditions

| Alert                    | Condition                  | Priority | Response Time |
| ------------------------ | -------------------------- | -------- | ------------- |
| Service Down             | Uptime check fails         | P1       | 5 min         |
| High Error Rate          | Error rate > 5% for 5 min  | P1       | 5 min         |
| Slow Response            | p95 > 3s for 10 min        | P2       | 15 min        |
| Database Connection Pool | > 80% utilized             | P2       | 30 min        |
| Disk Space               | < 20% free                 | P2       | 1 hour        |
| Certificate Expiry       | < 30 days                  | P3       | 24 hours      |
| Dependency Updates       | Security patches available | P3       | 48 hours      |

## 🚀 Deployment Process

### Pre-deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Change log updated
- [ ] Team notified in #deployments

### Deployment Steps

1. **Staging Deployment**

   ```bash
   git checkout release/v1.x.x
   npm run test
   npm run build
   npm run deploy:staging
   ```

2. **Staging Validation**
   - Run smoke tests
   - Check key user flows
   - Verify monitoring metrics
   - Load test if major changes

3. **Production Deployment**

   ```bash
   npm run deploy:production
   ```

4. **Post-deployment Validation**
   - Monitor error rates for 30 min
   - Check key metrics
   - Verify feature flags
   - Test critical paths

### Rollback Procedure

1. **Identify Issue**
   - Check error logs
   - Review metrics
   - Assess impact

2. **Decision to Rollback**
   - If error rate > 10%
   - If critical feature broken
   - If performance degraded > 50%

3. **Execute Rollback**

   ```bash
   npm run deploy:rollback
   ```

4. **Verify Rollback**
   - Confirm previous version active
   - Check error rates returned to normal
   - Validate key features

## 🛠️ Maintenance Tasks

### Daily

- [ ] Review error logs
- [ ] Check monitoring dashboards
- [ ] Verify backup completion
- [ ] Review security alerts

### Weekly

- [ ] Database optimization
- [ ] Clear old logs
- [ ] Review performance trends
- [ ] Update dependencies
- [ ] Security scan

### Monthly

- [ ] Full backup test
- [ ] Disaster recovery drill
- [ ] Performance audit
- [ ] Security audit
- [ ] SLO review
- [ ] Cost optimization review

## 🔥 Incident Management

### Incident Severity

| Level | Definition                                   | Example                           | Response             |
| ----- | -------------------------------------------- | --------------------------------- | -------------------- |
| P1    | Service down or critical feature broken      | Database outage, auth failure     | Immediate, all hands |
| P2    | Degraded service or important feature broken | Slow responses, search issues     | Within 30 min        |
| P3    | Minor issue with workaround                  | UI glitch, non-critical API issue | Within 4 hours       |
| P4    | Cosmetic or minor issue                      | Typo, minor styling issue         | Next business day    |

### Incident Response Process

1. **Detection**
   - Automated alert
   - User report
   - Monitoring dashboard

2. **Triage**
   - Assess severity
   - Identify scope
   - Assign incident commander

3. **Communication**
   - Create incident channel
   - Update status page
   - Notify stakeholders

4. **Investigation**
   - Review logs
   - Check recent changes
   - Reproduce issue

5. **Mitigation**
   - Apply immediate fix
   - Scale resources if needed
   - Implement workaround

6. **Resolution**
   - Deploy permanent fix
   - Verify resolution
   - Monitor for recurrence

7. **Post-mortem**
   - Document timeline
   - Identify root cause
   - Define action items
   - Share learnings

## 📊 Performance Optimization

### Database Optimization

#### Query Performance

- Monitor slow query log
- Add indexes for frequent queries
- Use EXPLAIN ANALYZE
- Optimize N+1 queries

#### Connection Pool

```javascript
{
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

### Caching Strategy

| Cache Layer | TTL    | Use Case      |
| ----------- | ------ | ------------- |
| CDN         | 1 year | Static assets |
| Redis       | 5 min  | API responses |
| Memory      | 1 min  | Hot data      |
| Browser     | 1 hour | App shell     |

### Bundle Optimization

- Code splitting by route
- Lazy loading components
- Tree shaking unused code
- Minification and compression
- Image optimization (WebP, lazy load)

## 📦 Backup & Recovery

### Backup Schedule

| Type        | Frequency     | Retention   | Location   |
| ----------- | ------------- | ----------- | ---------- |
| Database    | Every 6 hours | 30 days     | S3         |
| Application | On deployment | 10 versions | S3         |
| Logs        | Daily         | 90 days     | S3 Glacier |
| Media       | Real-time     | Indefinite  | S3         |

### Recovery Procedures

#### Database Recovery

1. Stop application servers
2. Restore from backup
   ```bash
   psql -d zzik_live < backup.sql
   ```
3. Verify data integrity
4. Restart application servers
5. Run validation tests

#### Application Recovery

1. Identify last known good version
2. Deploy previous version
3. Restore configuration
4. Verify functionality

## 📋 Runbook Library

### High CPU Usage

1. Check for memory leaks
2. Review recent deployments
3. Check for infinite loops
4. Scale horizontally if needed

### Database Connection Errors

1. Check connection pool settings
2. Verify database is running
3. Check network connectivity
4. Review max connections limit

### Slow API Responses

1. Check database query performance
2. Review cache hit rates
3. Check external service latency
4. Profile application code

### Memory Leak

1. Take heap snapshot
2. Compare snapshots over time
3. Identify growing objects
4. Deploy fix and monitor

## 📨 Communication Channels

| Channel | Purpose | Audience |
|---------|---------|----------||
| #zzik-alerts | Automated alerts | Engineers |
| #zzik-deployments | Deployment notifications | Team |
| #zzik-incidents | Incident coordination | On-call |
| #zzik-dev | Development discussion | Engineers |
| #zzik-support | User issues | Support team |

## 📞 On-Call

### On-Call Responsibilities

- Primary: First responder, incident commander
- Secondary: Backup, assists primary
- Manager: Escalation point, stakeholder communication

### On-Call Rotation

- Weekly rotation (Monday to Monday)
- Handoff meeting every Monday at 10 AM
- On-call compensation per company policy

### On-Call Kit

- Laptop with VPN access
- Phone with PagerDuty app
- Access to all production systems
- Runbook documentation
- Emergency contact list

---

**Last Updated**: 2024-01
**Next Review**: 2024-04
**Version**: 1.0.0

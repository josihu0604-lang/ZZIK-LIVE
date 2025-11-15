/**
 * K6 Comprehensive API Test Suite
 * Tests all endpoints with performance budgets
 * Generates Markdown report for PR
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);
const dbQueryTime = new Trend('db_query_time', true);

// Performance budgets (p95)
const BUDGETS = {
  offers: 150, // ms
  wallet: 100, // ms
  search: 120, // ms
  qr_verify: 800, // ms
  nearby: 100, // ms
};

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up
    { duration: '1m', target: 20 }, // Sustain
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.01'], // <1% error rate
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    'http_req_duration{endpoint:offers}': [`p(95)<${BUDGETS.offers}`],
    'http_req_duration{endpoint:wallet}': [`p(95)<${BUDGETS.wallet}`],
    'http_req_duration{endpoint:search}': [`p(95)<${BUDGETS.search}`],
    'http_req_duration{endpoint:qr_verify}': [`p(95)<${BUDGETS.qr_verify}`],
    'http_req_duration{endpoint:nearby}': [`p(95)<${BUDGETS.nearby}`],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const TEST_USER = {
  email: 'test@zzik.live',
  phone: '+821012345678',
};

const TEST_LOCATIONS = [
  { name: 'Seoul', geohash5: 'wydm6' },
  { name: 'Gangnam', geohash5: 'wydm7' },
  { name: 'Hongdae', geohash5: 'wydm3' },
];

export function setup() {
  console.log('Starting comprehensive API test suite...');
  console.log(`Base URL: ${BASE_URL}`);
  return {
    startTime: new Date().toISOString(),
  };
}

export default function (data) {
  // Health check
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health latency <50ms': (r) => r.timings.duration < 50,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);

  // Offers endpoint
  group('Offers API', () => {
    const location = TEST_LOCATIONS[Math.floor(Math.random() * TEST_LOCATIONS.length)];
    const res = http.get(`${BASE_URL}/api/offers?geohash5=${location.geohash5}`, {
      tags: { endpoint: 'offers' },
    });

    const success = check(res, {
      'offers status is 200': (r) => r.status === 200,
      'offers has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.offers);
        } catch {
          return false;
        }
      },
      [`offers p95 <${BUDGETS.offers}ms`]: (r) => r.timings.duration < BUDGETS.offers,
    });

    apiLatency.add(res.timings.duration, { endpoint: 'offers' });
    errorRate.add(!success);
  });

  sleep(1);

  // Wallet summary
  group('Wallet API', () => {
    const res = http.get(`${BASE_URL}/api/wallet/summary`, {
      tags: { endpoint: 'wallet' },
      headers: {
        Cookie: 'zzik_session=test-session-token',
      },
    });

    const success = check(res, {
      'wallet status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      [`wallet p95 <${BUDGETS.wallet}ms`]: (r) => r.timings.duration < BUDGETS.wallet,
    });

    apiLatency.add(res.timings.duration, { endpoint: 'wallet' });
    errorRate.add(!success);
  });

  sleep(1);

  // Search endpoint
  group('Search API', () => {
    const location = TEST_LOCATIONS[Math.floor(Math.random() * TEST_LOCATIONS.length)];
    const queries = ['카페', '맛집', '체험', 'bar', 'activity'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const res = http.get(
      `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&geohash5=${location.geohash5}`,
      {
        tags: { endpoint: 'search' },
      }
    );

    const success = check(res, {
      'search status is 200': (r) => r.status === 200,
      'search has results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.results);
        } catch {
          return false;
        }
      },
      [`search p95 <${BUDGETS.search}ms`]: (r) => r.timings.duration < BUDGETS.search,
    });

    apiLatency.add(res.timings.duration, { endpoint: 'search' });
    errorRate.add(!success);
  });

  sleep(1);

  // QR verify (with idempotency)
  group('QR Verify API', () => {
    const idempotencyKey = `test-${Date.now()}-${Math.random()}`;
    const res = http.post(
      `${BASE_URL}/api/qr/verify`,
      JSON.stringify({
        token: 'test-qr-token',
        geohash5: TEST_LOCATIONS[0].geohash5,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        tags: { endpoint: 'qr_verify' },
      }
    );

    const success = check(res, {
      'qr verify status is 200 or 4xx': (r) => r.status >= 200 && r.status < 500,
      [`qr verify p95 <${BUDGETS.qr_verify}ms`]: (r) => r.timings.duration < BUDGETS.qr_verify,
    });

    apiLatency.add(res.timings.duration, { endpoint: 'qr_verify' });
    errorRate.add(!success);
  });

  sleep(1);

  // Nearby places (PostGIS query)
  group('Nearby Places API', () => {
    const location = TEST_LOCATIONS[Math.floor(Math.random() * TEST_LOCATIONS.length)];
    const res = http.get(
      `${BASE_URL}/api/places/nearby?geohash5=${location.geohash5}&radius=2000`,
      {
        tags: { endpoint: 'nearby' },
      }
    );

    const success = check(res, {
      'nearby status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      [`nearby p95 <${BUDGETS.nearby}ms`]: (r) => r.timings.duration < BUDGETS.nearby,
    });

    apiLatency.add(res.timings.duration, { endpoint: 'nearby' });
    errorRate.add(!success);
  });
}

export function teardown(data) {
  const endTime = new Date().toISOString();
  console.log('Test suite completed');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${endTime}`);
}

export function handleSummary(data) {
  const passed = data.metrics.errors.values.rate < 0.01;
  const status = passed ? '✅ PASSED' : '❌ FAILED';

  // Generate Markdown report
  const markdown = `
# K6 Performance Test Results

**Status:** ${status}  
**Date:** ${new Date().toISOString()}  
**Duration:** ${data.state.testRunDurationMs / 1000}s

## Summary

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| Error Rate | ${(data.metrics.errors.values.rate * 100).toFixed(2)}% | <1% | ${data.metrics.errors.values.rate < 0.01 ? '✅' : '❌'} |
| Total Requests | ${data.metrics.http_reqs.values.count} | - | - |
| VUs Max | ${data.metrics.vus_max.values.max} | - | - |

## Endpoint Performance (p95 latency)

| Endpoint | p50 | p95 | p99 | Budget | Status |
|----------|-----|-----|-----|--------|--------|
| Health | ${data.metrics.http_req_duration?.values?.['p(50)']?.toFixed(0) || 'N/A'}ms | ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(0) || 'N/A'}ms | ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(0) || 'N/A'}ms | - | - |
| Offers | - | - | - | ${BUDGETS.offers}ms | ${checkBudget('offers', data)} |
| Wallet | - | - | - | ${BUDGETS.wallet}ms | ${checkBudget('wallet', data)} |
| Search | - | - | - | ${BUDGETS.search}ms | ${checkBudget('search', data)} |
| QR Verify | - | - | - | ${BUDGETS.qr_verify}ms | ${checkBudget('qr_verify', data)} |
| Nearby | - | - | - | ${BUDGETS.nearby}ms | ${checkBudget('nearby', data)} |

## Recommendations

${generateRecommendations(data)}

---

**Generated by K6 Comprehensive Test Suite**  
**For PR:** Include this report in PR description
`;

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'k6-results.md': markdown,
  };
}

function checkBudget(endpoint, data) {
  const metricKey = `http_req_duration{endpoint:${endpoint}}`;
  const metric = data.metrics[metricKey];
  if (!metric) return '⏭️ N/A';

  const p95 = metric.values['p(95)'];
  const budget = BUDGETS[endpoint];

  if (p95 < budget * 0.8) return '🎯 Excellent';
  if (p95 < budget) return '✅ Pass';
  if (p95 < budget * 1.2) return '⚠️ Warning';
  return '❌ Failed';
}

function generateRecommendations(data) {
  const recs = [];

  if (data.metrics.errors.values.rate > 0.005) {
    recs.push('- 🔴 **High error rate detected.** Investigate failing requests.');
  }

  // Check each endpoint budget
  Object.entries(BUDGETS).forEach(([endpoint, budget]) => {
    const metricKey = `http_req_duration{endpoint:${endpoint}}`;
    const metric = data.metrics[metricKey];
    if (metric && metric.values['p(95)'] > budget) {
      recs.push(`- ⚠️ **${endpoint}** exceeds p95 budget. Consider caching or query optimization.`);
    }
  });

  if (recs.length === 0) {
    return '✅ All metrics within acceptable ranges.';
  }

  return recs.join('\n');
}

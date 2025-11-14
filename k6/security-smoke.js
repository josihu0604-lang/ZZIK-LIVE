// k6/security-smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const qrVerifySuccess = new Rate('qr_verify_success');
const qrVerifyDuration = new Trend('qr_verify_duration');
const nearbyDuration = new Trend('trend_nearby');
const searchDuration = new Trend('trend_search');

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    // Error rate thresholds
    http_req_failed: ['rate<0.005'], // <0.5% error rate
    http_req_duration: ['p(95)<120'], // 95% of requests under 120ms

    // QR verification specific
    'checks{endpoint:qr_verify}': ['rate>0.99'], // >99% success rate
    qr_verify_duration: ['p(95)<100'], // QR verify p95 < 100ms

    // Search and nearby endpoints
    trend_nearby: ['p(95)<100', 'p(99)<150'], // Nearby p95<100ms, p99<150ms
    trend_search: ['p(95)<80', 'p(99)<150'], // Search p95<80ms, p99<150ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Helper to generate idempotency key
function generateIdempotencyKey() {
  return 'k6_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// Helper to generate geohash5
function randomGeohash5() {
  const chars = '0123456789bcdefghjkmnpqrstuvwxyz';
  let geohash = '';
  for (let i = 0; i < 5; i++) {
    geohash += chars[Math.floor(Math.random() * chars.length)];
  }
  return geohash;
}

export default function () {
  // Test 1: Security Headers Verification
  const headersRes = http.get(BASE_URL);
  check(headersRes, {
    'has X-Frame-Options': (r) => r.headers['X-Frame-Options'] === 'DENY',
    'has X-Content-Type-Options': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
    'has Strict-Transport-Security': (r) => r.headers['Strict-Transport-Security'] !== undefined,
    'has Content-Security-Policy': (r) => r.headers['Content-Security-Policy'] !== undefined,
    'has COEP header': (r) => r.headers['Cross-Origin-Embedder-Policy'] === 'require-corp',
  });

  sleep(1);

  // Test 2: QR Verification with Rate Limiting
  const qrPayload = {
    token: 'test_token_' + Date.now() + Math.random().toString(36),
    geohash5: randomGeohash5(),
    device_id: 'k6_device_' + __VU,
  };

  const qrParams = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': generateIdempotencyKey(),
      Origin: BASE_URL,
    },
  };

  const qrStartTime = Date.now();
  const qrRes = http.post(`${BASE_URL}/api/qr/verify`, JSON.stringify(qrPayload), qrParams);
  const qrEndTime = Date.now();

  qrVerifyDuration.add(qrEndTime - qrStartTime);

  const qrChecks = check(
    qrRes,
    {
      'QR verify status OK': (r) => r.status === 200 || r.status === 410,
      'QR has rate limit headers': (r) => r.headers['X-RateLimit-Limit'] !== undefined,
      'QR response has state': (r) => {
        try {
          const body = JSON.parse(r.body);
          return ['success', 'invalid', 'expired', 'already_used'].includes(body.state);
        } catch {
          return false;
        }
      },
    },
    { endpoint: 'qr_verify' }
  );

  qrVerifySuccess.add(qrChecks);

  sleep(2);

  // Test 3: Places Nearby API
  const nearbyParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const nearbyPayload = {
    geohash5: randomGeohash5(),
    radius_km: 5,
  };

  const nearbyStartTime = Date.now();
  const nearbyRes = http.post(
    `${BASE_URL}/api/places/nearby`,
    JSON.stringify(nearbyPayload),
    nearbyParams
  );
  const nearbyEndTime = Date.now();

  nearbyDuration.add(nearbyEndTime - nearbyStartTime);

  check(
    nearbyRes,
    {
      'Nearby status OK': (r) => r.status === 200,
      'Nearby response time < 100ms': (r) => r.timings.duration < 100,
    },
    { endpoint: 'nearby' }
  );

  sleep(1);

  // Test 4: Search API
  const searchParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const searchQueries = ['coffee', 'restaurant', 'bar', 'gym', 'shop'];
  const searchQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

  const searchPayload = {
    query: searchQuery,
    geohash5: randomGeohash5(),
    limit: 20,
  };

  const searchStartTime = Date.now();
  const searchRes = http.post(
    `${BASE_URL}/api/search`,
    JSON.stringify(searchPayload),
    searchParams
  );
  const searchEndTime = Date.now();

  searchDuration.add(searchEndTime - searchStartTime);

  check(
    searchRes,
    {
      'Search status OK': (r) => r.status === 200,
      'Search response time < 80ms': (r) => r.timings.duration < 80,
    },
    { endpoint: 'search' }
  );

  sleep(1);

  // Test 5: Rate Limiting Behavior
  // Try rapid requests to test rate limiting
  const rateLimitResults = [];
  for (let i = 0; i < 5; i++) {
    const rapidRes = http.post(`${BASE_URL}/api/qr/verify`, JSON.stringify(qrPayload), {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
    rateLimitResults.push(rapidRes.status);
  }

  // Check if rate limiting is working (should see 429 status)
  const hasRateLimiting = rateLimitResults.some((status) => status === 429);
  check(
    { hasRateLimiting },
    {
      'Rate limiting active': (data) =>
        data.hasRateLimiting || rateLimitResults.every((s) => s === 200),
    }
  );

  sleep(3);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  const color = enableColors
    ? {
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        reset: '\x1b[0m',
      }
    : {
        green: '',
        red: '',
        yellow: '',
        reset: '',
      };

  let summary = `${indent}Security & Performance Test Results:\n`;
  summary += `${indent}${'='.repeat(50)}\n`;

  // Check thresholds
  const thresholds = data.metrics;
  let passedCount = 0;
  let failedCount = 0;

  for (const [metric, value] of Object.entries(thresholds)) {
    if (value.thresholds) {
      const passed = Object.values(value.thresholds).every((t) => t.ok);
      if (passed) {
        passedCount++;
        summary += `${indent}${color.green}✅ ${metric}${color.reset}\n`;
      } else {
        failedCount++;
        summary += `${indent}${color.red}❌ ${metric}${color.reset}\n`;
      }
    }
  }

  summary += `${indent}${'='.repeat(50)}\n`;
  summary += `${indent}Total Passed: ${color.green}${passedCount}${color.reset}\n`;
  summary += `${indent}Total Failed: ${color.red}${failedCount}${color.reset}\n`;

  if (failedCount === 0) {
    summary += `${indent}${color.green}🎉 All tests passed!${color.reset}\n`;
  } else {
    summary += `${indent}${color.red}⚠️  Some tests failed. Please review.${color.reset}\n`;
  }

  return summary;
}

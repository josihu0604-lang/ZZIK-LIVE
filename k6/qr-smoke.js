import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  vus: 5, // 5 virtual users
  duration: '30s', // Run for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests must complete below 800ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health returns ok': (r) => r.json('status') === 'ok',
  });
  errorRate.add(healthRes.status !== 200);

  sleep(1);

  // Test 2: Search API
  const searchParams = {
    q: 'coffee',
    geohash5: 'wydm6',
    radius: 1000,
  };
  const searchRes = http.get(`${BASE_URL}/api/search?${new URLSearchParams(searchParams)}`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns results': (r) => r.json('results') !== null,
    'search response time < 150ms': (r) => r.timings.duration < 150,
  });
  errorRate.add(searchRes.status !== 200);

  sleep(1);

  // Test 3: Places Nearby API
  const nearbyParams = {
    geohash6: 'wydm6v',
    radius: 1000,
    limit: 10,
  };
  const nearbyRes = http.get(`${BASE_URL}/api/places/nearby?${new URLSearchParams(nearbyParams)}`);
  check(nearbyRes, {
    'nearby status is 200': (r) => r.status === 200,
    'nearby returns items': (r) => Array.isArray(r.json('items')),
    'nearby response time < 80ms': (r) => r.timings.duration < 80,
  });
  errorRate.add(nearbyRes.status !== 200);

  sleep(1);

  // Test 4: QR Verify API
  const qrPayload = JSON.stringify({
    codeData: 'test-qr-code',
    placeId: 'test-place-1',
    userGeohash: 'wydm6v',
  });
  const qrParams = {
    headers: { 'Content-Type': 'application/json' },
  };
  const qrRes = http.post(`${BASE_URL}/api/qr/verify`, qrPayload, qrParams);
  check(qrRes, {
    'qr verify status is valid': (r) => [200, 422].includes(r.status),
    'qr verify has response': (r) => r.body !== null,
  });
  errorRate.add(![200, 422].includes(qrRes.status));

  sleep(1);

  // Test 5: Wallet Redeem API with Idempotency
  const idempotencyKey = `k6-test-${Date.now()}-${Math.random()}`;
  const redeemPayload = JSON.stringify({
    voucherId: 'test-voucher-1',
  });
  const redeemParams = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
  };
  const redeemRes = http.post(`${BASE_URL}/api/wallet/redeem`, redeemPayload, redeemParams);
  check(redeemRes, {
    'redeem status is valid': (r) => [200, 422, 429].includes(r.status),
    'redeem has rate limit headers': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
    'redeem response time < 800ms': (r) => r.timings.duration < 800,
  });
  errorRate.add(![200, 422, 429].includes(redeemRes.status));

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const { metrics, thresholds } = data;
  let summary = '\n=== Performance Test Results ===\n\n';

  // Check thresholds
  let passed = true;
  for (const [name, threshold] of Object.entries(thresholds || {})) {
    const status = threshold.passes ? '✓' : '✗';
    passed = passed && threshold.passes;
    summary += `${status} ${name}\n`;
  }

  // Add key metrics
  if (metrics) {
    summary += '\nKey Metrics:\n';
    if (metrics.http_req_duration) {
      const p95 = metrics.http_req_duration.values['p(95)'];
      summary += `  Response time (p95): ${p95?.toFixed(2)}ms\n`;
    }
    if (metrics.errors) {
      const errorRate = metrics.errors.values.rate;
      summary += `  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    }
    if (metrics.http_reqs) {
      const rps = metrics.http_reqs.values.rate;
      summary += `  Requests per second: ${rps?.toFixed(2)}\n`;
    }
  }

  summary += `\nOverall: ${passed ? 'PASSED ✓' : 'FAILED ✗'}\n`;
  return summary;
}
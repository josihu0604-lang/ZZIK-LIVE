import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 10, // 10 virtual users
  duration: '1m',
  thresholds: {
    errors: ['rate<0.01'], // Error rate < 1%
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    'http_req_duration{name:offers}': ['p(95)<150'],
    'http_req_duration{name:wallet}': ['p(95)<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Offers API
  const offersRes = http.get(`${BASE_URL}/api/offers`, {
    tags: { name: 'offers' },
  });

  check(offersRes, {
    'offers status 200': (r) => r.status === 200,
    'offers has data': (r) => JSON.parse(r.body).offers !== undefined,
    'offers response time < 150ms': (r) => r.timings.duration < 150,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Offers with location
  const locationRes = http.get(`${BASE_URL}/api/offers?lat=37.5665&lng=126.9780&radius=5000`, {
    tags: { name: 'offers' },
  });

  check(locationRes, {
    'location offers status 200': (r) => r.status === 200,
    'location offers has data': (r) => JSON.parse(r.body).offers !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Wallet Summary API
  const walletRes = http.get(`${BASE_URL}/api/wallet/summary`, {
    tags: { name: 'wallet' },
  });

  check(walletRes, {
    'wallet status 200': (r) => r.status === 200,
    'wallet has summary': (r) => JSON.parse(r.body).summary !== undefined,
    'wallet response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: QR Verification (should fail without proper data)
  const qrPayload = JSON.stringify({
    token: 'test_token_' + Math.random().toString(36).substring(7),
    geohash5: 'wydm6',
    timestamp: Date.now(),
  });

  const qrRes = http.post(`${BASE_URL}/api/qr/verify`, qrPayload, {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `idk_${Date.now()}_${Math.random()}`,
    },
    tags: { name: 'qr_verify' },
  });

  check(qrRes, {
    'qr verify responds': (r) => r.status !== 500,
    'qr verify has state': (r) => JSON.parse(r.body).state !== undefined,
  }) || errorRate.add(1);

  sleep(2);
}

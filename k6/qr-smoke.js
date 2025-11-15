import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration{endpoint:qr_verify}': ['p(95)<800'],
    'http_req_failed{endpoint:qr_verify}': ['rate<0.01']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Generate unique idempotency key for each request
  const idemKey = `k6-test-${Date.now()}-${randomString(8)}`;
  
  const url = `${BASE_URL}/api/qr/verify`;
  const payload = JSON.stringify({
    token: '123456', // This will be hashed to match q1 in seed data
    placeId: 'p1',
    locGeohash5: 'wydm6'
  });
  
  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idemKey
  };
  
  const res = http.post(url, payload, {
    headers,
    tags: { endpoint: 'qr_verify' }
  });
  
  // Check response
  check(res, {
    '200 status': (r) => r.status === 200,
    'has status field': (r) => {
      const body = JSON.parse(r.body);
      return body.status !== undefined;
    },
    'has rate limit headers': (r) => 
      r.headers['X-RateLimit-Limit'] !== undefined,
    'has idempotency header': (r) => 
      r.headers['X-Idempotent-Replay'] !== undefined,
    'has verification state': (r) => 
      r.headers['X-Verification-State'] !== undefined
  });
  
  // Test idempotency - send same request again
  const res2 = http.post(url, payload, {
    headers,
    tags: { endpoint: 'qr_verify_replay' }
  });
  
  check(res2, {
    'replay returns same status': (r) => r.status === 200,
    'replay is marked': (r) => r.headers['X-Idempotent-Replay'] === '1'
  });
  
  sleep(1);
}
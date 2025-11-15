import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration{endpoint:search}': ['p(95)<80'],
    'http_req_failed{endpoint:search}': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const params = {
    tags: { endpoint: 'search' },
    headers: {
      'Accept': 'application/json',
    },
  };

  // Test various search queries
  const queries = [
    '?q=카페&geohash5=wydm6&radius=1000',
    '?q=레스토랑&geohash5=wydm6&radius=1500',
    '?q=&geohash5=wydm6&radius=500',  // Empty query (location-only search)
    '?q=피트니스&geohash5=wydm7&radius=2000',
  ];
  
  const query = queries[Math.floor(Math.random() * queries.length)];
  const res = http.get(`${BASE_URL}/api/search${query}`, params);
  
  check(res, {
    '200 OK': r => r.status === 200,
    'has items': r => JSON.parse(r.body).items !== undefined,
    'has meta': r => JSON.parse(r.body).meta !== undefined,
    'has cache header': r => r.headers['X-Cache'] !== undefined,
    'has request id': r => r.headers['X-Request-Id'] !== undefined,
    'has rate limit headers': r => r.headers['X-RateLimit-Limit'] !== undefined,
  });
  
  sleep(1);
}
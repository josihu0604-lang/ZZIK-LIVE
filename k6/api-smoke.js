// k6/api-smoke.js
// Smoke test: Quick validation of critical endpoints with strict thresholds

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = __ENV.BASE || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Smoke test configuration: low load, strict thresholds
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    // Global thresholds (Phase 6 targets)
    http_req_failed: ['rate<0.005'], // < 0.5% error rate
    http_req_duration: ['p(95)<500'], // p95 ≤ 500ms
    http_req_duration: ['p(99)<1000'], // p99 ≤ 1s

    // Endpoint-specific thresholds
    'http_req_duration{endpoint:health}': ['p(95)<100'],
    'http_req_duration{endpoint:nearby}': ['p(95)<100'], // Phase 6: ≤100ms
    'http_req_duration{endpoint:search}': ['p(95)<80'], // Phase 6: ≤80ms

    // Custom metrics
    errors: ['rate<0.003'], // < 0.3% error rate
  },
};

export default function () {
  // Group 1: Health check
  group('Health Check', () => {
    const res = http.get(`${BASE}/api/health`, {
      tags: { endpoint: 'health' },
    });

    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response < 100ms': (r) => r.timings.duration < 100,
    }) || errorRate.add(1);

    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  // Group 2: Places nearby (geospatial query)
  group('Places Nearby', () => {
    const lat = 37.5665; // Seoul coordinates
    const lng = 126.978;
    const radius = 1000;

    const res = http.get(`${BASE}/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      tags: { endpoint: 'nearby' },
    });

    check(res, {
      'nearby status is 200': (r) => r.status === 200,
      'nearby response < 100ms': (r) => r.timings.duration < 100,
      'nearby returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) || Array.isArray(data.places);
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);

    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  // Group 3: Search (full-text + geo)
  group('Search', () => {
    const query = 'cafe';
    const res = http.get(`${BASE}/api/search?q=${query}`, { tags: { endpoint: 'search' } });

    check(res, {
      'search status is 200': (r) => r.status === 200,
      'search response < 80ms': (r) => r.timings.duration < 80,
      'search returns results': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.results !== undefined;
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);

    apiDuration.add(res.timings.duration);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'k6/results/smoke-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const lines = [];

  lines.push(`${indent}Test Summary:`);
  lines.push(
    `${indent}  Checks: ${data.metrics.checks.values.passes}/${data.metrics.checks.values.fails + data.metrics.checks.values.passes} passed`
  );
  lines.push(`${indent}  Error Rate: ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%`);
  lines.push(
    `${indent}  p95 Duration: ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 0}ms`
  );

  return lines.join('\n');
}

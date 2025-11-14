// k6/search-performance.js
// Performance test for Search API - Target: p95 ≤ 80ms, p99 ≤ 150ms

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const searchDuration = new Trend('search_duration');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 VUs
    { duration: '1m', target: 20 }, // Stay at 20 VUs
    { duration: '10s', target: 0 }, // Ramp down
  ],
  thresholds: {
    // Global thresholds
    http_req_failed: ['rate<0.01'], // < 1% error rate
    http_req_duration: ['p(95)<80', 'p(99)<150'], // Target latencies

    // Search-specific thresholds
    'http_req_duration{endpoint:search}': ['p(95)<80', 'p(99)<150'],
    search_duration: ['p(95)<80', 'p(99)<150'],

    // Custom metrics
    errors: ['rate<0.01'],
  },
};

// Test data - various search queries
const queries = [
  { q: 'cafe', geohash5: 'wydm6', radius: 1200, limit: 10 },
  { q: 'restaurant', geohash5: 'wydm6', radius: 1500, limit: 15 },
  { q: 'coffee', geohash5: 'wydm7', radius: 1000, limit: 10 },
  { q: 'bar', geohash5: 'wydm6', radius: 2000, limit: 20 },
  { q: 'shop', geohash5: 'wydm5', radius: 1200, limit: 10 },
];

export default function () {
  // Select random query
  const query = queries[Math.floor(Math.random() * queries.length)];

  // Build URL
  const url = `${BASE}/api/search?q=${query.q}&geohash5=${query.geohash5}&radius=${query.radius}&limit=${query.limit}&lang=ko&ver=v1`;

  // Execute request
  const res = http.get(url, {
    tags: { endpoint: 'search' },
    headers: {
      'Accept': 'application/json',
    },
  });

  // Validate response
  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 80ms': (r) => r.timings.duration < 80,
    'response time < 150ms': (r) => r.timings.duration < 150,
    'has items array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      } catch {
        return false;
      }
    },
    'has cache indicator': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.cache === 'hit' || body.cache === 'miss';
      } catch {
        return false;
      }
    },
    'has meta info': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.meta && body.meta.query && body.meta.radius;
      } catch {
        return false;
      }
    },
  });

  if (!passed) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Record duration
  searchDuration.add(res.timings.duration);

  // Think time between requests
  sleep(0.2);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const p99 = data.metrics.http_req_duration?.values['p(99)'] || 0;
  const errorPct = (data.metrics.errors?.values.rate || 0) * 100;
  const checks = data.metrics.checks?.values;
  const passRate = checks ? (checks.passes / (checks.passes + checks.fails)) * 100 : 0;

  console.log('\n========================================');
  console.log('Search API Performance Summary');
  console.log('========================================');
  console.log(`✓ Checks Passed: ${passRate.toFixed(1)}%`);
  console.log(`✓ Error Rate: ${errorPct.toFixed(2)}%`);
  console.log(`✓ p95 Latency: ${p95.toFixed(2)}ms (target: ≤80ms)`);
  console.log(`✓ p99 Latency: ${p99.toFixed(2)}ms (target: ≤150ms)`);
  console.log('========================================\n');

  return {
    stdout: textSummary(data),
    'k6/results/search-performance.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const lines = [];
  const metrics = data.metrics;

  lines.push('\n=== Search Performance Test Results ===\n');

  if (metrics.checks) {
    const { passes, fails } = metrics.checks.values;
    lines.push(`Checks: ${passes}/${passes + fails} passed`);
  }

  if (metrics.http_req_duration) {
    const { avg, min, max, med, 'p(95)': p95, 'p(99)': p99 } = metrics.http_req_duration.values;
    lines.push('\nLatency Distribution:');
    lines.push(`  avg: ${avg.toFixed(2)}ms`);
    lines.push(`  min: ${min.toFixed(2)}ms`);
    lines.push(`  med: ${med.toFixed(2)}ms`);
    lines.push(`  max: ${max.toFixed(2)}ms`);
    lines.push(`  p95: ${p95.toFixed(2)}ms ${p95 <= 80 ? '✓' : '✗ TARGET MISSED'}`);
    lines.push(`  p99: ${p99.toFixed(2)}ms ${p99 <= 150 ? '✓' : '✗ TARGET MISSED'}`);
  }

  if (metrics.errors) {
    const errorPct = (metrics.errors.values.rate * 100).toFixed(2);
    lines.push(`\nError Rate: ${errorPct}% ${metrics.errors.values.rate < 0.01 ? '✓' : '✗'}`);
  }

  lines.push('\n=====================================\n');

  return lines.join('\n');
}

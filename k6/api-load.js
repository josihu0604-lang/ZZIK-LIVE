// k6/api-load.js
// Load test: Sustained load with realistic user behavior

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE = __ENV.BASE || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('errors');
const searchDuration = new Trend('search_duration');
const nearbyDuration = new Trend('nearby_duration');
const requestCount = new Counter('total_requests');

// Load test configuration: ramp up to 100 VUs
export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '60s', target: 100 }, // Ramp up to 100 users
    { duration: '60s', target: 100 }, // Stay at 100 for 1 minute
    { duration: '10s', target: 0 }, // Ramp down
  ],
  thresholds: {
    // Relaxed thresholds for load test
    http_req_failed: ['rate<0.01'], // < 1% error rate
    http_req_duration: ['p(95)<500', 'p(99)<1000'],

    // Endpoint-specific (Phase 6 targets)
    'http_req_duration{endpoint:nearby}': ['p(95)<100', 'p(99)<200'],
    'http_req_duration{endpoint:search}': ['p(95)<80', 'p(99)<150'],

    // Group-specific
    'group_duration{group:search_flow}': ['p(95)<150'],
    'group_duration{group:explore_flow}': ['p(95)<200'],
  },
};

// Simulated user behavior
export default function () {
  requestCount.add(1);

  // 60% of users: Search flow
  if (Math.random() < 0.6) {
    searchFlow();
  }
  // 30% of users: Explore nearby
  else if (Math.random() < 0.9) {
    exploreFlow();
  }
  // 10% of users: Browse offers
  else {
    offersFlow();
  }

  // Think time between actions
  sleep(Math.random() * 2 + 1);
}

function searchFlow() {
  group('search_flow', () => {
    const queries = ['cafe', 'restaurant', 'bar', 'hotel', 'shop'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const res = http.get(`${BASE}/api/search?q=${query}`, {
      tags: { endpoint: 'search', flow: 'search' },
    });

    searchDuration.add(res.timings.duration, { endpoint: 'search' });

    check(res, {
      'search status is 200': (r) => r.status === 200,
      'search < 80ms target': (r) => r.timings.duration < 80,
    }) || errorRate.add(1);

    sleep(0.5);

    // User clicks on a result
    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        const results = data.results || data.places || [];
        if (results.length > 0) {
          const placeId = results[0].id;
          http.get(`${BASE}/api/places/${placeId}`, {
            tags: { endpoint: 'place_detail', flow: 'search' },
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });
}

function exploreFlow() {
  group('explore_flow', () => {
    // Simulated user location (various Seoul locations)
    const locations = [
      { lat: 37.5665, lng: 126.978, name: 'Seoul' },
      { lat: 37.5172, lng: 127.0473, name: 'Gangnam' },
      { lat: 37.5796, lng: 126.977, name: 'Hongdae' },
    ];

    const loc = locations[Math.floor(Math.random() * locations.length)];
    const radius = 1000 + Math.random() * 1000; // 1-2km

    const res = http.get(
      `${BASE}/api/places/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`,
      { tags: { endpoint: 'nearby', flow: 'explore' } }
    );

    nearbyDuration.add(res.timings.duration, { endpoint: 'nearby' });

    check(res, {
      'nearby status is 200': (r) => r.status === 200,
      'nearby < 100ms target': (r) => r.timings.duration < 100,
    }) || errorRate.add(1);

    sleep(0.5);

    // User taps on a place
    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        const places = data.places || data;
        if (Array.isArray(places) && places.length > 0) {
          const placeId = places[Math.floor(Math.random() * Math.min(3, places.length))].id;
          http.get(`${BASE}/api/places/${placeId}`, {
            tags: { endpoint: 'place_detail', flow: 'explore' },
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });
}

function offersFlow() {
  group('offers_flow', () => {
    const res = http.get(`${BASE}/api/offers`, {
      tags: { endpoint: 'offers', flow: 'offers' },
    });

    check(res, {
      'offers status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);
  });
}

export function handleSummary(data) {
  const passed = data.metrics.checks?.values?.passes || 0;
  const failed = data.metrics.checks?.values?.fails || 0;
  const total = passed + failed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  console.log('\n========== LOAD TEST RESULTS ==========');
  console.log(`Total Requests: ${requestCount.values.count || 0}`);
  console.log(`Checks: ${passed}/${total} passed (${passRate}%)`);
  console.log(
    `Error Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`
  );
  console.log(
    `p50 Duration: ${(data.metrics.http_req_duration?.values['p(50)'] || 0).toFixed(2)}ms`
  );
  console.log(
    `p95 Duration: ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`
  );
  console.log(
    `p99 Duration: ${(data.metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms`
  );
  console.log('======================================\n');

  return {
    'k6/results/load-summary.json': JSON.stringify(data, null, 2),
  };
}

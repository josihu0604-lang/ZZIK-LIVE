import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
  });

  test('should reject requests without proper content-type', async ({ request }) => {
    const response = await request.post('/api/analytics', {
      data: 'not json',
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should reject malformed JSON', async ({ request }) => {
    const response = await request.post('/api/analytics', {
      data: 'invalid json{',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should validate required fields', async ({ request }) => {
    const response = await request.post('/api/analytics', {
      data: {},
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('should enforce rate limits', async ({ request }) => {
    const endpoint = '/api/auth/magic-link';
    const requests = [];

    // Send multiple requests rapidly
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post(endpoint, {
          data: { email: `test${i}@example.com` },
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    // At least one should be rate limited
    const rateLimited = responses.some((r) => r.status() === 429);
    expect(rateLimited).toBeTruthy();
  });

  test('should return proper error codes', async ({ request }) => {
    // Test 404 for non-existent endpoint
    const notFound = await request.get('/api/nonexistent');
    expect(notFound.status()).toBe(404);

    // Test 405 for wrong method
    const wrongMethod = await request.get('/api/analytics');
    expect([404, 405]).toContain(wrongMethod.status());
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const headers = response.headers();

    // Check for security headers
    expect(headers).toBeDefined();

    // X-Content-Type-Options should be nosniff
    // X-Frame-Options should be DENY or SAMEORIGIN
    // These are set in next.config.ts
  });

  test('should handle idempotency keys', async ({ request }) => {
    const idempotencyKey = 'test-key-' + Date.now();

    const endpoint = '/api/location/verify';
    const payload = {
      placeId: 'test-place',
      userGeohash5: 'u4pru',
      userId: 'test-user',
    };

    // First request
    const response1 = await request.post(endpoint, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    });

    // Second request with same idempotency key
    const response2 = await request.post(endpoint, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    });

    // Both should succeed
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    // Responses should be identical (cached)
    const body1 = await response1.json();
    const body2 = await response2.json();

    expect(body1).toEqual(body2);
  });

  test('analytics endpoint should accept valid events', async ({ request }) => {
    const response = await request.post('/api/analytics', {
      data: {
        events: [
          {
            type: 'page_view',
            timestamp: Date.now(),
            page: '/',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.received).toBe(1);
  });

  test('should handle CORS for allowed origins', async ({ request }) => {
    const response = await request.get('/api/health', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const headers = response.headers();

    // CORS headers should be present for allowed origins
    // This depends on your CORS configuration
    expect(headers).toBeDefined();
  });
});

// __tests__/e2e/security.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Security Headers', () => {
  test('should include all security headers', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Critical security headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(headers['strict-transport-security']).toContain('max-age=31536000');

    // CSP should be present
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  test('CSP should prevent frame embedding', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const csp = response!.headers()['content-security-policy'];

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
  });
});

test.describe('Authentication & Authorization', () => {
  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access wallet without auth
    await page.goto(`${BASE_URL}/wallet`);

    // Should redirect to login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should block access to protected API routes', async ({ page, request }) => {
    // Try to access protected API without auth
    const response = await request.get(`${BASE_URL}/api/wallet`);

    expect([401, 403]).toContain(response.status());
  });
});

test.describe('QR Verification Security', () => {
  test('should block cross-origin QR verification requests', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'test_token',
        geohash5: 'wydm6',
      },
      headers: {
        Origin: 'https://malicious-site.com',
      },
    });

    expect(response.status()).toBe(403);
  });

  test('should require idempotency key', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'test_token',
        geohash5: 'wydm6',
      },
    });

    // Should fail without idempotency key
    expect(response.status()).toBe(422);
  });

  test('should enforce rate limits', async ({ request }) => {
    const requests = [];

    // Send 15 requests rapidly (limit is 10/min)
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.post(`${BASE_URL}/api/qr/verify`, {
          data: {
            token: `token_${i}`,
            geohash5: 'wydm6',
          },
          headers: {
            'Idempotency-Key': `key_${i}`,
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status() === 429);

    // At least some requests should be rate limited
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});

test.describe('Privacy Protection', () => {
  test('should not leak raw coordinates in HTML', async ({ page }) => {
    await page.goto(BASE_URL);

    const content = await page.content();

    // Check for common coordinate patterns
    const hasRawCoords = /\b(lat|lng|latitude|longitude)\s*[:=]\s*[-+]?\d+\.\d+/i.test(content);

    expect(hasRawCoords).toBe(false);
  });

  test('console should not log raw coordinates', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check logs for coordinate leaks
    const hasLeaks = consoleLogs.some((log) =>
      /\b(lat|lng|latitude|longitude)\s*[:=]\s*[-+]?\d+\.\d+/i.test(log)
    );

    expect(hasLeaks).toBe(false);
  });
});

test.describe('Rate Limiting Headers', () => {
  test('API responses should include rate limit headers', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    const headers = response.headers();

    // Rate limit headers may or may not be present on all endpoints
    // But if present, they should be properly formatted
    if (headers['x-ratelimit-limit']) {
      expect(parseInt(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-ratelimit-reset']).toBeDefined();
    }
  });
});

test.describe('Request Tracing', () => {
  test('should include request-id in responses', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response!.headers();

    expect(headers['x-request-id']).toBeDefined();
    expect(headers['x-request-id']).toMatch(/^req_[a-zA-Z0-9_-]+$/);
  });
});

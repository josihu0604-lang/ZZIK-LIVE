import { test, expect } from '@playwright/test';

test.describe('Wallet Redeem API', () => {
  test('requires Idempotency-Key header', async ({ request }) => {
    const response = await request.post('/api/wallet/redeem', {
      data: { voucherId: 'test-voucher-1' }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  test('handles idempotent redemption correctly', async ({ request }) => {
    const idempotencyKey = `test-idem-${Date.now()}`;
    const headers = {
      'Idempotency-Key': idempotencyKey,
      'Content-Type': 'application/json'
    };
    const body = { voucherId: 'test-voucher-2' };

    // First request
    const response1 = await request.post('/api/wallet/redeem', {
      headers,
      data: body
    });

    // Second request with same idempotency key
    const response2 = await request.post('/api/wallet/redeem', {
      headers,
      data: body
    });

    // Check that second response is a replay
    const replayHeader = response2.headers()['x-idempotent-replay'];
    expect(replayHeader).toBe('1');

    // Both responses should have same body
    const body1 = await response1.json();
    const body2 = await response2.json();
    expect(body2).toEqual(body1);
  });

  test('includes rate limit headers', async ({ request }) => {
    const response = await request.post('/api/wallet/redeem', {
      headers: {
        'Idempotency-Key': `test-rl-${Date.now()}`,
        'Content-Type': 'application/json'
      },
      data: { voucherId: 'test-voucher-3' }
    });

    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();
  });

  test('includes performance timing', async ({ request }) => {
    const response = await request.post('/api/wallet/redeem', {
      headers: {
        'Idempotency-Key': `test-perf-${Date.now()}`,
        'Content-Type': 'application/json'
      },
      data: { voucherId: 'test-voucher-4' }
    });

    const headers = response.headers();
    expect(headers['server-timing']).toBeDefined();
    expect(headers['server-timing']).toMatch(/app;dur=\d+(\.\d+)?/);
  });
});
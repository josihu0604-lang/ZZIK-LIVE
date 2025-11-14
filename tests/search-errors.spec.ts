import { test, expect } from '@playwright/test';

test.describe('Search API Error Cases', () => {
  test('should return 422 for invalid geohash5', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: 'test',
        geohash5: 'abc', // Invalid: should be exactly 5 characters
        radius: '1000'
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
    
    // Check required headers
    const headers = response.headers();
    expect(headers['x-request-id']).toBeTruthy();
  });

  test('should return 422 for invalid radius', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: 'test',
        geohash5: 'wydm6',
        radius: '10' // Invalid: minimum is 50
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });

  test('should return 422 for radius exceeding maximum', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: 'test',
        geohash5: 'wydm6',
        radius: '5000' // Invalid: maximum is 3000
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });

  test('should return 422 for missing geohash5', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: 'test',
        radius: '1000'
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });

  test('should enforce rate limit and return 429', async ({ request }) => {
    // Make 60 requests (the limit)
    const promises = [];
    for (let i = 0; i < 61; i++) {
      promises.push(
        request.get('/api/search', {
          params: {
            q: `test${i}`,
            geohash5: 'wydm6',
            radius: '1000'
          },
          headers: {
            'x-forwarded-for': '192.168.1.100' // Same IP for all requests
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // First 60 should succeed
    for (let i = 0; i < 60; i++) {
      expect(responses[i].status()).toBeLessThan(429);
    }
    
    // 61st should be rate limited
    expect(responses[60].status()).toBe(429);
    const body = await responses[60].json();
    expect(body.error).toBe('RATE_LIMIT');
    
    // Check rate limit headers on 429 response
    const headers = responses[60].headers();
    expect(headers['x-ratelimit-limit']).toBe('60');
    expect(headers['x-ratelimit-remaining']).toBe('0');
    expect(headers['x-ratelimit-reset']).toBeTruthy();
    expect(headers['x-request-id']).toBeTruthy();
  });

  test('should include rate limit headers on successful requests', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: 'test',
        geohash5: 'wydm6',
        radius: '1000'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBe('60');
    expect(Number(headers['x-ratelimit-remaining'])).toBeLessThanOrEqual(59);
    expect(headers['x-ratelimit-reset']).toBeTruthy();
  });
});
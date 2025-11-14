import { test, expect } from '@playwright/test';

test.describe('Search API', () => {
  test('should return 200 with proper headers', async ({ request }) => {
    const response = await request.get('/api/search?q=카페&geohash5=wydm6&radius=1000');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['x-request-id']).toBeTruthy();
    expect(response.headers()['x-ratelimit-limit']).toBe('60');
    expect(response.headers()['x-ratelimit-remaining']).toBeTruthy();
    expect(response.headers()['x-cache']).toBeTruthy();
    expect(response.headers()['server-timing']).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/json');
    
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('meta');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.meta).toHaveProperty('geohash5', 'wydm6');
    expect(body.meta).toHaveProperty('radius', 1000);
    expect(body.meta).toHaveProperty('version', 'v1');
  });
  
  test('should return 422 for invalid parameters', async ({ request }) => {
    const response = await request.get('/api/search?geohash5=bad&radius=10');
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'INVALID_PARAMS');
    expect(body).toHaveProperty('details');
  });
  
  test('should handle empty search query', async ({ request }) => {
    const response = await request.get('/api/search?geohash5=wydm6&radius=1000');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('meta');
    expect(body.meta.q).toBe('');
  });
  
  test('should validate geohash5 length', async ({ request }) => {
    const response = await request.get('/api/search?q=test&geohash5=wyd&radius=1000');
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });
  
  test('should enforce radius limits', async ({ request }) => {
    // Test radius too small
    let response = await request.get('/api/search?q=test&geohash5=wydm6&radius=10');
    expect(response.status()).toBe(422);
    
    // Test radius too large
    response = await request.get('/api/search?q=test&geohash5=wydm6&radius=5000');
    expect(response.status()).toBe(422);
    
    // Test valid radius
    response = await request.get('/api/search?q=test&geohash5=wydm6&radius=1500');
    expect(response.status()).toBe(200);
  });
});

test.describe('Search API Security Headers', () => {
  test('should include all security headers', async ({ request }) => {
    const response = await request.get('/api/search?geohash5=wydm6&radius=1000');
    
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['referrer-policy']).toBeTruthy();
  });
});
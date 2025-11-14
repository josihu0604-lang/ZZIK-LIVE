import { test, expect } from '@playwright/test';

test('X-Cache: HIT on second call', async ({ request }) => {
  const url = '/api/search?q=카페&geohash5=wydm6&radius=1000';
  
  // First request - should be a cache MISS
  const r1 = await request.get(url);
  expect(r1.status()).toBe(200);
  expect(r1.headers()['x-cache']).toBeDefined();
  
  // Small delay to ensure cache is written
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Second request - should be a cache HIT
  const r2 = await request.get(url);
  expect(r2.status()).toBe(200);
  expect(r2.headers()['x-cache']).toBe('HIT');
  
  // Verify both responses have the same content
  const body1 = await r1.json();
  const body2 = await r2.json();
  expect(body2).toEqual(body1);
});
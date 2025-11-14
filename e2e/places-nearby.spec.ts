import { test, expect } from '@playwright/test';

test.describe('Places Nearby API', () => {
  test('returns nearby places with distance', async ({ request }) => {
    const response = await request.get('/api/places/nearby?geohash6=wydm6v&radius=1000&limit=5');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('nextCursor');
    expect(body).toHaveProperty('meta');
    
    if (body.items.length > 0) {
      const firstPlace = body.items[0];
      expect(firstPlace).toHaveProperty('id');
      expect(firstPlace).toHaveProperty('name');
      expect(firstPlace).toHaveProperty('geohash6');
      expect(firstPlace).toHaveProperty('distanceMeters');
      expect(typeof firstPlace.distanceMeters).toBe('number');
    }
  });

  test('paginates with cursor', async ({ request }) => {
    const response1 = await request.get('/api/places/nearby?geohash6=wydm6v&radius=1000&limit=2');
    const body1 = await response1.json();
    
    expect(body1.items.length).toBeLessThanOrEqual(2);
    
    if (body1.nextCursor) {
      const response2 = await request.get(
        `/api/places/nearby?geohash6=wydm6v&radius=1000&limit=2&cursor=${encodeURIComponent(body1.nextCursor)}`
      );
      const body2 = await response2.json();
      
      // Ensure we get different results
      if (body2.items.length > 0 && body1.items.length > 0) {
        expect(body2.items[0].id).not.toBe(body1.items[0].id);
      }
    }
  });

  test('validates required parameters', async ({ request }) => {
    const response = await request.get('/api/places/nearby');
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });

  test('respects radius parameter', async ({ request }) => {
    const response = await request.get('/api/places/nearby?geohash6=wydm6v&radius=500&limit=10');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // All returned places should be within radius
    body.items.forEach((place: any) => {
      expect(place.distanceMeters).toBeLessThanOrEqual(500);
    });
  });

  test('respects limit parameter', async ({ request }) => {
    const response = await request.get('/api/places/nearby?geohash6=wydm6v&radius=3000&limit=3');
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(body.items.length).toBeLessThanOrEqual(3);
  });

  test('includes cache control headers', async ({ request }) => {
    const response = await request.get('/api/places/nearby?geohash6=wydm6v&radius=1000');
    
    const headers = response.headers();
    expect(headers['cache-control']).toBeDefined();
    expect(headers['cache-control']).toContain('max-age=');
  });

  test('includes performance timing', async ({ request }) => {
    const response = await request.get('/api/places/nearby?geohash6=wydm6v&radius=1000');
    
    const headers = response.headers();
    expect(headers['server-timing']).toBeDefined();
    expect(headers['server-timing']).toMatch(/db;dur=\d+(\.\d+)?/);
  });
});
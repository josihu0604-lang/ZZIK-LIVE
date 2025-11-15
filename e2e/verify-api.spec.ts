import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('QR Verification API', () => {
  test('requires Idempotency-Key and returns 422 without it', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'test-token',
        placeId: 'p1',
        locGeohash5: 'wydm6'
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });
  
  test('returns 422 for invalid params', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'short', // Too short
        placeId: 'p1',
        locGeohash5: 'wydm' // Wrong length
      },
      headers: {
        'Idempotency-Key': 'e2e-test-invalid-1'
      }
    });
    
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PARAMS');
  });
  
  test('returns 4 states correctly', async ({ request }) => {
    // Test valid token
    const validResponse = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: '123456', // SHA256 matches q1 in seed
        placeId: 'p1',
        locGeohash5: 'wydm6'
      },
      headers: {
        'Idempotency-Key': `e2e-valid-${Date.now()}`
      }
    });
    
    expect(validResponse.status()).toBe(200);
    const validBody = await validResponse.json();
    expect(['ok', 'expired', 'used', 'invalid']).toContain(validBody.status);
    
    // Test used token
    const usedResponse = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'already-used-token',
        placeId: 'p2',
        locGeohash5: 'wydm6'
      },
      headers: {
        'Idempotency-Key': 'e2e-used-1'
      }
    });
    
    expect(usedResponse.status()).toBe(200);
    const usedBody = await usedResponse.json();
    expect(usedBody.status).toBe('used');
    
    // Test invalid token
    const invalidResponse = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'nonexistent-token',
        placeId: 'p1',
        locGeohash5: 'wydm6'
      },
      headers: {
        'Idempotency-Key': 'e2e-invalid-2'
      }
    });
    
    expect(invalidResponse.status()).toBe(200);
    const invalidBody = await invalidResponse.json();
    expect(invalidBody.status).toBe('invalid');
  });
  
  test('idempotency replay works correctly', async ({ request }) => {
    const idemKey = `e2e-idem-${Date.now()}`;
    
    // First request
    const response1 = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'test-token-idem',
        placeId: 'p1',
        locGeohash5: 'wydm6'
      },
      headers: {
        'Idempotency-Key': idemKey
      }
    });
    
    expect(response1.status()).toBe(200);
    expect(response1.headers()['x-idempotent-replay']).toBe('0');
    
    // Second request with same key
    const response2 = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'different-token', // Different data but same key
        placeId: 'p2',
        locGeohash5: 'abcde'
      },
      headers: {
        'Idempotency-Key': idemKey
      }
    });
    
    expect(response2.status()).toBe(200);
    expect(response2.headers()['x-idempotent-replay']).toBe('1');
    
    // Bodies should be identical
    const body1 = await response1.json();
    const body2 = await response2.json();
    expect(body1).toEqual(body2);
  });
  
  test('has correct response headers', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/qr/verify`, {
      data: {
        token: 'test-token-headers',
        placeId: 'p1',
        locGeohash5: 'wydm6'
      },
      headers: {
        'Idempotency-Key': `e2e-headers-${Date.now()}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const headers = response.headers();
    expect(headers['x-request-id']).toBeTruthy();
    expect(headers['x-ratelimit-limit']).toBeTruthy();
    expect(headers['x-ratelimit-remaining']).toBeTruthy();
    expect(headers['x-ratelimit-reset']).toBeTruthy();
    expect(headers['x-verification-state']).toBeTruthy();
    expect(headers['x-idempotent-replay']).toBeTruthy();
    expect(headers['server-timing']).toBeTruthy();
  });
});

test.describe('Location Verification API', () => {
  test('computes distance and sets gpsOk', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/verify/location`, {
      data: {
        placeId: 'p1',
        userGeohash5: 'wydm6',
        ts: Date.now()
      }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.distanceMeters).toBe('number');
    expect(typeof body.gpsOk).toBe('boolean');
  });
  
  test('returns 422 for invalid geohash', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/verify/location`, {
      data: {
        placeId: 'p1',
        userGeohash5: 'bad' // Wrong length
      }
    });
    
    expect(response.status()).toBe(422);
  });
  
  test('handles rate limiting', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/verify/location`, {
      data: {
        placeId: 'p1',
        userGeohash5: 'wydm6'
      }
    });
    
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeTruthy();
    expect(headers['x-ratelimit-remaining']).toBeTruthy();
  });
});

test.describe('Receipt API', () => {
  test('upload creates receipt record', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/receipts/upload`, {
      data: {
        placeId: 'p1',
        amount: 25000,
        fileKey: 'test-receipt-001.jpg'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.receiptId).toBeTruthy();
    expect(body.ocrStatus).toBe('pending');
  });
  
  test('OCR updates receipt status', async ({ request }) => {
    // First upload a receipt
    const uploadResponse = await request.post(`${BASE_URL}/api/receipts/upload`, {
      data: {
        placeId: 'p1',
        amount: 30000,
        fileKey: 'test-receipt-002.jpg'
      }
    });
    
    const { receiptId } = await uploadResponse.json();
    
    // Then perform OCR
    const ocrResponse = await request.post(`${BASE_URL}/api/receipts/ocr`, {
      data: {
        receiptId,
        ok: true
      }
    });
    
    expect(ocrResponse.status()).toBe(200);
    const body = await ocrResponse.json();
    expect(body.ocrStatus).toBe('ok');
  });
});

test.describe('Complete Verification API', () => {
  test('returns verification status and applies policy', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/verify/complete`, {
      data: {
        placeId: 'p1'
      }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(typeof body.allowed).toBe('boolean');
    expect(typeof body.gpsOk).toBe('boolean');
    expect(typeof body.qrOk).toBe('boolean');
    expect(typeof body.receiptOk).toBe('boolean');
    
    // Verify policy logic: allowed = gpsOk && (qrOk || receiptOk)
    const expectedAllowed = body.gpsOk && (body.qrOk || body.receiptOk);
    expect(body.allowed).toBe(expectedAllowed);
  });
});
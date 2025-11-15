import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Triple Verification E2E Test Suite
 * Tests the complete flow: QR → Location → Receipt → Wallet Redemption
 */

test.describe('Triple Verification Flow', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const mockUserId = 'test-user-' + Date.now();
  const mockPlaceId = 'test-place-001';
  const mockGeohash5 = 'wydm6'; // Seoul coordinates

  test.beforeAll(async () => {
    // Setup: Create test data (QR token, place, etc.)
    // In real scenario, this would use seeded database or API calls
  });

  test('should complete full triple verification flow', async ({ request }) => {
    // Generate unique idempotency keys for each step
    const qrIdemKey = uuidv4();
    const locationIdemKey = uuidv4();
    const receiptIdemKey = uuidv4();
    const redeemIdemKey = uuidv4();

    // Step 1: QR Verification
    test.step('QR Verification', async () => {
      const response = await request.post('/api/qr/verify', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': qrIdemKey,
        },
        data: {
          token: 'mock-qr-token-' + Date.now(),
          geohash5: mockGeohash5,
          userId: mockUserId,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // Should be success or failed (based on token existence)
      expect(['success', 'failed', 'pending', 'processing']).toContain(body.state);
      
      // Check required headers
      const headers = response.headers();
      expect(headers['x-cache']).toBeDefined();
      expect(headers['x-ratelimit-limit']).toBeDefined();
    });

    // Step 2: Location Verification
    test.step('Location Verification', async () => {
      const response = await request.post('/api/location/verify', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': locationIdemKey,
        },
        data: {
          placeId: mockPlaceId,
          userGeohash5: mockGeohash5,
          userId: mockUserId,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(['success', 'failed']).toContain(body.state);
      
      if (body.state === 'success') {
        expect(body.distance).toBeDefined();
        expect(body.distance).toBeLessThanOrEqual(100); // Max 100m
      }
    });

    // Step 3: Receipt Verification
    test.step('Receipt Verification', async () => {
      const response = await request.post('/api/receipt/verify', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': receiptIdemKey,
        },
        data: {
          userId: mockUserId,
          placeId: mockPlaceId,
          mediaUrl: 'https://example.com/receipt-' + Date.now() + '.jpg',
          expectedTotal: 15000,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      expect(['pending', 'processing', 'completed', 'failed']).toContain(body.state);
      
      if (body.state === 'completed') {
        expect(body.ocrData).toBeDefined();
        expect(body.ocrData.total).toBeGreaterThan(0);
        expect(body.confidence).toBeGreaterThan(0);
      }
    });

    // Step 4: Wallet Redemption (only if all verifications passed)
    test.step('Wallet Redemption', async () => {
      const response = await request.post('/api/wallet/redeem', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': redeemIdemKey,
        },
        data: {
          userId: mockUserId,
          voucherId: 'mock-voucher-' + Date.now(),
          placeId: mockPlaceId,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // Should return success or error
      expect(body.success).toBeDefined();
      
      if (body.success) {
        expect(body.newBalance).toBeGreaterThanOrEqual(0);
        expect(body.ledgerEntry).toBeDefined();
      } else {
        expect(body.message).toBeDefined();
      }
    });
  });

  test('should handle idempotency correctly - duplicate QR verification', async ({ request }) => {
    const idemKey = uuidv4();
    const requestData = {
      token: 'idempotency-test-token-' + Date.now(),
      geohash5: mockGeohash5,
      userId: mockUserId,
    };

    // First request
    const response1 = await request.post('/api/qr/verify', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      data: requestData,
    });

    expect(response1.ok()).toBeTruthy();
    const body1 = await response1.json();

    // Second request with same idempotency key
    const response2 = await request.post('/api/qr/verify', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      data: requestData,
    });

    expect(response2.ok()).toBeTruthy();
    const body2 = await response2.json();

    // Should return same result
    expect(body2.state).toBe(body1.state);
    
    // Second request should be marked as idempotent
    const headers2 = response2.headers();
    expect(headers2['x-idempotent']).toBe('true');
  });

  test('should handle idempotency correctly - duplicate wallet redemption', async ({ request }) => {
    const idemKey = uuidv4();
    const requestData = {
      userId: mockUserId,
      voucherId: 'duplicate-test-voucher-' + Date.now(),
      placeId: mockPlaceId,
    };

    // First redemption attempt
    const response1 = await request.post('/api/wallet/redeem', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      data: requestData,
    });

    expect(response1.ok()).toBeTruthy();
    const body1 = await response1.json();

    // Second redemption attempt with same key
    const response2 = await request.post('/api/wallet/redeem', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      data: requestData,
    });

    expect(response2.ok()).toBeTruthy();
    const body2 = await response2.json();

    // Should return identical result (no double redemption)
    expect(body2).toEqual(body1);
    
    // Balance should be the same
    if (body1.newBalance !== undefined) {
      expect(body2.newBalance).toBe(body1.newBalance);
    }
  });

  test('should reject requests without idempotency key', async ({ request }) => {
    const response = await request.post('/api/qr/verify', {
      headers: {
        'Content-Type': 'application/json',
        // No Idempotency-Key header
      },
      data: {
        token: 'test-token',
        geohash5: mockGeohash5,
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toContain('Idempotency-Key');
  });

  test('should handle rate limiting correctly', async ({ request }) => {
    const promises = [];
    
    // Make 11 requests (limit is 10)
    for (let i = 0; i < 11; i++) {
      promises.push(
        request.post('/api/qr/verify', {
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': uuidv4(),
            'x-forwarded-for': '192.168.1.200', // Same IP
          },
          data: {
            token: 'rate-limit-test-' + i,
            geohash5: mockGeohash5,
          },
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // At least one should be rate limited
    const rateLimited = responses.filter((r) => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
    
    // Check rate limit headers
    const lastResponse = responses[responses.length - 1];
    const headers = lastResponse.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
  });

  test('should verify location distance threshold', async ({ request }) => {
    // Test with far away location (should fail)
    const farGeohash5 = 'gbsuv'; // London coordinates (far from Seoul)
    
    const response = await request.post('/api/location/verify', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': uuidv4(),
      },
      data: {
        placeId: mockPlaceId,
        userGeohash5: farGeohash5, // Very far from place
        userId: mockUserId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    
    expect(body.state).toBe('failed');
    expect(body.message).toContain('Distance too large');
    expect(body.distance).toBeGreaterThan(100); // Over threshold
  });

  test('should handle concurrent redemption attempts safely', async ({ request }) => {
    const idemKey1 = uuidv4();
    const idemKey2 = uuidv4();
    const voucherId = 'concurrent-test-' + Date.now();

    // Two concurrent redemption attempts for same voucher
    const [response1, response2] = await Promise.all([
      request.post('/api/wallet/redeem', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey1,
        },
        data: {
          userId: mockUserId,
          voucherId,
          placeId: mockPlaceId,
        },
      }),
      request.post('/api/wallet/redeem', {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey2,
        },
        data: {
          userId: mockUserId,
          voucherId,
          placeId: mockPlaceId,
        },
      }),
    ]);

    const body1 = await response1.json();
    const body2 = await response2.json();

    // Only one should succeed (or both fail if voucher doesn't exist)
    if (body1.success && body2.success) {
      // If both report success, they should have same balance (idempotency)
      expect(body1.newBalance).toBe(body2.newBalance);
    } else {
      // One should succeed, one should fail with "already redeemed"
      const successCount = [body1.success, body2.success].filter(Boolean).length;
      expect(successCount).toBeLessThanOrEqual(1);
    }
  });
});

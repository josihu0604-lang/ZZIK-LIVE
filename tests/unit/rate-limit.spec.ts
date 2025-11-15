// tests/unit/rate-limit.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAndConsume,
  addRateHeaders,
  requireIdempotency,
  genIdempotencyKey,
  storeIdempotentResponse,
  getIdempotentResponse,
  checkCompositeRateLimit,
  BUCKET,
  WINDOW,
  IDEMPOTENCY_CACHE,
} from '@/lib/server/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear all caches
    BUCKET.clear();
    WINDOW.clear();
    IDEMPOTENCY_CACHE.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkAndConsume', () => {
    it('should allow requests within rate limit', () => {
      const key = 'test_user_1';
      const limit = 10;

      for (let i = 0; i < limit; i++) {
        const result = checkAndConsume(key, limit);
        expect(result.ok).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const key = 'test_user_2';
      const limit = 5;

      // Consume all tokens
      for (let i = 0; i < limit; i++) {
        checkAndConsume(key, limit);
      }

      // Next request should be blocked
      const result = checkAndConsume(key, limit);
      expect(result.ok).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reset_ms).toBeGreaterThan(0);
    });

    it('should refill tokens over time', () => {
      const key = 'test_user_3';
      const limit = 60; // 60 per minute

      // Consume all tokens
      for (let i = 0; i < limit; i++) {
        checkAndConsume(key, limit);
      }

      // Should be blocked
      let result = checkAndConsume(key, limit);
      expect(result.ok).toBe(false);

      // Advance time by 30 seconds (should refill 30 tokens)
      vi.advanceTimersByTime(30000);

      // Should now allow ~30 requests
      for (let i = 0; i < 29; i++) {
        result = checkAndConsume(key, limit);
        expect(result.ok).toBe(true);
      }
    });

    it('should handle multiple keys independently', () => {
      const key1 = 'user_1';
      const key2 = 'user_2';
      const limit = 5;

      // Consume all tokens for key1
      for (let i = 0; i < limit; i++) {
        checkAndConsume(key1, limit);
      }

      // key1 should be blocked
      expect(checkAndConsume(key1, limit).ok).toBe(false);

      // key2 should still work
      expect(checkAndConsume(key2, limit).ok).toBe(true);
    });
  });

  describe('addRateHeaders', () => {
    it('should add proper rate limit headers', () => {
      const res = new Response('OK');
      const limit = 100;
      const remaining = 75;
      const resetMs = 45000;

      addRateHeaders(res, limit, remaining, resetMs);

      expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('75');
      expect(res.headers.get('Retry-After')).toBe('45');
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should not show negative remaining', () => {
      const res = new Response('OK');
      addRateHeaders(res, 100, -5, 30000);

      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('Idempotency', () => {
    describe('requireIdempotency', () => {
      it('should accept valid idempotency key', () => {
        const req = new Request('http://test.com', {
          headers: {
            'Idempotency-Key': 'test_key_12345',
          },
        });

        const key = requireIdempotency(req);
        expect(key).toBe('idem_test_key_12345');
      });

      it('should reject missing idempotency key', () => {
        const req = new Request('http://test.com');

        expect(() => requireIdempotency(req)).toThrow('idempotency_key_missing');
      });

      it('should reject short idempotency key', () => {
        const req = new Request('http://test.com', {
          headers: {
            'Idempotency-Key': 'short',
          },
        });

        expect(() => requireIdempotency(req)).toThrow('idempotency_key_missing');
      });
    });

    describe('genIdempotencyKey', () => {
      it('should generate unique idempotency keys', () => {
        const key1 = genIdempotencyKey();
        const key2 = genIdempotencyKey();

        expect(key1).toMatch(/^idem_[a-zA-Z0-9]{24}$/);
        expect(key2).toMatch(/^idem_[a-zA-Z0-9]{24}$/);
        expect(key1).not.toBe(key2);
      });
    });

    describe('idempotent response caching', () => {
      it('should store and retrieve idempotent responses', () => {
        const key = 'idem_test_123';
        const response = { success: true, data: { id: 'abc123' } };

        storeIdempotentResponse(key, response);
        const retrieved = getIdempotentResponse(key);

        expect(retrieved).toEqual(response);
      });

      it('should return null for non-existent keys', () => {
        const retrieved = getIdempotentResponse('idem_nonexistent');
        expect(retrieved).toBeNull();
      });

      it('should expire old cached responses', () => {
        const key = 'idem_test_expire';
        const response = { success: true };

        storeIdempotentResponse(key, response);

        // Advance time by 6 minutes (cache expires at 5 minutes)
        vi.advanceTimersByTime(6 * 60 * 1000);

        const retrieved = getIdempotentResponse(key);
        expect(retrieved).toBeNull();
      });
    });
  });

  describe('checkCompositeRateLimit', () => {
    it('should check multiple rate limit factors', () => {
      const factors = {
        ip: '192.168.1.1',
        user: 'user123',
      };
      const limits = {
        ip: 100,
        user: 50,
      };

      // Consume user limit (more restrictive)
      for (let i = 0; i < 50; i++) {
        checkAndConsume('user:user123', 50);
      }

      const result = checkCompositeRateLimit(factors, limits);
      expect(result.ok).toBe(false); // User limit exceeded
    });

    it('should return the most restrictive result', () => {
      const factors = {
        ip: '192.168.1.1',
        user: 'user456',
        api_key: 'key789',
      };
      const limits = {
        ip: 100,
        user: 50,
        api_key: 20, // Most restrictive
      };

      // Consume API key limit
      for (let i = 0; i < 20; i++) {
        checkAndConsume('api_key:key789', 20);
      }

      const result = checkCompositeRateLimit(factors, limits);
      expect(result.ok).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Memory cleanup', () => {
    it('should clean up old entries periodically', () => {
      // Add some entries
      checkAndConsume('old_key_1', 10);
      checkAndConsume('old_key_2', 10);
      storeIdempotentResponse('idem_old', { data: 'test' });

      // Verify they exist
      expect(BUCKET.has('old_key_1')).toBe(true);
      expect(IDEMPOTENCY_CACHE.has('idem_old')).toBe(true);

      // Advance time to trigger cleanup (6 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Old entries should be cleaned up
      // Note: In actual implementation, cleanup runs in setInterval
      // For testing, we might need to trigger it manually
    });
  });

  describe('Rate limit scenarios', () => {
    it('should handle burst traffic correctly', () => {
      const key = 'burst_test';
      const limit = 100;
      const results: boolean[] = [];

      // Simulate burst of 150 requests
      for (let i = 0; i < 150; i++) {
        const result = checkAndConsume(key, limit);
        results.push(result.ok);
      }

      // First 100 should pass
      expect(results.slice(0, 100).every((r) => r === true)).toBe(true);
      // Rest should fail
      expect(results.slice(100).every((r) => r === false)).toBe(true);
    });

    it('should handle QR verification rate limiting', () => {
      const ip = '192.168.1.100';
      const qrKey = `qr:${ip}`;
      const limit = 30; // 30 QR verifications per minute

      // Normal usage pattern
      for (let i = 0; i < 10; i++) {
        const result = checkAndConsume(qrKey, limit);
        expect(result.ok).toBe(true);
        vi.advanceTimersByTime(3000); // 3 seconds between scans
      }

      // Abuse pattern - rapid scanning
      const abuseResults: boolean[] = [];
      for (let i = 0; i < 25; i++) {
        const result = checkAndConsume(qrKey, limit);
        abuseResults.push(result.ok);
      }

      // Should start blocking after hitting remaining limit
      const blocked = abuseResults.filter((r) => !r).length;
      expect(blocked).toBeGreaterThan(0);
    });
  });
});

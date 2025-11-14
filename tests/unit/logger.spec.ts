// tests/unit/logger.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  log,
  sanitizeMeta,
  REDACT_KEYS,
  createRequestId,
  sanitizeLocation,
} from '@/lib/server/logger';

describe('Logger Security', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('sanitizeMeta', () => {
    it('should redact sensitive keys', () => {
      const meta = {
        user_id: 'user123',
        lat: 37.5665,
        lng: 126.978,
        latitude: 37.5665,
        longitude: 126.978,
        phone: '+821012345678',
        email: 'user@example.com',
        token: 'secret_token_123',
        password: 'supersecret',
        api_key: 'sk_test_123',
        normal_field: 'visible',
      };

      const sanitized = sanitizeMeta(meta);

      expect(sanitized?.user_id).toBe('user123');
      expect(sanitized?.normal_field).toBe('visible');
      expect(sanitized?.lat).toBe('[REDACTED]');
      expect(sanitized?.lng).toBe('[REDACTED]');
      expect(sanitized?.latitude).toBe('[REDACTED]');
      expect(sanitized?.longitude).toBe('[REDACTED]');
      expect(sanitized?.phone).toBe('[REDACTED]');
      expect(sanitized?.email).toBe('[REDACTED]');
      expect(sanitized?.token).toBe('[REDACTED]');
      expect(sanitized?.password).toBe('[REDACTED]');
      expect(sanitized?.api_key).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const meta = {
        user: {
          id: 'user123',
          email: 'user@example.com',
          location: {
            lat: 37.5665,
            lng: 126.978,
            city: 'Seoul',
          },
        },
        geohash5: 'wydm6', // This should be preserved
      };

      const sanitized = sanitizeMeta(meta);

      expect(sanitized?.geohash5).toBe('wydm6');
      expect((sanitized?.user as any).id).toBe('user123');
      expect((sanitized?.user as any).email).toBe('[REDACTED]');
      expect((sanitized?.user as any).location.lat).toBe('[REDACTED]');
      expect((sanitized?.user as any).location.lng).toBe('[REDACTED]');
      expect((sanitized?.user as any).location.city).toBe('Seoul');
    });

    it('should handle arrays with objects', () => {
      const meta = {
        locations: [
          { lat: 37.5665, lng: 126.978, name: 'Place 1' },
          { lat: 37.5666, lng: 126.9781, name: 'Place 2' },
        ],
      };

      const sanitized = sanitizeMeta(meta);
      const locations = sanitized?.locations as any[];

      expect(locations[0].lat).toBe('[REDACTED]');
      expect(locations[0].lng).toBe('[REDACTED]');
      expect(locations[0].name).toBe('Place 1');
      expect(locations[1].lat).toBe('[REDACTED]');
      expect(locations[1].lng).toBe('[REDACTED]');
      expect(locations[1].name).toBe('Place 2');
    });
  });

  describe('log function', () => {
    it('should automatically remove raw coordinates from meta', () => {
      const ctx = {
        route: '/api/test',
        method: 'POST',
        status: 200,
        took_ms: 50,
        meta: {
          lat: 37.5665,
          lng: 126.978,
          geohash5: 'wydm6',
          user_id: 'user123',
        },
      };

      log('info', ctx);

      const logCall = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.meta.lat).toBeUndefined();
      expect(parsed.meta.lng).toBeUndefined();
      expect(parsed.meta.geohash5).toBe('wydm6');
      expect(parsed.meta.user_id).toBe('user123');
    });

    it('should include proper structure in log output', () => {
      const ctx = {
        route: '/api/test',
        method: 'GET',
        status: 200,
        took_ms: 25,
        request_id: 'req_test123',
        geohash5: 'wydm6',
      };

      log('info', ctx);

      const logCall = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.level).toBe('info');
      expect(parsed.route).toBe('/api/test');
      expect(parsed.method).toBe('GET');
      expect(parsed.status).toBe(200);
      expect(parsed.took_ms).toBe(25);
      expect(parsed.request_id).toBe('req_test123');
      expect(parsed.geohash5).toBe('wydm6');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('createRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = createRequestId();
      const id2 = createRequestId();

      expect(id1).toMatch(/^req_[a-zA-Z0-9]{16}$/);
      expect(id2).toMatch(/^req_[a-zA-Z0-9]{16}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('sanitizeLocation', () => {
    it('should remove all location-related fields', () => {
      const data = {
        id: 'place123',
        name: 'Test Place',
        lat: 37.5665,
        lng: 126.978,
        latitude: 37.5665,
        longitude: 126.978,
        coords: { x: 1, y: 2 },
        coordinates: [126.978, 37.5665],
        location: { lat: 37.5665, lng: 126.978 },
        position: { lat: 37.5665, lng: 126.978 },
        geohash5: 'wydm6', // Should be preserved
      };

      const sanitized = sanitizeLocation(data);

      expect(sanitized.id).toBe('place123');
      expect(sanitized.name).toBe('Test Place');
      expect(sanitized.geohash5).toBe('wydm6');
      expect(sanitized.lat).toBeUndefined();
      expect(sanitized.lng).toBeUndefined();
      expect(sanitized.latitude).toBeUndefined();
      expect(sanitized.longitude).toBeUndefined();
      expect(sanitized.coords).toBeUndefined();
      expect(sanitized.coordinates).toBeUndefined();
      expect(sanitized.location).toBeUndefined();
      expect(sanitized.position).toBeUndefined();
    });

    it('should handle nested objects recursively', () => {
      const data = {
        place: {
          id: 'place123',
          location: { lat: 37.5665, lng: 126.978 },
          details: {
            position: { lat: 37.5665, lng: 126.978 },
            name: 'Nested Place',
          },
        },
      };

      const sanitized = sanitizeLocation(data);

      expect(sanitized.place.id).toBe('place123');
      expect(sanitized.place.location).toBeUndefined();
      expect(sanitized.place.details.position).toBeUndefined();
      expect(sanitized.place.details.name).toBe('Nested Place');
    });
  });

  describe('Privacy compliance', () => {
    it('should never log raw coordinates', () => {
      const testCases = [
        { lat: 37.5665, lng: 126.978 },
        { latitude: 37.5665, longitude: 126.978 },
        { location: { lat: 37.5665, lng: 126.978 } },
        { position: { coords: { latitude: 37.5665, longitude: 126.978 } } },
      ];

      testCases.forEach((meta, index) => {
        log('info', {
          route: '/api/test',
          method: 'GET',
          status: 200,
          took_ms: 10,
          meta,
        });

        const logCall = (console.log as any).mock.calls[index][0];
        const parsed = JSON.parse(logCall);
        const stringified = JSON.stringify(parsed);

        // Ensure no raw coordinates appear in the output
        expect(stringified).not.toContain('37.5665');
        expect(stringified).not.toContain('126.9780');
      });
    });

    it('should allow geohash5 values', () => {
      log('info', {
        route: '/api/test',
        method: 'GET',
        status: 200,
        took_ms: 10,
        geohash5: 'wydm6',
        meta: {
          geohash5: 'wydm6',
          geohash6: 'wydm6v',
        },
      });

      const logCall = (console.log as any).mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.geohash5).toBe('wydm6');
      expect(parsed.meta.geohash5).toBe('wydm6');
      expect(parsed.meta.geohash6).toBe('wydm6v');
    });
  });
});

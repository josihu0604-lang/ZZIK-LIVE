import { describe, it, expect } from 'vitest';
import { guardGeoprivacy, guardPII, sanitizeForLogging, coordsToGeohash } from '@/lib/privacy';

describe('Privacy Guards', () => {
  describe('guardGeoprivacy', () => {
    it('throws on raw lat/lng coordinates', () => {
      expect(() => guardGeoprivacy({ lat: 37.7749, lng: -122.4194 })).toThrow('raw lat/lng');
      expect(() => guardGeoprivacy({ latitude: 37.7749, longitude: -122.4194 })).toThrow('raw lat/lng');
    });

    it('throws on nested coordinates', () => {
      expect(() => guardGeoprivacy({ 
        location: { lat: 37.7749, lng: -122.4194 } 
      })).toThrow('raw lat/lng');
    });

    it('allows safe geohash data', () => {
      expect(() => guardGeoprivacy({ geohash5: 'wydm6', geohash6: 'wydm6v' })).not.toThrow();
      expect(() => guardGeoprivacy({ distance: 100, bearing: 45 })).not.toThrow();
    });

    it('allows empty objects', () => {
      expect(() => guardGeoprivacy({})).not.toThrow();
    });
  });

  describe('guardPII', () => {
    it('throws on PII fields', () => {
      expect(() => guardPII({ email: 'test@example.com' })).toThrow('PII data');
      expect(() => guardPII({ phone: '555-1234' })).toThrow('PII data');
      expect(() => guardPII({ password: 'secret' })).toThrow('PII data');
      expect(() => guardPII({ ssn: '123-45-6789' })).toThrow('PII data');
      expect(() => guardPII({ creditcard: '1234-5678-9012-3456' })).toThrow('PII data');
    });

    it('throws on nested PII', () => {
      expect(() => guardPII({ 
        user: { email: 'test@example.com' } 
      })).toThrow('PII data');
    });

    it('allows safe data', () => {
      expect(() => guardPII({ name: 'John', age: 30 })).not.toThrow();
      expect(() => guardPII({ id: '123', role: 'admin' })).not.toThrow();
    });
  });

  describe('sanitizeForLogging', () => {
    it('redacts sensitive coordinates', () => {
      const input = { lat: 37.7749, lng: -122.4194, name: 'Place' };
      const output = sanitizeForLogging(input);
      
      expect(output.lat).toBe('[REDACTED]');
      expect(output.lng).toBe('[REDACTED]');
      expect(output.name).toBe('Place');
    });

    it('redacts PII data', () => {
      const input = { email: 'test@example.com', phone: '555-1234', name: 'John' };
      const output = sanitizeForLogging(input);
      
      expect(output.email).toBe('[REDACTED]');
      expect(output.phone).toBe('[REDACTED]');
      expect(output.name).toBe('John');
    });

    it('handles nested objects', () => {
      const input = {
        user: {
          email: 'test@example.com',
          location: { lat: 37.7749, lng: -122.4194 },
          name: 'John'
        }
      };
      const output = sanitizeForLogging(input);
      
      expect(output.user).toEqual({
        email: '[REDACTED]',
        location: { lat: '[REDACTED]', lng: '[REDACTED]' },
        name: 'John'
      });
    });

    it('handles arrays', () => {
      const input = {
        users: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' }
        ]
      };
      const output = sanitizeForLogging(input);
      
      expect(output.users).toEqual([
        { email: '[REDACTED]', name: 'User 1' },
        { email: '[REDACTED]', name: 'User 2' }
      ]);
    });
  });

  describe('coordsToGeohash', () => {
    it('converts coordinates to geohash', () => {
      const geohash = coordsToGeohash(37.7749, -122.4194, 5);
      expect(geohash).toHaveLength(5);
      expect(geohash).toMatch(/^[0-9a-z]{5}$/);
    });

    it('uses different precision levels', () => {
      const geohash3 = coordsToGeohash(37.7749, -122.4194, 3);
      const geohash6 = coordsToGeohash(37.7749, -122.4194, 6);
      
      expect(geohash3).toHaveLength(3);
      expect(geohash6).toHaveLength(6);
      expect(geohash6.startsWith(geohash3)).toBe(true);
    });
  });
});
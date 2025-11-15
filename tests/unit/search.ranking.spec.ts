// tests/unit/search.ranking.spec.ts
import { describe, it, expect } from 'vitest';
import {
  proximityFromMeters,
  searchScore,
  normalizePopularity,
  calculateAgeDecay,
} from '@/lib/search/ranking';

describe('Search Ranking', () => {
  describe('proximityFromMeters', () => {
    it('returns 1.0 at center (0 meters)', () => {
      expect(proximityFromMeters(0, 1000)).toBe(1);
    });

    it('returns 0.5 at half radius', () => {
      expect(proximityFromMeters(500, 1000)).toBeCloseTo(0.5);
    });

    it('returns 0.0 at radius boundary', () => {
      expect(proximityFromMeters(1000, 1000)).toBe(0);
    });

    it('returns 0.0 beyond radius', () => {
      expect(proximityFromMeters(1500, 1000)).toBe(0);
    });

    it('returns 1.0 for negative distance (edge case)', () => {
      expect(proximityFromMeters(-10, 1000)).toBe(1);
    });
  });

  describe('normalizePopularity', () => {
    it('normalizes 0-100 scale to 0-1', () => {
      expect(normalizePopularity(0)).toBe(0);
      expect(normalizePopularity(50)).toBe(0.5);
      expect(normalizePopularity(100)).toBe(1);
    });

    it('clamps values above 100 to 1', () => {
      expect(normalizePopularity(150)).toBe(1);
    });

    it('clamps negative values to 0', () => {
      expect(normalizePopularity(-10)).toBe(0);
    });
  });

  describe('calculateAgeDecay', () => {
    it('returns 0 for brand new places', () => {
      const now = new Date();
      expect(calculateAgeDecay(now)).toBe(0);
    });

    it('returns ~0.5 for 6-month-old places', () => {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const decay = calculateAgeDecay(sixMonthsAgo);
      expect(decay).toBeCloseTo(0.493, 2);
    });

    it('returns 1.0 for 1-year-old places', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const decay = calculateAgeDecay(oneYearAgo);
      expect(decay).toBeCloseTo(1, 2);
    });

    it('caps at 1.0 for places older than 1 year', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      const decay = calculateAgeDecay(twoYearsAgo);
      expect(decay).toBe(1);
    });
  });

  describe('searchScore', () => {
    it('produces maximum score with perfect inputs', () => {
      const score = searchScore({
        bm25: 1,
        proximity: 1,
        popularity: 1,
        ageDecay: 0,
      });
      // 0.5*1 + 0.3*1 + 0.2*1 - 0.1*0 = 1.0
      expect(score).toBeCloseTo(1.0);
    });

    it('produces minimum score with worst inputs', () => {
      const score = searchScore({
        bm25: 0,
        proximity: 0,
        popularity: 0,
        ageDecay: 1,
      });
      // 0.5*0 + 0.3*0 + 0.2*0 - 0.1*1 = -0.1
      expect(score).toBeCloseTo(-0.1);
    });

    it('balances different factors correctly', () => {
      const score = searchScore({
        bm25: 0.8,
        proximity: 0.5,
        popularity: 0.7,
        ageDecay: 0.3,
      });
      // 0.5*0.8 + 0.3*0.5 + 0.2*0.7 - 0.1*0.3 = 0.4 + 0.15 + 0.14 - 0.03 = 0.66
      expect(score).toBeCloseTo(0.66);
    });

    it('weights BM25 most heavily (50%)', () => {
      const highBM25 = searchScore({
        bm25: 1,
        proximity: 0,
        popularity: 0,
        ageDecay: 0,
      });
      expect(highBM25).toBeCloseTo(0.5);
    });

    it('weights proximity second (30%)', () => {
      const highProximity = searchScore({
        bm25: 0,
        proximity: 1,
        popularity: 0,
        ageDecay: 0,
      });
      expect(highProximity).toBeCloseTo(0.3);
    });

    it('weights popularity third (20%)', () => {
      const highPopularity = searchScore({
        bm25: 0,
        proximity: 0,
        popularity: 1,
        ageDecay: 0,
      });
      expect(highPopularity).toBeCloseTo(0.2);
    });

    it('applies age decay penalty (10%)', () => {
      const oldPlace = searchScore({
        bm25: 1,
        proximity: 1,
        popularity: 1,
        ageDecay: 1,
      });
      expect(oldPlace).toBeCloseTo(0.9); // 1.0 - 0.1
    });
  });
});

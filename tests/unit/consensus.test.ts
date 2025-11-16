import { describe, it, expect } from 'vitest';
import {
  validateConsensus,
  clearConsensusBuffer,
  getConsensusProgress,
  getAdaptiveThreshold,
  type ConsensusRead,
} from '@/lib/consensus';

describe('Consensus Algorithm', () => {
  describe('validateConsensus', () => {
    it('should require 3 consecutive identical reads by default', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      // First read
      const result1 = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime, source: 'ZXing' },
        3
      );
      expect(result1.valid).toBe(false);
      expect(result1.consecutiveMatches).toBe(1);
      expect(result1.confidence).toBeCloseTo(33, 0);

      // Second read (same)
      const result2 = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime + 100, source: 'ZXing' },
        3
      );
      expect(result2.valid).toBe(false);
      expect(result2.consecutiveMatches).toBe(2);
      expect(result2.confidence).toBeCloseTo(67, 0);

      // Third read (same) - should validate
      const result3 = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime + 200, source: 'ZXing' },
        3
      );
      expect(result3.valid).toBe(true);
      expect(result3.consecutiveMatches).toBe(3);
      expect(result3.confidence).toBe(100);
    });

    it('should reset count on different text', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      validateConsensus(buffer, { text: 'QR123', ts: baseTime, source: 'ZXing' }, 3);
      validateConsensus(buffer, { text: 'QR123', ts: baseTime + 100, source: 'ZXing' }, 3);

      // Different text - should reset
      const result = validateConsensus(
        buffer,
        { text: 'QR456', ts: baseTime + 200, source: 'ZXing' },
        3
      );
      expect(result.valid).toBe(false);
      expect(result.consecutiveMatches).toBe(1); // Reset to 1
    });

    it('should ignore reads outside time window', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      // Old read (outside 1 second window)
      validateConsensus(buffer, { text: 'QR123', ts: baseTime - 2000, source: 'ZXing' }, 3);

      // New reads
      const result = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime, source: 'ZXing' },
        3
      );

      // Should only count the new read (old one outside window)
      expect(result.consecutiveMatches).toBe(1);
    });

    it('should limit buffer size to 10 reads', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      // Add 15 reads
      for (let i = 0; i < 15; i++) {
        validateConsensus(buffer, { text: 'QR123', ts: baseTime + i * 10, source: 'ZXing' }, 3);
      }

      // Buffer should be limited to 10
      expect(buffer.length).toBe(10);
    });

    it('should support custom threshold', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      // Threshold of 5
      for (let i = 0; i < 4; i++) {
        const result = validateConsensus(
          buffer,
          { text: 'QR123', ts: baseTime + i * 10, source: 'ZXing' },
          5
        );
        expect(result.valid).toBe(false);
      }

      // 5th read should validate
      const result = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime + 40, source: 'ZXing' },
        5
      );
      expect(result.valid).toBe(true);
      expect(result.consecutiveMatches).toBe(5);
    });
  });

  describe('clearConsensusBuffer', () => {
    it('should clear all reads from buffer', () => {
      const buffer: ConsensusRead[] = [
        { text: 'QR123', ts: Date.now(), source: 'ZXing' },
        { text: 'QR123', ts: Date.now(), source: 'ZXing' },
      ];

      clearConsensusBuffer(buffer);
      expect(buffer.length).toBe(0);
    });
  });

  describe('getConsensusProgress', () => {
    it('should calculate progress percentage', () => {
      const baseTime = Date.now();
      const buffer: ConsensusRead[] = [
        { text: 'QR123', ts: baseTime, source: 'ZXing' },
        { text: 'QR123', ts: baseTime + 50, source: 'ZXing' },
      ];

      const progress = getConsensusProgress(buffer, 'QR123', 3);
      expect(progress).toBeCloseTo(67, 0); // 2 out of 3 = 66.67%
    });

    it('should return 0 for non-matching text', () => {
      const baseTime = Date.now();
      const buffer: ConsensusRead[] = [
        { text: 'QR123', ts: baseTime, source: 'ZXing' },
      ];

      const progress = getConsensusProgress(buffer, 'QR456', 3);
      expect(progress).toBe(0);
    });
  });

  describe('getAdaptiveThreshold', () => {
    it('should increase threshold in high noise environment', () => {
      const threshold = getAdaptiveThreshold(0.35, 3); // 35% error rate
      expect(threshold).toBe(5); // Base 3 + 2
    });

    it('should moderately increase in medium noise', () => {
      const threshold = getAdaptiveThreshold(0.2, 3); // 20% error rate
      expect(threshold).toBe(4); // Base 3 + 1
    });

    it('should keep base threshold in normal conditions', () => {
      const threshold = getAdaptiveThreshold(0.05, 3); // 5% error rate
      expect(threshold).toBe(3); // Base threshold
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty buffer', () => {
      const buffer: ConsensusRead[] = [];
      const result = validateConsensus(
        buffer,
        { text: 'QR123', ts: Date.now(), source: 'ZXing' },
        3
      );

      expect(result.valid).toBe(false);
      expect(result.consecutiveMatches).toBe(1);
    });

    it('should handle very fast consecutive reads', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      // 3 reads within 10ms
      validateConsensus(buffer, { text: 'QR123', ts: baseTime, source: 'ZXing' }, 3);
      validateConsensus(buffer, { text: 'QR123', ts: baseTime + 5, source: 'ZXing' }, 3);
      const result = validateConsensus(
        buffer,
        { text: 'QR123', ts: baseTime + 10, source: 'ZXing' },
        3
      );

      expect(result.valid).toBe(true);
    });

    it('should handle alternating reads', () => {
      const buffer: ConsensusRead[] = [];
      const baseTime = Date.now();

      validateConsensus(buffer, { text: 'QR123', ts: baseTime, source: 'ZXing' }, 3);
      validateConsensus(buffer, { text: 'QR456', ts: baseTime + 50, source: 'ZXing' }, 3);
      validateConsensus(buffer, { text: 'QR123', ts: baseTime + 100, source: 'ZXing' }, 3);

      const result = validateConsensus(
        buffer,
        { text: 'QR456', ts: baseTime + 150, source: 'ZXing' },
        3
      );

      // Should only count consecutive 'QR456' at the end
      expect(result.consecutiveMatches).toBe(1);
    });
  });
});

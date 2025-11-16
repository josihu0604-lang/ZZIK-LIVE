import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePulseScale,
  validateCorners,
  getCornerBoundingBox,
  type Corner,
} from '@/lib/corner-drawing';

describe('Corner Drawing Utilities', () => {
  describe('calculatePulseScale', () => {
    it('should return a value between 0.6 and 1.0', () => {
      const scale = calculatePulseScale(0);
      expect(scale).toBeGreaterThanOrEqual(0.6);
      expect(scale).toBeLessThanOrEqual(1.0);
    });

    it('should oscillate over time', () => {
      const scale1 = calculatePulseScale(0);
      const scale2 = calculatePulseScale(250); // Quarter period
      const scale3 = calculatePulseScale(500); // Half period

      // Values should be different
      expect(scale1).not.toBe(scale2);
      expect(scale2).not.toBe(scale3);
    });

    it('should use current time if no timestamp provided', () => {
      const scale = calculatePulseScale();
      expect(scale).toBeGreaterThanOrEqual(0.6);
      expect(scale).toBeLessThanOrEqual(1.0);
    });
  });

  describe('validateCorners', () => {
    it('should validate corners within canvas bounds', () => {
      const corners: Corner[] = [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 100 },
        { x: 10, y: 100 },
      ];

      const valid = validateCorners(corners, 200, 200);
      expect(valid).toBe(true);
    });

    it('should reject corners outside canvas bounds', () => {
      const corners: Corner[] = [
        { x: -10, y: 10 }, // Negative X
        { x: 100, y: 10 },
        { x: 100, y: 100 },
        { x: 10, y: 100 },
      ];

      const valid = validateCorners(corners, 200, 200);
      expect(valid).toBe(false);
    });

    it('should reject corners exceeding canvas width', () => {
      const corners: Corner[] = [
        { x: 10, y: 10 },
        { x: 250, y: 10 }, // Exceeds width
        { x: 100, y: 100 },
        { x: 10, y: 100 },
      ];

      const valid = validateCorners(corners, 200, 200);
      expect(valid).toBe(false);
    });

    it('should reject corners exceeding canvas height', () => {
      const corners: Corner[] = [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 250 }, // Exceeds height
        { x: 10, y: 100 },
      ];

      const valid = validateCorners(corners, 200, 200);
      expect(valid).toBe(false);
    });

    it('should handle empty corner array', () => {
      const valid = validateCorners([], 200, 200);
      expect(valid).toBe(true); // Empty array is valid
    });

    it('should allow corners at exact canvas boundaries', () => {
      const corners: Corner[] = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 200 },
        { x: 0, y: 200 },
      ];

      const valid = validateCorners(corners, 200, 200);
      expect(valid).toBe(true);
    });
  });

  describe('getCornerBoundingBox', () => {
    it('should calculate correct bounding box', () => {
      const corners: Corner[] = [
        { x: 10, y: 20 },
        { x: 100, y: 30 },
        { x: 90, y: 110 },
        { x: 15, y: 105 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.minX).toBe(10);
      expect(bbox!.maxX).toBe(100);
      expect(bbox!.minY).toBe(20);
      expect(bbox!.maxY).toBe(110);
      expect(bbox!.width).toBe(90);
      expect(bbox!.height).toBe(90);
    });

    it('should return null for empty corner array', () => {
      const bbox = getCornerBoundingBox([]);
      expect(bbox).toBeNull();
    });

    it('should handle single corner', () => {
      const corners: Corner[] = [{ x: 50, y: 75 }];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.minX).toBe(50);
      expect(bbox!.maxX).toBe(50);
      expect(bbox!.minY).toBe(75);
      expect(bbox!.maxY).toBe(75);
      expect(bbox!.width).toBe(0);
      expect(bbox!.height).toBe(0);
    });

    it('should handle corners on same horizontal line', () => {
      const corners: Corner[] = [
        { x: 10, y: 50 },
        { x: 100, y: 50 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.height).toBe(0);
      expect(bbox!.width).toBe(90);
    });

    it('should handle corners on same vertical line', () => {
      const corners: Corner[] = [
        { x: 50, y: 10 },
        { x: 50, y: 100 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.width).toBe(0);
      expect(bbox!.height).toBe(90);
    });

    it('should handle negative coordinates', () => {
      const corners: Corner[] = [
        { x: -10, y: -20 },
        { x: 50, y: 30 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.minX).toBe(-10);
      expect(bbox!.maxX).toBe(50);
      expect(bbox!.minY).toBe(-20);
      expect(bbox!.maxY).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large coordinate values', () => {
      const corners: Corner[] = [
        { x: 1000000, y: 1000000 },
        { x: 2000000, y: 2000000 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.width).toBe(1000000);
      expect(bbox!.height).toBe(1000000);
    });

    it('should handle floating point coordinates', () => {
      const corners: Corner[] = [
        { x: 10.5, y: 20.7 },
        { x: 100.3, y: 110.9 },
      ];

      const bbox = getCornerBoundingBox(corners);
      expect(bbox).not.toBeNull();
      expect(bbox!.minX).toBeCloseTo(10.5, 1);
      expect(bbox!.maxX).toBeCloseTo(100.3, 1);
    });

    it('should validate corners with floating point bounds', () => {
      const corners: Corner[] = [
        { x: 10.5, y: 20.5 },
        { x: 100.5, y: 100.5 },
      ];

      const valid = validateCorners(corners, 200.5, 200.5);
      expect(valid).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large number of corners efficiently', () => {
      const corners: Corner[] = [];
      for (let i = 0; i < 1000; i++) {
        corners.push({ x: Math.random() * 1000, y: Math.random() * 1000 });
      }

      const start = performance.now();
      const bbox = getCornerBoundingBox(corners);
      const duration = performance.now() - start;

      expect(bbox).not.toBeNull();
      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should validate many corners quickly', () => {
      const corners: Corner[] = [];
      for (let i = 0; i < 1000; i++) {
        corners.push({ x: i, y: i });
      }

      const start = performance.now();
      const valid = validateCorners(corners, 2000, 2000);
      const duration = performance.now() - start;

      expect(valid).toBe(true);
      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });
  });
});

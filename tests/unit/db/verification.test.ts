import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  upsertVerification,
  getVerification,
  isFullyVerified,
  getVerificationProgress,
  deleteVerification,
  countCompletedVerifications,
} from '@/lib/db/verification';

// Mock Prisma Client
const mockVerifications = new Map<string, any>();

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    verification: {
      upsert: vi.fn(async ({ where, update, create }) => {
        const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
        const existing = mockVerifications.get(key);

        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          mockVerifications.set(key, updated);
          return updated;
        } else {
          const newRecord = {
            id: `verif_${Date.now()}`,
            ...create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockVerifications.set(key, newRecord);
          return newRecord;
        }
      }),
      findUnique: vi.fn(async ({ where }) => {
        const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
        return mockVerifications.get(key) || null;
      }),
      delete: vi.fn(async ({ where }) => {
        const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
        mockVerifications.delete(key);
        return {};
      }),
      count: vi.fn(async ({ where }) => {
        let count = 0;
        for (const verif of mockVerifications.values()) {
          if (verif.userId === where.userId) {
            if (where.gpsOk && where.qrOk && where.receiptOk) {
              if (verif.gpsOk && verif.qrOk && verif.receiptOk) {
                count++;
              }
            } else {
              count++;
            }
          }
        }
        return count;
      }),
    },
  },
}));

describe('Verification Database Service', () => {
  beforeEach(() => {
    mockVerifications.clear();
  });

  afterEach(() => {
    mockVerifications.clear();
  });

  describe('upsertVerification', () => {
    it('should create new verification', async () => {
      const result = await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: false,
        receiptOk: false,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe('user1');
      expect(result.placeId).toBe('place1');
      expect(result.gpsOk).toBe(true);
      expect(result.qrOk).toBe(false);
      expect(result.receiptOk).toBe(false);
    });

    it('should update existing verification', async () => {
      // Create
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
      });

      // Update
      const result = await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        qrOk: true,
      });

      expect(result.gpsOk).toBe(true);
      expect(result.qrOk).toBe(true);
    });

    it('should default false for missing fields', async () => {
      const result = await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
      });

      expect(result.gpsOk).toBe(false);
      expect(result.qrOk).toBe(false);
      expect(result.receiptOk).toBe(false);
    });
  });

  describe('getVerification', () => {
    it('should get existing verification', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
      });

      const result = await getVerification('user1', 'place1');

      expect(result).toBeDefined();
      expect(result?.gpsOk).toBe(true);
    });

    it('should return null for non-existent verification', async () => {
      const result = await getVerification('user1', 'place1');
      expect(result).toBeNull();
    });
  });

  describe('isFullyVerified', () => {
    it('should return true when all checks pass', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: true,
        receiptOk: true,
      });

      const result = await isFullyVerified('user1', 'place1');
      expect(result).toBe(true);
    });

    it('should return false when any check fails', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: true,
        receiptOk: false,
      });

      const result = await isFullyVerified('user1', 'place1');
      expect(result).toBe(false);
    });

    it('should return false when verification does not exist', async () => {
      const result = await isFullyVerified('user1', 'place1');
      expect(result).toBe(false);
    });
  });

  describe('getVerificationProgress', () => {
    it('should calculate 0% for no verification', async () => {
      const progress = await getVerificationProgress('user1', 'place1');
      expect(progress).toBe(0);
    });

    it('should calculate 33% for one check', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
      });

      const progress = await getVerificationProgress('user1', 'place1');
      expect(progress).toBe(33);
    });

    it('should calculate 67% for two checks', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: true,
      });

      const progress = await getVerificationProgress('user1', 'place1');
      expect(progress).toBe(67);
    });

    it('should calculate 100% for all checks', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: true,
        receiptOk: true,
      });

      const progress = await getVerificationProgress('user1', 'place1');
      expect(progress).toBe(100);
    });
  });

  describe('deleteVerification', () => {
    it('should delete existing verification', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
      });

      await deleteVerification('user1', 'place1');

      const result = await getVerification('user1', 'place1');
      expect(result).toBeNull();
    });
  });

  describe('countCompletedVerifications', () => {
    it('should count only fully completed verifications', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
        qrOk: true,
        receiptOk: true,
      });

      await upsertVerification({
        userId: 'user1',
        placeId: 'place2',
        gpsOk: true,
        qrOk: true,
        receiptOk: false, // Not complete
      });

      await upsertVerification({
        userId: 'user1',
        placeId: 'place3',
        gpsOk: true,
        qrOk: true,
        receiptOk: true,
      });

      const count = await countCompletedVerifications('user1');
      expect(count).toBe(2);
    });

    it('should return 0 for user with no completions', async () => {
      const count = await countCompletedVerifications('user1');
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple users at same place', async () => {
      await upsertVerification({
        userId: 'user1',
        placeId: 'place1',
        gpsOk: true,
      });

      await upsertVerification({
        userId: 'user2',
        placeId: 'place1',
        qrOk: true,
      });

      const result1 = await getVerification('user1', 'place1');
      const result2 = await getVerification('user2', 'place1');

      expect(result1?.gpsOk).toBe(true);
      expect(result1?.qrOk).toBe(false);
      expect(result2?.gpsOk).toBe(false);
      expect(result2?.qrOk).toBe(true);
    });

    it('should handle rapid updates', async () => {
      await Promise.all([
        upsertVerification({ userId: 'user1', placeId: 'place1', gpsOk: true }),
        upsertVerification({ userId: 'user1', placeId: 'place1', qrOk: true }),
        upsertVerification({
          userId: 'user1',
          placeId: 'place1',
          receiptOk: true,
        }),
      ]);

      const result = await getVerification('user1', 'place1');
      expect(result).toBeDefined();
      // At least one should be true
      expect(
        result?.gpsOk || result?.qrOk || result?.receiptOk
      ).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle many verifications efficiently', async () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        await upsertVerification({
          userId: `user${i}`,
          placeId: 'place1',
          gpsOk: true,
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // < 1 second for 100 ops
    });
  });
});

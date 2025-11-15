/**
 * Receipt Database Service Unit Tests
 * 
 * Tests all receipt database operations with mocked Prisma client
 * Uses in-memory Map for isolated testing without real database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Receipt, User, Place } from '@prisma/client';
import type { ReceiptData } from '@/lib/receipt-ocr';

// Mock Prisma Client
const mockReceipts = new Map<string, any>();
const mockUsers = new Map<string, any>();
const mockPlaces = new Map<string, any>();
let receiptIdCounter = 1;
let createdAtCounter = 0;

vi.mock('@/lib/prisma', () => ({
  prisma: {
    receipt: {
      create: vi.fn(async ({ data }) => {
        const id = `receipt-${receiptIdCounter++}`;
        // Ensure each receipt has a unique timestamp
        const createdAt = new Date(Date.now() + createdAtCounter++);
        const receipt = {
          id,
          ...data,
          createdAt,
        };
        mockReceipts.set(id, receipt);
        return receipt;
      }),

      update: vi.fn(async ({ where, data }) => {
        const receipt = mockReceipts.get(where.id);
        if (!receipt) {
          throw new Error('Receipt not found');
        }
        const updated = { ...receipt, ...data };
        mockReceipts.set(where.id, updated);
        return updated;
      }),

      findUnique: vi.fn(async ({ where, include }) => {
        const receipt = mockReceipts.get(where.id);
        if (!receipt) return null;

        if (include) {
          const user = mockUsers.get(receipt.userId);
          const place = mockPlaces.get(receipt.placeId);
          return {
            ...receipt,
            user: user ? { nickname: user.nickname } : null,
            place: place ? { name: place.name, address: place.address } : null,
          };
        }

        return receipt;
      }),

      findMany: vi.fn(async ({ where, include, orderBy, take, skip }) => {
        let results = Array.from(mockReceipts.values());

        // Filter by userId
        if (where?.userId) {
          results = results.filter((r) => r.userId === where.userId);
        }

        // Filter by placeId
        if (where?.placeId) {
          results = results.filter((r) => r.placeId === where.placeId);
        }

        // Filter by ocrStatus
        if (where?.ocrStatus) {
          results = results.filter((r) => r.ocrStatus === where.ocrStatus);
        }

        // Sort
        if (orderBy?.createdAt === 'desc') {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy?.createdAt === 'asc') {
          results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        // Pagination
        if (skip) {
          results = results.slice(skip);
        }
        if (take) {
          results = results.slice(0, take);
        }

        // Include relations
        if (include) {
          results = results.map((r) => {
            const user = mockUsers.get(r.userId);
            const place = mockPlaces.get(r.placeId);
            return {
              ...r,
              ...(include.user && user ? { user: { nickname: user.nickname } } : {}),
              ...(include.place && place ? { place: { name: place.name, address: place.address } } : {}),
            };
          });
        }

        return results;
      }),

      delete: vi.fn(async ({ where }) => {
        const receipt = mockReceipts.get(where.id);
        if (!receipt) {
          throw new Error('Receipt not found');
        }
        mockReceipts.delete(where.id);
        return receipt;
      }),

      count: vi.fn(async ({ where }) => {
        let results = Array.from(mockReceipts.values());

        if (where?.userId) {
          results = results.filter((r) => r.userId === where.userId);
        }

        if (where?.ocrStatus) {
          results = results.filter((r) => r.ocrStatus === where.ocrStatus);
        }

        return results.length;
      }),

      aggregate: vi.fn(async ({ where, _sum }) => {
        let results = Array.from(mockReceipts.values());

        if (where?.userId) {
          results = results.filter((r) => r.userId === where.userId);
        }

        if (where?.placeId) {
          results = results.filter((r) => r.placeId === where.placeId);
        }

        if (where?.ocrStatus) {
          results = results.filter((r) => r.ocrStatus === where.ocrStatus);
        }

        if (_sum?.amount) {
          const sum = results.reduce((acc, r) => acc + (r.amount || 0), 0);
          return { _sum: { amount: sum } };
        }

        return { _sum: { amount: 0 } };
      }),
    },
  },
}));

// Import after mocking
import {
  createReceipt,
  updateReceipt,
  getReceipt,
  getUserReceipts,
  getPlaceReceipts,
  getUserPlaceSpending,
  getPendingOCRReceipts,
  deleteReceipt,
  getReceiptStats,
} from '@/lib/db/receipt';

describe('Receipt Database Service', () => {
  beforeEach(() => {
    // Clear all mocks
    mockReceipts.clear();
    mockUsers.clear();
    mockPlaces.clear();
    receiptIdCounter = 1;
    createdAtCounter = 0;

    // Setup test data
    mockUsers.set('user-1', {
      id: 'user-1',
      nickname: 'TestUser',
      phoneNumber: '010-1234-5678',
      email: null,
      role: 'customer',
      createdAt: new Date(),
    });

    mockPlaces.set('place-1', {
      id: 'place-1',
      name: 'Test Cafe',
      address: '서울시 강남구',
      createdAt: new Date(),
    });
  });

  describe('createReceipt', () => {
    it('should create new receipt with OCR data', async () => {
      const ocrData: ReceiptData = {
        storeName: 'Test Cafe',
        date: new Date('2025-11-15'),
        amount: 15000,
        paymentMethod: 'card',
      };

      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 15000,
        fileKey: 'receipts/test.jpg',
        ocrData,
      });

      expect(receipt).toBeDefined();
      expect(receipt.id).toBe('receipt-1');
      expect(receipt.userId).toBe('user-1');
      expect(receipt.placeId).toBe('place-1');
      expect(receipt.amount).toBe(15000);
      expect(receipt.ocrStatus).toBe('pending');
      expect(receipt.ocrData).toEqual(ocrData);
    });

    it('should create receipt with paidAt date', async () => {
      const paidAt = new Date('2025-11-15T10:30:00Z');
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/test2.jpg',
        ocrData: { storeName: 'Test Store', amount: 20000 },
        paidAt,
      });

      expect(receipt.paidAt).toEqual(paidAt);
    });

    it('should default ocrStatus to pending', async () => {
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/test3.jpg',
        ocrData: {},
      });

      expect(receipt.ocrStatus).toBe('pending');
    });
  });

  describe('updateReceipt', () => {
    it('should update receipt OCR status', async () => {
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 15000,
        fileKey: 'receipts/test.jpg',
        ocrData: {},
      });

      const updated = await updateReceipt(receipt.id, {
        ocrStatus: 'ok',
      });

      expect(updated.ocrStatus).toBe('ok');
    });

    it('should update amount and OCR data', async () => {
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 15000,
        fileKey: 'receipts/test.jpg',
        ocrData: {},
      });

      const newOcrData: ReceiptData = {
        storeName: 'Updated Store',
        amount: 16000,
        date: new Date('2025-11-15'),
      };

      const updated = await updateReceipt(receipt.id, {
        amount: 16000,
        ocrData: newOcrData,
      });

      expect(updated.amount).toBe(16000);
      expect(updated.ocrData).toEqual(newOcrData);
    });

    it('should throw error for non-existent receipt', async () => {
      await expect(
        updateReceipt('non-existent', { ocrStatus: 'ok' })
      ).rejects.toThrow('Receipt not found');
    });
  });

  describe('getReceipt', () => {
    it('should return receipt with user and place data', async () => {
      const created = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 15000,
        fileKey: 'receipts/test.jpg',
        ocrData: {},
      });

      const receipt = await getReceipt(created.id);

      expect(receipt).toBeDefined();
      expect(receipt?.id).toBe(created.id);
      expect(receipt?.user.nickname).toBe('TestUser');
      expect(receipt?.place.name).toBe('Test Cafe');
      expect(receipt?.place.address).toBe('서울시 강남구');
    });

    it('should return null for non-existent receipt', async () => {
      const receipt = await getReceipt('non-existent');
      expect(receipt).toBeNull();
    });
  });

  describe('getUserReceipts', () => {
    beforeEach(async () => {
      // Create multiple receipts
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });
      await updateReceipt('receipt-1', { ocrStatus: 'ok' });
    });

    it('should return user receipts with place data', async () => {
      const receipts = await getUserReceipts('user-1');

      expect(receipts).toHaveLength(2);
      expect(receipts[0].place.name).toBe('Test Cafe');
    });

    it('should filter by OCR status', async () => {
      const receipts = await getUserReceipts('user-1', { ocrStatus: 'ok' });

      expect(receipts).toHaveLength(1);
      expect(receipts[0].ocrStatus).toBe('ok');
    });

    it('should support pagination', async () => {
      const receipts = await getUserReceipts('user-1', { limit: 1, offset: 0 });

      expect(receipts).toHaveLength(1);
    });

    it('should order by createdAt desc', async () => {
      const receipts = await getUserReceipts('user-1');

      expect(receipts[0].id).toBe('receipt-2');
      expect(receipts[1].id).toBe('receipt-1');
    });
  });

  describe('getPlaceReceipts', () => {
    beforeEach(async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });
    });

    it('should return place receipts with user data', async () => {
      const receipts = await getPlaceReceipts('place-1');

      expect(receipts).toHaveLength(2);
      expect(receipts[0].user.nickname).toBe('TestUser');
    });

    it('should respect limit parameter', async () => {
      const receipts = await getPlaceReceipts('place-1', 1);

      expect(receipts).toHaveLength(1);
    });
  });

  describe('getUserPlaceSpending', () => {
    beforeEach(async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });
      await updateReceipt('receipt-1', { ocrStatus: 'ok' });
      await updateReceipt('receipt-2', { ocrStatus: 'ok' });
    });

    it('should calculate total spending for user at place', async () => {
      const total = await getUserPlaceSpending('user-1', 'place-1');

      expect(total).toBe(30000);
    });

    it('should only count ok receipts', async () => {
      await updateReceipt('receipt-1', { ocrStatus: 'fail' });

      const total = await getUserPlaceSpending('user-1', 'place-1');

      expect(total).toBe(20000);
    });

    it('should return 0 for no receipts', async () => {
      const total = await getUserPlaceSpending('user-2', 'place-1');

      expect(total).toBe(0);
    });
  });

  describe('getPendingOCRReceipts', () => {
    beforeEach(async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });
      await updateReceipt('receipt-1', { ocrStatus: 'ok' });
    });

    it('should return only pending receipts', async () => {
      const pending = await getPendingOCRReceipts();

      expect(pending).toHaveLength(1);
      expect(pending[0].ocrStatus).toBe('pending');
    });

    it('should order by createdAt asc', async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 30000,
        fileKey: 'receipts/3.jpg',
        ocrData: {},
      });

      const pending = await getPendingOCRReceipts();

      expect(pending[0].id).toBe('receipt-2');
      expect(pending[1].id).toBe('receipt-3');
    });

    it('should respect limit parameter', async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 30000,
        fileKey: 'receipts/3.jpg',
        ocrData: {},
      });

      const pending = await getPendingOCRReceipts(1);

      expect(pending).toHaveLength(1);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete existing receipt', async () => {
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });

      await deleteReceipt(receipt.id);

      const found = await getReceipt(receipt.id);
      expect(found).toBeNull();
    });

    it('should throw error for non-existent receipt', async () => {
      await expect(deleteReceipt('non-existent')).rejects.toThrow(
        'Receipt not found'
      );
    });
  });

  describe('getReceiptStats', () => {
    beforeEach(async () => {
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 30000,
        fileKey: 'receipts/3.jpg',
        ocrData: {},
      });
      await updateReceipt('receipt-1', { ocrStatus: 'ok' });
      await updateReceipt('receipt-2', { ocrStatus: 'fail' });
      // receipt-3 remains pending
    });

    it('should return accurate statistics', async () => {
      const stats = await getReceiptStats('user-1');

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.ok).toBe(1);
      expect(stats.fail).toBe(1);
      expect(stats.totalAmount).toBe(10000); // Only 'ok' receipts
    });

    it('should return zeros for user with no receipts', async () => {
      const stats = await getReceiptStats('user-2');

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.ok).toBe(0);
      expect(stats.fail).toBe(0);
      expect(stats.totalAmount).toBe(0);
    });

    it('should handle user with only ok receipts', async () => {
      await updateReceipt('receipt-2', { ocrStatus: 'ok' });
      await updateReceipt('receipt-3', { ocrStatus: 'ok' });

      const stats = await getReceiptStats('user-1');

      expect(stats.total).toBe(3);
      expect(stats.ok).toBe(3);
      expect(stats.totalAmount).toBe(60000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple users correctly', async () => {
      mockUsers.set('user-2', {
        id: 'user-2',
        nickname: 'AnotherUser',
        phoneNumber: '010-9876-5432',
        email: null,
        role: 'customer',
        createdAt: new Date(),
      });

      await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 10000,
        fileKey: 'receipts/1.jpg',
        ocrData: {},
      });
      await createReceipt({
        userId: 'user-2',
        placeId: 'place-1',
        amount: 20000,
        fileKey: 'receipts/2.jpg',
        ocrData: {},
      });

      const user1Receipts = await getUserReceipts('user-1');
      const user2Receipts = await getUserReceipts('user-2');

      expect(user1Receipts).toHaveLength(1);
      expect(user2Receipts).toHaveLength(1);
    });

    it('should handle large amounts correctly', async () => {
      const largeAmount = 9999999;
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: largeAmount,
        fileKey: 'receipts/large.jpg',
        ocrData: { amount: largeAmount },
      });

      expect(receipt.amount).toBe(largeAmount);
    });

    it('should handle empty OCR data', async () => {
      const receipt = await createReceipt({
        userId: 'user-1',
        placeId: 'place-1',
        amount: 5000,
        fileKey: 'receipts/empty.jpg',
        ocrData: {},
      });

      expect(receipt.ocrData).toEqual({});
    });
  });

  describe('Performance', () => {
    it('should handle 100 receipt operations in under 1 second', async () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        await createReceipt({
          userId: 'user-1',
          placeId: 'place-1',
          amount: 10000 + i,
          fileKey: `receipts/${i}.jpg`,
          ocrData: { amount: 10000 + i },
        });
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should efficiently query stats with many receipts', async () => {
      // Create 50 receipts
      for (let i = 0; i < 50; i++) {
        await createReceipt({
          userId: 'user-1',
          placeId: 'place-1',
          amount: 10000,
          fileKey: `receipts/${i}.jpg`,
          ocrData: {},
        });
      }

      const start = Date.now();
      const stats = await getReceiptStats('user-1');
      const elapsed = Date.now() - start;

      expect(stats.total).toBe(50);
      expect(elapsed).toBeLessThan(100);
    });
  });
});

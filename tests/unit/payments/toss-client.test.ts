/**
 * Toss Payments Client Unit Tests
 * Tests Toss payment operations with mocked fetch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Import after mocking
import {
  confirmPayment,
  getPayment,
  cancelPayment,
  generateOrderId,
  calculateVAT,
  TossPaymentError,
  type TossPaymentResponse,
} from '@/lib/payments/toss-client';

describe('Toss Payments Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockResponse: TossPaymentResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORDER_123',
        orderName: 'Test Order',
        status: 'DONE',
        requestedAt: '2025-11-15T10:00:00+09:00',
        approvedAt: '2025-11-15T10:01:00+09:00',
        method: '카드',
        totalAmount: 10000,
        balanceAmount: 10000,
        suppliedAmount: 9091,
        vat: 909,
        currency: 'KRW',
        card: {
          company: '신한',
          number: '1234********5678',
          installmentPlanMonths: 0,
          isInterestFree: false,
          approveNo: '12345678',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await confirmPayment({
        paymentKey: 'test_payment_key',
        orderId: 'ORDER_123',
        amount: 10000,
      });

      expect(result.paymentKey).toBe('test_payment_key');
      expect(result.status).toBe('DONE');
      expect(result.totalAmount).toBe(10000);
    });

    it('should throw TossPaymentError on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: 'INVALID_PARAMETER',
          message: 'Invalid payment key',
        }),
      });

      await expect(
        confirmPayment({
          paymentKey: 'invalid_key',
          orderId: 'ORDER_123',
          amount: 10000,
        })
      ).rejects.toThrow(TossPaymentError);
    });

    it('should include authorization header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ paymentKey: 'test' }),
      });

      await confirmPayment({
        paymentKey: 'test',
        orderId: 'ORDER_123',
        amount: 10000,
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toMatch(/^Basic /);
    });
  });

  describe('getPayment', () => {
    it('should retrieve payment details', async () => {
      const mockResponse: TossPaymentResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORDER_123',
        orderName: 'Test Order',
        status: 'DONE',
        requestedAt: '2025-11-15T10:00:00+09:00',
        approvedAt: '2025-11-15T10:01:00+09:00',
        method: '카드',
        totalAmount: 10000,
        balanceAmount: 10000,
        suppliedAmount: 9091,
        vat: 909,
        currency: 'KRW',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPayment('test_payment_key');

      expect(result.paymentKey).toBe('test_payment_key');
      expect(result.orderId).toBe('ORDER_123');
    });

    it('should handle not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          code: 'NOT_FOUND_PAYMENT',
          message: 'Payment not found',
        }),
      });

      await expect(getPayment('non_existent')).rejects.toThrow(TossPaymentError);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment successfully', async () => {
      const mockResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORDER_123',
        status: 'CANCELED',
        canceledAt: '2025-11-15T10:05:00+09:00',
        cancelAmount: 10000,
        cancelReason: 'Customer request',
        cancels: [
          {
            cancelAmount: 10000,
            cancelReason: 'Customer request',
            canceledAt: '2025-11-15T10:05:00+09:00',
            transactionKey: 'txn_123',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cancelPayment({
        paymentKey: 'test_payment_key',
        cancelReason: 'Customer request',
      });

      expect(result.status).toBe('CANCELED');
      expect(result.cancelAmount).toBe(10000);
    });

    it('should handle partial cancel', async () => {
      const mockResponse = {
        paymentKey: 'test_payment_key',
        orderId: 'ORDER_123',
        status: 'PARTIAL_CANCELED',
        canceledAt: '2025-11-15T10:05:00+09:00',
        cancelAmount: 5000,
        cancelReason: 'Partial refund',
        cancels: [
          {
            cancelAmount: 5000,
            cancelReason: 'Partial refund',
            canceledAt: '2025-11-15T10:05:00+09:00',
            transactionKey: 'txn_123',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cancelPayment({
        paymentKey: 'test_payment_key',
        cancelReason: 'Partial refund',
        cancelAmount: 5000,
      });

      expect(result.status).toBe('PARTIAL_CANCELED');
      expect(result.cancelAmount).toBe(5000);
    });
  });

  describe('generateOrderId', () => {
    it('should generate unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ORDER_\d+_[a-z0-9]+$/i);
    });

    it('should use custom prefix', () => {
      const id = generateOrderId('CUSTOM');

      expect(id).toMatch(/^CUSTOM_\d+_[a-z0-9]+$/i);
    });

    it('should be uppercase', () => {
      const id = generateOrderId();

      expect(id).toBe(id.toUpperCase());
    });
  });

  describe('calculateVAT', () => {
    it('should calculate VAT correctly', () => {
      const result = calculateVAT(10000);

      expect(result.totalAmount).toBe(10000);
      expect(result.suppliedAmount).toBe(9090);
      expect(result.vat).toBe(910);
    });

    it('should handle different amounts', () => {
      const result = calculateVAT(50000);

      expect(result.totalAmount).toBe(50000);
      expect(result.suppliedAmount).toBe(45454);
      expect(result.vat).toBe(4546);
    });

    it('should round down supplied amount', () => {
      const result = calculateVAT(9999);

      expect(result.suppliedAmount).toBe(9090);
      expect(result.vat).toBe(909);
      expect(result.totalAmount).toBe(9999);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(
        confirmPayment({
          paymentKey: 'test',
          orderId: 'ORDER_123',
          amount: 10000,
        })
      ).rejects.toThrow(TossPaymentError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        confirmPayment({
          paymentKey: 'test',
          orderId: 'ORDER_123',
          amount: 10000,
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle large amounts', () => {
      const result = calculateVAT(999999999);

      expect(result.totalAmount).toBe(999999999);
      expect(result.suppliedAmount).toBeLessThan(result.totalAmount);
      expect(result.vat).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should generate 100 unique order IDs quickly', () => {
      const start = Date.now();
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateOrderId());
      }

      const elapsed = Date.now() - start;

      expect(ids.size).toBe(100);
      expect(elapsed).toBeLessThan(100);
    });

    it('should calculate VAT for 1000 amounts quickly', () => {
      const start = Date.now();

      for (let i = 1; i <= 1000; i++) {
        calculateVAT(i * 1000);
      }

      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });
});

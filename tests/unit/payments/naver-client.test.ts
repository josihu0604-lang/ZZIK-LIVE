/**
 * Unit Tests for Naver Pay Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  requestPayment,
  confirmPayment,
  getPayment,
  cancelPayment,
  generateMerchantPayKey,
  calculateTaxAmounts,
  generateSignature,
  verifyWebhookSignature,
  formatNaverPayDate,
  NaverPayError,
  type NaverPaymentRequest,
  type NaverPaymentConfirm,
  type NaverCancelRequest,
} from '@/lib/payments/naver-client';

// Mock fetch
global.fetch = vi.fn();

describe('Naver Pay Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Payment Request', () => {
    it('should request payment successfully', async () => {
      const mockResponse = {
        code: 'Success',
        message: 'Success',
        body: {
          paymentId: 'NPY20231115001',
          merchantPayKey: 'NPY_1234567890_abc123',
          paymentStatus: 'PAYMENT_WAITING',
          totalPayAmount: 10000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params: NaverPaymentRequest = {
        merchantPayKey: 'NPY_1234567890_abc123',
        productName: 'Test Product',
        totalPayAmount: 10000,
        taxScopeAmount: 9091,
        taxExScopeAmount: 0,
        returnUrl: 'https://example.com/return',
      };

      const result = await requestPayment(params);

      expect(result.merchantPayKey).toBe(params.merchantPayKey);
      expect(result.paymentUrl).toContain('NPY20231115001');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/v1/reserve'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Naver-Client-Id': expect.any(String),
          }),
        })
      );
    });

    it('should throw NaverPayError on API error', async () => {
      const mockError = {
        code: 'ERROR_CODE',
        message: 'Payment request failed',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      const params: NaverPaymentRequest = {
        merchantPayKey: 'NPY_1234567890_abc123',
        productName: 'Test Product',
        totalPayAmount: 10000,
        taxScopeAmount: 9091,
        taxExScopeAmount: 0,
        returnUrl: 'https://example.com/return',
      };

      await expect(requestPayment(params)).rejects.toThrow(NaverPayError);
    });

    it('should include required headers', async () => {
      const mockResponse = {
        code: 'Success',
        body: { paymentId: 'NPY20231115001' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params: NaverPaymentRequest = {
        merchantPayKey: 'NPY_1234567890_abc123',
        productName: 'Test Product',
        totalPayAmount: 10000,
        taxScopeAmount: 9091,
        taxExScopeAmount: 0,
        returnUrl: 'https://example.com/return',
      };

      await requestPayment(params);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Naver-Client-Id': expect.any(String),
            'X-Naver-Client-Secret': expect.any(String),
            'X-NaverPay-Chain-Id': expect.any(String),
            'X-NaverPay-Timestamp': expect.any(String),
            'X-NaverPay-Signature': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment successfully', async () => {
      const mockResponse = {
        code: 'Success',
        message: 'Success',
        body: {
          paymentId: 'NPY20231115001',
          merchantPayKey: 'NPY_1234567890_abc123',
          paymentStatus: 'PAYMENT_COMPLETE',
          totalPayAmount: 10000,
          primaryPayAmount: 10000,
          npointPayAmount: 0,
          giftCardAmount: 0,
          taxScopeAmount: 9091,
          taxExScopeAmount: 0,
          environmentDepositAmount: 0,
          primaryPayMeans: 'CARD',
          adminFee: 300,
          paymentDate: '20231115123045',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params: NaverPaymentConfirm = {
        paymentId: 'NPY20231115001',
      };

      const result = await confirmPayment(params);

      expect(result.body?.paymentStatus).toBe('PAYMENT_COMPLETE');
      expect(result.body?.totalPayAmount).toBe(10000);
    });

    it('should handle confirmation errors', async () => {
      const mockError = {
        code: 'INVALID_PAYMENT',
        message: 'Invalid payment ID',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      const params: NaverPaymentConfirm = {
        paymentId: 'INVALID_ID',
      };

      await expect(confirmPayment(params)).rejects.toThrow(NaverPayError);
    });
  });

  describe('Payment Retrieval', () => {
    it('should get payment details successfully', async () => {
      const mockResponse = {
        code: 'Success',
        body: {
          paymentId: 'NPY20231115001',
          merchantPayKey: 'NPY_1234567890_abc123',
          paymentStatus: 'PAYMENT_COMPLETE',
          totalPayAmount: 10000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPayment('NPY20231115001');

      expect(result.body?.paymentId).toBe('NPY20231115001');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments/v1/NPY20231115001'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle 404 for non-existent payment', async () => {
      const mockError = {
        code: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      await expect(getPayment('INVALID_ID')).rejects.toThrow(NaverPayError);
    });
  });

  describe('Payment Cancellation', () => {
    it('should cancel payment successfully', async () => {
      const mockResponse = {
        code: 'Success',
        message: 'Success',
        body: {
          paymentId: 'NPY20231115001',
          merchantPayKey: 'NPY_1234567890_abc123',
          cancelAmount: 10000,
          cancelDate: '20231115140000',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params: NaverCancelRequest = {
        paymentId: 'NPY20231115001',
        cancelAmount: 10000,
        cancelReason: 'Customer request',
        taxScopeAmount: 9091,
        taxExScopeAmount: 0,
      };

      const result = await cancelPayment(params);

      expect(result.body?.cancelAmount).toBe(10000);
      expect(result.body?.cancelDate).toBe('20231115140000');
    });

    it('should handle cancellation errors', async () => {
      const mockError = {
        code: 'CANCEL_FAILED',
        message: 'Cannot cancel completed payment',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      const params: NaverCancelRequest = {
        paymentId: 'NPY20231115001',
        cancelAmount: 10000,
        cancelReason: 'Test',
        taxScopeAmount: 9091,
        taxExScopeAmount: 0,
      };

      await expect(cancelPayment(params)).rejects.toThrow(NaverPayError);
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique merchant pay keys', () => {
      const key1 = generateMerchantPayKey('NPY');
      const key2 = generateMerchantPayKey('NPY');

      expect(key1).toMatch(/^NPY_\d+_[A-Z0-9]+$/);
      expect(key2).toMatch(/^NPY_\d+_[A-Z0-9]+$/);
      expect(key1).not.toBe(key2);
    });

    it('should calculate tax amounts correctly', () => {
      const result = calculateTaxAmounts(10000);

      expect(result.taxScopeAmount).toBe(9090); // 10000 / 1.1 = 9090.909...
      expect(result.taxExScopeAmount).toBe(0);
    });

    it('should generate HMAC signature', () => {
      const clientId = 'test_client_id';
      const clientSecret = 'test_secret';
      const timestamp = '1234567890';

      const signature = generateSignature(clientId, clientSecret, timestamp);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });

    it('should verify valid webhook signatures', () => {
      const secret = 'webhook_secret';
      const body = '{"paymentId":"NPY001","status":"COMPLETE"}';

      // Generate valid signature
      const crypto = require('crypto');
      const validSig = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const result = verifyWebhookSignature(validSig, body, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signatures', () => {
      const secret = 'webhook_secret';
      const body = '{"paymentId":"NPY001","status":"COMPLETE"}';
      const invalidSig = 'invalid_signature';

      const result = verifyWebhookSignature(invalidSig, body, secret);
      expect(result).toBe(false);
    });

    it('should format dates correctly', () => {
      const date = new Date('2023-11-15T14:30:45Z');
      const formatted = formatNaverPayDate(date);

      // Format: YYYYMMDDHHmmss
      expect(formatted).toMatch(/^\d{14}$/);
      expect(formatted.substring(0, 8)).toBe('20231115');
    });
  });

  describe('Performance', () => {
    it('should generate 1000 merchant keys quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        generateMerchantPayKey();
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // Should complete in <100ms
    });

    it('should calculate tax for 1000 amounts quickly', () => {
      const start = Date.now();
      for (let i = 1; i <= 1000; i++) {
        calculateTaxAmounts(i * 1000);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50); // Should complete in <50ms
    });
  });
});

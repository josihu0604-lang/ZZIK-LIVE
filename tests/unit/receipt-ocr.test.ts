import { describe, it, expect } from 'vitest';
import {
  extractStoreName,
  extractDate,
  extractTime,
  extractTotalAmount,
  extractPaymentMethod,
  parseReceiptData,
  validateReceiptData,
  type ReceiptData,
} from '@/lib/receipt-ocr';

describe('Receipt OCR Utilities', () => {
  describe('extractStoreName', () => {
    it('should extract store name from Korean receipt', () => {
      const text = '상호명: 스타벅스 강남점\n2024-11-15';
      expect(extractStoreName(text)).toBe('스타벅스 강남점');
    });

    it('should extract store name with pattern matching', () => {
      const text = '가게: 카페모카\n서울시 강남구';
      expect(extractStoreName(text)).toBe('카페모카');
    });

    it('should extract from first line as fallback', () => {
      const text = '롯데백화점\n서울시 중구\n2024-11-15';
      expect(extractStoreName(text)).toBe('롯데백화점');
    });

    it('should extract from brackets', () => {
      const text = '[GS25 편의점]\n영수증';
      expect(extractStoreName(text)).toBe('GS25 편의점');
    });
  });

  describe('extractDate', () => {
    it('should extract date in YYYY-MM-DD format', () => {
      const text = '2024-11-15 14:30';
      expect(extractDate(text)).toBe('2024-11-15');
    });

    it('should extract date in YYYY.MM.DD format', () => {
      const text = '2024.11.15 14:30';
      expect(extractDate(text)).toBe('2024-11-15');
    });

    it('should extract date in YYYY/MM/DD format', () => {
      const text = '2024/11/15 14:30';
      expect(extractDate(text)).toBe('2024-11-15');
    });

    it('should extract Korean date format', () => {
      const text = '2024년 11월 15일';
      expect(extractDate(text)).toBe('2024-11-15');
    });

    it('should pad single digit month/day', () => {
      const text = '2024-1-5 10:00';
      expect(extractDate(text)).toBe('2024-01-05');
    });

    it('should return undefined for no date', () => {
      const text = 'No date here';
      expect(extractDate(text)).toBeUndefined();
    });
  });

  describe('extractTime', () => {
    it('should extract time in HH:MM format', () => {
      const text = '14:30';
      expect(extractTime(text)).toBe('14:30');
    });

    it('should extract time in HH:MM:SS format', () => {
      const text = '14:30:45';
      expect(extractTime(text)).toBe('14:30:45');
    });

    it('should pad single digit hour', () => {
      const text = '9:30';
      expect(extractTime(text)).toBe('09:30');
    });

    it('should return undefined for no time', () => {
      const text = 'No time here';
      expect(extractTime(text)).toBeUndefined();
    });
  });

  describe('extractTotalAmount', () => {
    it('should extract amount with Korean label', () => {
      const text = '합계: 15,000원';
      expect(extractTotalAmount(text)).toBe(15000);
    });

    it('should extract amount with various labels', () => {
      expect(extractTotalAmount('총액: 20,000')).toBe(20000);
      expect(extractTotalAmount('총금액: 30,000')).toBe(30000);
      expect(extractTotalAmount('결제금액: 40,000')).toBe(40000);
    });

    it('should extract amount without comma', () => {
      const text = '합계: 5000원';
      expect(extractTotalAmount(text)).toBe(5000);
    });

    it('should extract amount with English label', () => {
      const text = 'Total: 25,000';
      expect(extractTotalAmount(text)).toBe(25000);
    });

    it('should return undefined for no amount', () => {
      const text = 'No amount here';
      expect(extractTotalAmount(text)).toBeUndefined();
    });

    it('should ignore invalid amounts', () => {
      const text = '합계: 0원';
      expect(extractTotalAmount(text)).toBeUndefined();
    });
  });

  describe('extractPaymentMethod', () => {
    it('should extract credit card method', () => {
      const text = '결제 방법: 신용카드';
      expect(extractPaymentMethod(text)).toBe('신용카드');
    });

    it('should extract cash method', () => {
      const text = '결제: 현금';
      expect(extractPaymentMethod(text)).toBe('현금');
    });

    it('should extract English payment method', () => {
      const text = 'Payment: Card';
      expect(extractPaymentMethod(text)).toBe('card');
    });

    it('should return undefined for no payment method', () => {
      const text = 'No payment method';
      expect(extractPaymentMethod(text)).toBeUndefined();
    });
  });

  describe('parseReceiptData', () => {
    it('should parse complete receipt data', () => {
      const text = `
        스타벅스 강남점
        2024-11-15 14:30
        합계: 15,000원
        신용카드
      `;

      const receipt = parseReceiptData(text, 85);

      expect(receipt.storeName).toBe('스타벅스 강남점');
      expect(receipt.date).toBe('2024-11-15');
      expect(receipt.time).toBe('14:30');
      expect(receipt.totalAmount).toBe(15000);
      expect(receipt.paymentMethod).toBe('신용카드');
      expect(receipt.confidence).toBe(85);
      expect(receipt.rawText).toBe(text);
    });

    it('should handle partial data', () => {
      const text = '가게 이름\n합계: 5000원';
      const receipt = parseReceiptData(text, 70);

      expect(receipt.storeName).toBe('가게 이름');
      expect(receipt.totalAmount).toBe(5000);
      expect(receipt.date).toBeUndefined();
      expect(receipt.confidence).toBe(70);
    });
  });

  describe('validateReceiptData', () => {
    const validReceipt: ReceiptData = {
      storeName: '스타벅스',
      date: '2024-11-15',
      totalAmount: 15000,
      paymentMethod: '신용카드',
      confidence: 85,
      rawText: 'test',
    };

    it('should validate correct receipt', () => {
      const result = validateReceiptData(validReceipt, {
        minConfidence: 70,
        minAmount: 10000,
        maxAmount: 50000,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on low confidence', () => {
      const lowConfidenceReceipt = { ...validReceipt, confidence: 50 };
      const result = validateReceiptData(lowConfidenceReceipt, {
        minConfidence: 70,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('OCR confidence too low'))).toBe(true);
    });

    it('should fail on store name mismatch', () => {
      const result = validateReceiptData(validReceipt, {
        requiredStoreName: '투썸플레이스',
        minConfidence: 70, // Prevent confidence error
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Store name mismatch'))).toBe(true);
    });

    it('should fail on amount too low', () => {
      const result = validateReceiptData(validReceipt, {
        minAmount: 20000,
        minConfidence: 70,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Amount too low'))).toBe(true);
    });

    it('should fail on amount too high', () => {
      const result = validateReceiptData(validReceipt, {
        maxAmount: 10000,
        minConfidence: 70,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Amount too high'))).toBe(true);
    });

    it('should fail on date mismatch', () => {
      const result = validateReceiptData(validReceipt, {
        requiredDate: '2024-11-16',
        minConfidence: 70,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Date mismatch'))).toBe(true);
    });

    it('should add warnings for missing data', () => {
      const incompleteReceipt: ReceiptData = {
        confidence: 85,
        rawText: 'test',
      };

      const result = validateReceiptData(incompleteReceipt, {});

      expect(result.warnings).toContain('Store name not detected');
      expect(result.warnings).toContain('Total amount not detected');
      expect(result.warnings).toContain('Date not detected');
    });

    it('should validate with partial requirements', () => {
      const result = validateReceiptData(validReceipt, {
        minConfidence: 70,
      });

      expect(result.isValid).toBe(true);
    });

    it('should use default minimum confidence', () => {
      const lowConfidenceReceipt = { ...validReceipt, confidence: 65 };
      const result = validateReceiptData(lowConfidenceReceipt, {});

      expect(result.isValid).toBe(false); // Default is 70%
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const receipt = parseReceiptData('', 0);
      expect(receipt.storeName).toBeUndefined();
      expect(receipt.date).toBeUndefined();
      expect(receipt.totalAmount).toBeUndefined();
    });

    it('should handle special characters in store name', () => {
      const text = '상호명: (주)카페&바';
      expect(extractStoreName(text)).toBe('(주)카페&바');
    });

    it('should handle multiple date formats in same text', () => {
      const text = '2024-11-15 (2024.11.15)';
      expect(extractDate(text)).toBe('2024-11-15'); // First match
    });

    it('should handle very large amounts', () => {
      const text = '합계: 1,234,567,890원';
      expect(extractTotalAmount(text)).toBe(1234567890);
    });

    it('should handle Korean and English mixed text', () => {
      const text = 'Store Name: 카페모카\nTotal: 10,000원';
      const receipt = parseReceiptData(text, 80);
      expect(receipt.storeName).toBeTruthy();
      expect(receipt.totalAmount).toBe(10000);
    });
  });

  describe('Performance', () => {
    it('should parse large receipt text quickly', () => {
      const largeText = '가게 이름\n'.repeat(100) + '합계: 50,000원';
      const start = performance.now();
      parseReceiptData(largeText, 75);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // < 10ms
    });

    it('should validate quickly', () => {
      const receipt: ReceiptData = {
        storeName: '테스트',
        date: '2024-11-15',
        totalAmount: 10000,
        confidence: 80,
        rawText: 'test',
      };

      const start = performance.now();
      validateReceiptData(receipt, {
        minConfidence: 70,
        minAmount: 5000,
        maxAmount: 50000,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5); // < 5ms
    });
  });
});

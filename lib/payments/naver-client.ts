/**
 * Naver Pay API Client
 * Documentation: https://developer.pay.naver.com/docs/v2/api
 * 
 * @package server-only - Uses API secrets
 */

import 'server-only';
import crypto from 'crypto';

// Naver Pay API Configuration
const NAVER_API_BASE = process.env.NAVER_PAY_API_BASE || 'https://dev.apis.naver.com/naverpay-partner/naverpay/v2.1';
const NAVER_CLIENT_ID = process.env.NAVER_PAY_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_PAY_CLIENT_SECRET || '';
const NAVER_CHAIN_ID = process.env.NAVER_PAY_CHAIN_ID || '';

// Payment Status Types
export type NaverPayStatus =
  | 'PAYMENT_WAITING'      // 결제 대기
  | 'PAYMENT_COMPLETE'     // 결제 완료
  | 'PURCHASER_CONFIRM'    // 구매 확정
  | 'PAYMENT_CANCEL'       // 결제 취소
  | 'REFUND';              // 환불

// Payment Request Interface
export interface NaverPaymentRequest {
  merchantPayKey: string;          // 가맹점 주문 번호 (unique)
  productName: string;             // 상품명
  totalPayAmount: number;          // 총 결제 금액
  taxScopeAmount: number;          // 과세 금액
  taxExScopeAmount: number;        // 비과세 금액
  returnUrl: string;               // 결제 완료 후 리턴 URL
  productCount?: number;           // 상품 개수
  merchantUserKey?: string;        // 가맹점 회원 ID
  useCfmYmdt?: string;            // 이용 완료 일시 (YYYYMMDDHHmmss)
}

// Payment Confirm Interface
export interface NaverPaymentConfirm {
  paymentId: string;               // 네이버페이 결제 번호
}

// Payment Cancel Request
export interface NaverCancelRequest {
  paymentId: string;               // 네이버페이 결제 번호
  cancelAmount: number;            // 취소 금액
  cancelReason: string;            // 취소 사유
  taxScopeAmount: number;          // 과세 취소 금액
  taxExScopeAmount: number;        // 비과세 취소 금액
}

// Payment Response Interface
export interface NaverPaymentResponse {
  code: string;                    // 응답 코드
  message: string;                 // 응답 메시지
  body?: {
    paymentId: string;             // 네이버페이 결제 번호
    merchantPayKey: string;        // 가맹점 주문 번호
    merchantUserKey?: string;      // 가맹점 회원 ID
    paymentStatus: NaverPayStatus; // 결제 상태
    totalPayAmount: number;        // 총 결제 금액
    primaryPayAmount: number;      // 주 결제 수단 금액
    npointPayAmount: number;       // 네이버페이 포인트 결제 금액
    giftCardAmount: number;        // 상품권 결제 금액
    taxScopeAmount: number;        // 과세 금액
    taxExScopeAmount: number;      // 비과세 금액
    environmentDepositAmount: number; // 환경부담금
    primaryPayMeans: string;       // 주 결제 수단
    adminFee: number;              // 결제 수수료
    paymentDate: string;           // 결제 일시 (YYYYMMDDHHmmss)
    useCfmYmdt?: string;          // 이용 완료 일시
    [key: string]: any;
  };
}

// Cancel Response Interface
export interface NaverCancelResponse {
  code: string;
  message: string;
  body?: {
    paymentId: string;
    merchantPayKey: string;
    cancelAmount: number;
    cancelDate: string;            // YYYYMMDDHHmmss
    [key: string]: any;
  };
}

// Custom Error Class
export class NaverPayError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'NaverPayError';
  }
}

/**
 * Generate OAuth signature for Naver Pay API
 */
export function generateSignature(
  clientId: string,
  clientSecret: string,
  timestamp: string
): string {
  const message = `${clientId}_${timestamp}`;
  return crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('base64');
}

/**
 * Make authenticated request to Naver Pay API
 */
async function naverRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const timestamp = Date.now().toString();
  const signature = generateSignature(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, timestamp);

  const url = `${NAVER_API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    'X-NaverPay-Chain-Id': NAVER_CHAIN_ID,
    'X-NaverPay-Timestamp': timestamp,
    'X-NaverPay-Signature': signature,
    ...((options.headers || {}) as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Naver Pay uses 'code' field for error codes
  if (data.code !== 'Success' && data.code !== '0000') {
    throw new NaverPayError(
      data.code || 'UNKNOWN_ERROR',
      data.message || 'Unknown Naver Pay error',
      response.status
    );
  }

  return data as T;
}

/**
 * Request payment (Step 1: Create payment request)
 * Returns payment URL for user redirection
 */
export async function requestPayment(
  params: NaverPaymentRequest
): Promise<{ paymentUrl: string; merchantPayKey: string }> {
  const response = await naverRequest<NaverPaymentResponse>('/payments/v1/reserve', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.body?.paymentId) {
    throw new NaverPayError(
      'PAYMENT_REQUEST_FAILED',
      'Failed to get payment ID from Naver Pay'
    );
  }

  // Construct payment URL
  const paymentUrl = `https://order.pay.naver.com/home?${new URLSearchParams({
    paymentId: response.body.paymentId,
    merchantPayKey: params.merchantPayKey,
  }).toString()}`;

  return {
    paymentUrl,
    merchantPayKey: params.merchantPayKey,
  };
}

/**
 * Confirm payment (Step 2: After user completes payment)
 */
export async function confirmPayment(
  params: NaverPaymentConfirm
): Promise<NaverPaymentResponse> {
  return await naverRequest<NaverPaymentResponse>(
    `/payments/v1/approval`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string): Promise<NaverPaymentResponse> {
  return await naverRequest<NaverPaymentResponse>(
    `/payments/v1/${paymentId}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Cancel payment (full or partial)
 */
export async function cancelPayment(
  params: NaverCancelRequest
): Promise<NaverCancelResponse> {
  return await naverRequest<NaverCancelResponse>(
    `/payments/v1/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
}

/**
 * Generate merchant payment key (order ID)
 */
export function generateMerchantPayKey(prefix: string = 'NPY'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Calculate tax amounts from total
 * Naver Pay requires separate tax/non-tax amounts
 */
export function calculateTaxAmounts(totalAmount: number): {
  taxScopeAmount: number;
  taxExScopeAmount: number;
} {
  // Assuming 10% VAT (Korean standard)
  const taxScopeAmount = Math.floor(totalAmount / 1.1);
  const vat = totalAmount - taxScopeAmount;
  
  return {
    taxScopeAmount,
    taxExScopeAmount: 0, // No tax-exempt items by default
  };
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Format date for Naver Pay API (YYYYMMDDHHmmss)
 */
export function formatNaverPayDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

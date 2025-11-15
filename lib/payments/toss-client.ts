/**
 * Toss Payments API Client
 * Documentation: https://docs.tosspayments.com/reference
 * 
 * @package server-only - Uses API secrets
 */

import 'server-only';

// Toss Payments API Configuration
const TOSS_API_BASE = 'https://api.tosspayments.com/v1';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || '';

// Payment Status Types
export type PaymentStatus = 
  | 'READY'           // 결제 준비
  | 'IN_PROGRESS'     // 결제 진행 중
  | 'WAITING_FOR_DEPOSIT' // 입금 대기
  | 'DONE'            // 결제 완료
  | 'CANCELED'        // 결제 취소
  | 'PARTIAL_CANCELED' // 부분 취소
  | 'ABORTED'         // 결제 승인 실패
  | 'EXPIRED';        // 결제 만료

// Payment Method Types
export type PaymentMethod =
  | '카드'            // 신용카드
  | '가상계좌'         // 가상계좌
  | '간편결제'         // 간편결제
  | '휴대폰'          // 휴대폰 결제
  | '계좌이체'         // 계좌이체
  | '문화상품권'       // 문화상품권
  | '도서문화상품권'   // 도서문화상품권
  | '게임문화상품권';  // 게임문화상품권

// Payment Request Interface
export interface TossPaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  failUrl: string;
  metadata?: Record<string, any>;
}

// Payment Confirm Interface
export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

// Payment Response Interface
export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: PaymentStatus;
  requestedAt: string;
  approvedAt?: string;
  method: PaymentMethod;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  currency: string;
  receipt?: {
    url: string;
  };
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
  };
  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    customerName: string;
    dueDate: string;
  };
  transfer?: {
    bankCode: string;
    settlementStatus: string;
  };
  failure?: {
    code: string;
    message: string;
  };
}

// Cancel Request Interface
export interface TossCancelRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
  refundReceiveAccount?: {
    bank: string;
    accountNumber: string;
    holderName: string;
  };
}

// Cancel Response Interface
export interface TossCancelResponse {
  paymentKey: string;
  orderId: string;
  status: PaymentStatus;
  canceledAt: string;
  cancelAmount: number;
  cancelReason: string;
  cancels: Array<{
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
    transactionKey: string;
  }>;
}

/**
 * Create Authorization Header (Base64 encoded secret key)
 */
function getAuthHeader(): string {
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Make API Request to Toss Payments
 */
async function tossRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${TOSS_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new TossPaymentError(
      data.code || 'UNKNOWN_ERROR',
      data.message || 'Unknown error occurred',
      response.status
    );
  }

  return data as T;
}

/**
 * Custom Error Class for Toss Payments
 */
export class TossPaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'TossPaymentError';
  }
}

/**
 * Confirm Payment (승인)
 * This is the main step after user completes payment on Toss checkout
 */
export async function confirmPayment(
  params: TossPaymentConfirm
): Promise<TossPaymentResponse> {
  return await tossRequest<TossPaymentResponse>('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get Payment Details (조회)
 */
export async function getPayment(
  paymentKey: string
): Promise<TossPaymentResponse> {
  return await tossRequest<TossPaymentResponse>(
    `/payments/${paymentKey}`,
    { method: 'GET' }
  );
}

/**
 * Get Payment by Order ID
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<TossPaymentResponse> {
  return await tossRequest<TossPaymentResponse>(
    `/payments/orders/${orderId}`,
    { method: 'GET' }
  );
}

/**
 * Cancel Payment (취소/환불)
 */
export async function cancelPayment(
  params: TossCancelRequest
): Promise<TossCancelResponse> {
  const { paymentKey, ...body } = params;
  
  return await tossRequest<TossCancelResponse>(
    `/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

/**
 * Partial Cancel (부분 취소)
 */
export async function partialCancelPayment(
  paymentKey: string,
  cancelAmount: number,
  cancelReason: string
): Promise<TossCancelResponse> {
  return await cancelPayment({
    paymentKey,
    cancelAmount,
    cancelReason,
  });
}

/**
 * Get Transaction List
 */
export async function getTransactions(params: {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startingAfter?: string;
  limit?: number;
}): Promise<{ transactions: TossPaymentResponse[] }> {
  const query = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.startingAfter && { startingAfter: params.startingAfter }),
    ...(params.limit && { limit: params.limit.toString() }),
  });

  return await tossRequest<{ transactions: TossPaymentResponse[] }>(
    `/transactions?${query}`,
    { method: 'GET' }
  );
}

/**
 * Verify Webhook Signature (for security)
 */
export function verifyWebhookSignature(
  signature: string | null,
  payload: string,
  secret: string
): boolean {
  if (!signature) return false;

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * Get Client Key (for frontend)
 */
export function getClientKey(): string {
  return TOSS_CLIENT_KEY;
}

/**
 * Generate Order ID (고유한 주문 ID 생성)
 */
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Calculate VAT (부가세 계산)
 * VAT is 10% in Korea
 */
export function calculateVAT(amount: number): {
  suppliedAmount: number;
  vat: number;
  totalAmount: number;
} {
  const suppliedAmount = Math.floor(amount / 1.1);
  const vat = amount - suppliedAmount;
  
  return {
    suppliedAmount,
    vat,
    totalAmount: amount,
  };
}

/**
 * Receipt Database Service
 * Handles OCR receipt data persistence
 */

import { prisma } from '@/lib/prisma';
import type { Receipt } from '@prisma/client';
import type { ReceiptData } from '@/lib/receipt-ocr';

export interface CreateReceiptInput {
  userId: string;
  placeId: string;
  amount: number;
  fileKey: string;
  ocrData: ReceiptData;
  paidAt?: Date;
}

export interface UpdateReceiptInput {
  ocrStatus?: 'pending' | 'ok' | 'fail';
  amount?: number;
  ocrData?: ReceiptData;
  paidAt?: Date;
}

/**
 * Create receipt record
 */
export async function createReceipt(
  input: CreateReceiptInput
): Promise<Receipt> {
  const { ocrData, ...data } = input;

  return await prisma.receipt.create({
    data: {
      ...data,
      ocrStatus: 'pending',
      ocrData: ocrData as any, // Prisma Json type
    },
  });
}

/**
 * Update receipt OCR status and data
 */
export async function updateReceipt(
  receiptId: string,
  input: UpdateReceiptInput
): Promise<Receipt> {
  const { ocrData, ...data } = input;

  return await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      ...data,
      ...(ocrData ? { ocrData: ocrData as any } : {}),
    },
  });
}

/**
 * Get receipt by ID with related data
 */
export async function getReceipt(
  receiptId: string
): Promise<
  | (Receipt & {
      user: { nickname: string };
      place: { name: string; address: string | null };
    })
  | null
> {
  return await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      user: {
        select: { nickname: true },
      },
      place: {
        select: { name: true, address: true },
      },
    },
  });
}

/**
 * Get user receipts with pagination
 */
export async function getUserReceipts(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    ocrStatus?: 'pending' | 'ok' | 'fail';
  } = {}
): Promise<
  Array<
    Receipt & {
      place: { name: string; address: string | null };
    }
  >
> {
  const { limit = 10, offset = 0, ocrStatus } = options;

  return await prisma.receipt.findMany({
    where: {
      userId,
      ...(ocrStatus ? { ocrStatus } : {}),
    },
    include: {
      place: {
        select: { name: true, address: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get receipts for place (admin/analytics)
 */
export async function getPlaceReceipts(
  placeId: string,
  limit: number = 50
): Promise<
  Array<
    Receipt & {
      user: { nickname: string };
    }
  >
> {
  return await prisma.receipt.findMany({
    where: { placeId },
    include: {
      user: {
        select: { nickname: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Calculate total spending for user at place
 */
export async function getUserPlaceSpending(
  userId: string,
  placeId: string
): Promise<number> {
  const result = await prisma.receipt.aggregate({
    where: {
      userId,
      placeId,
      ocrStatus: 'ok',
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
}

/**
 * Get pending OCR receipts (for batch processing)
 */
export async function getPendingOCRReceipts(
  limit: number = 10
): Promise<Receipt[]> {
  return await prisma.receipt.findMany({
    where: {
      ocrStatus: 'pending',
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Delete receipt (for cleanup/testing)
 */
export async function deleteReceipt(receiptId: string): Promise<void> {
  await prisma.receipt.delete({
    where: { id: receiptId },
  });
}

/**
 * Get receipt statistics for user
 */
export async function getReceiptStats(userId: string): Promise<{
  total: number;
  pending: number;
  ok: number;
  fail: number;
  totalAmount: number;
}> {
  const [total, pending, ok, fail, sumResult] = await Promise.all([
    prisma.receipt.count({ where: { userId } }),
    prisma.receipt.count({ where: { userId, ocrStatus: 'pending' } }),
    prisma.receipt.count({ where: { userId, ocrStatus: 'ok' } }),
    prisma.receipt.count({ where: { userId, ocrStatus: 'fail' } }),
    prisma.receipt.aggregate({
      where: { userId, ocrStatus: 'ok' },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    pending,
    ok,
    fail,
    totalAmount: sumResult._sum.amount ?? 0,
  };
}

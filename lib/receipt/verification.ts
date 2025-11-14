// lib/receipt/verification.ts
import 'server-only';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Verification states matching Receipt.ocrStatus
export type ReceiptVerificationState = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReceiptVerificationResult {
  state: ReceiptVerificationState;
  message?: string;
  ocrData?: {
    total?: number;
    items?: Array<{ name: string; price: number }>;
    date?: string;
    merchantName?: string;
  };
  confidence?: number;
}

export interface VerifyReceiptParams {
  userId: string;
  placeId: string;
  mediaUrl: string;
  expectedTotal?: number;
}

/**
 * Generate hash for receipt deduplication
 * Based on mediaUrl to prevent duplicate submissions
 */
function generateReceiptHash(mediaUrl: string): string {
  return createHash('sha256').update(mediaUrl).digest('hex');
}

/**
 * Mock OCR function - replace with actual OCR service
 * In production, this would call Google Vision API, AWS Textract, etc.
 */
async function performOCR(mediaUrl: string): Promise<{
  total?: number;
  items?: Array<{ name: string; price: number }>;
  date?: string;
  merchantName?: string;
  confidence: number;
}> {
  // Simulate OCR processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock OCR result
  // In production, this would:
  // 1. Download image from mediaUrl
  // 2. Send to OCR service
  // 3. Parse structured data from OCR response
  // 4. Validate fields (total, date, merchant name)
  
  return {
    total: 15000, // Mock total in KRW
    items: [
      { name: '아메리카노', price: 4500 },
      { name: '카페라떼', price: 5000 },
      { name: '케이크', price: 5500 },
    ],
    date: new Date().toISOString().split('T')[0],
    merchantName: 'Sample Cafe',
    confidence: 0.95, // 95% confidence
  };
}

/**
 * Verify receipt with idempotent 4-state management and OCR caching
 * 
 * Flow:
 * 1. Check if receipt already exists (deduplication by mediaUrl hash)
 * 2. Create receipt record in 'pending' state
 * 3. Atomically transition to 'processing'
 * 4. Perform OCR (if not cached)
 * 5. Validate OCR results against expected values
 * 6. Atomically transition to 'completed' or 'failed'
 * 
 * @param params - Receipt verification parameters
 * @returns Verification result with OCR data
 */
export async function verifyReceipt(
  params: VerifyReceiptParams
): Promise<ReceiptVerificationResult> {
  const { userId, placeId, mediaUrl, expectedTotal } = params;
  const mediaHash = generateReceiptHash(mediaUrl);

  try {
    // Step 1: Check for existing receipt (idempotency)
    const existing = await prisma.receipt.findFirst({
      where: {
        userId,
        placeId,
        mediaUrl,
      },
      orderBy: { createdAt: 'desc' },
    });

    // If receipt already processed, return cached result
    if (existing && (existing.ocrStatus === 'completed' || existing.ocrStatus === 'failed')) {
      return {
        state: existing.ocrStatus as ReceiptVerificationState,
        ocrData: existing.ocrData as any,
        confidence: existing.ocrData ? (existing.ocrData as any).confidence : undefined,
      };
    }

    // Step 2: Create or update receipt record
    let receipt = existing;
    
    if (!receipt) {
      // Create new receipt
      receipt = await prisma.receipt.create({
        data: {
          userId,
          placeId,
          mediaUrl,
          total: 0, // Will be updated after OCR
          paidAt: new Date(), // Will be updated from OCR date
          ocrStatus: 'pending',
        },
      });
    }

    // Step 3: Atomically transition to 'processing'
    receipt = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { ocrStatus: 'processing' },
    });

    // Step 4: Perform OCR
    let ocrResult;
    try {
      ocrResult = await performOCR(mediaUrl);
    } catch (ocrError: any) {
      // OCR failed
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          ocrStatus: 'failed',
          ocrData: { error: ocrError.message },
        },
      });

      return {
        state: 'failed',
        message: 'OCR processing failed',
      };
    }

    // Step 5: Validate OCR results
    const validationErrors: string[] = [];

    if (!ocrResult.total || ocrResult.total <= 0) {
      validationErrors.push('Invalid or missing total amount');
    }

    if (expectedTotal && Math.abs(ocrResult.total - expectedTotal) > 1000) {
      validationErrors.push(
        `Total mismatch: OCR=${ocrResult.total}, Expected=${expectedTotal}`
      );
    }

    if (ocrResult.confidence < 0.7) {
      validationErrors.push(`Low OCR confidence: ${ocrResult.confidence}`);
    }

    // Step 6: Update receipt with OCR results
    if (validationErrors.length > 0) {
      // Validation failed
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          ocrStatus: 'failed',
          ocrData: {
            ...ocrResult,
            validationErrors,
          },
        },
      });

      return {
        state: 'failed',
        message: validationErrors.join('; '),
        ocrData: ocrResult,
        confidence: ocrResult.confidence,
      };
    }

    // Success
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        ocrStatus: 'completed',
        total: ocrResult.total,
        paidAt: ocrResult.date ? new Date(ocrResult.date) : new Date(),
        ocrData: ocrResult,
      },
    });

    return {
      state: 'completed',
      ocrData: ocrResult,
      confidence: ocrResult.confidence,
    };
  } catch (error: any) {
    console.error('Receipt verification error:', error);

    return {
      state: 'failed',
      message: 'Verification error',
    };
  }
}

/**
 * Get receipt verification history for a user
 * @param userId - User ID
 * @param limit - Maximum number of records to return
 * @returns Array of receipt records
 */
export async function getReceiptHistory(userId: string, limit: number = 50) {
  return prisma.receipt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      place: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });
}

/**
 * Clean up old failed/pending receipts (run periodically)
 * Removes receipts that have been in pending/processing state for >1 hour
 */
export async function cleanupStaleReceipts(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.receipt.updateMany({
    where: {
      ocrStatus: { in: ['pending', 'processing'] },
      createdAt: { lt: oneHourAgo },
    },
    data: {
      ocrStatus: 'failed',
      ocrData: { error: 'Processing timeout' },
    },
  });

  return result.count;
}
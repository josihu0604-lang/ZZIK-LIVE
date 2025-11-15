/**
 * Verification Database Service
 * Handles triple verification (GPS + QR + Receipt) persistence
 */

import { prisma } from '@/lib/prisma';
import type { Verification } from '@prisma/client';

export interface CreateVerificationInput {
  userId: string;
  placeId: string;
  gpsOk?: boolean;
  qrOk?: boolean;
  receiptOk?: boolean;
}

export interface UpdateVerificationInput {
  gpsOk?: boolean;
  qrOk?: boolean;
  receiptOk?: boolean;
}

/**
 * Create or update verification record
 * Uses upsert for idempotent operations
 */
export async function upsertVerification(
  input: CreateVerificationInput
): Promise<Verification> {
  const { userId, placeId, ...data } = input;

  return await prisma.verification.upsert({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      userId,
      placeId,
      gpsOk: data.gpsOk ?? false,
      qrOk: data.qrOk ?? false,
      receiptOk: data.receiptOk ?? false,
    },
  });
}

/**
 * Get verification status for user at place
 */
export async function getVerification(
  userId: string,
  placeId: string
): Promise<Verification | null> {
  return await prisma.verification.findUnique({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
  });
}

/**
 * Check if all verification steps are complete
 */
export async function isFullyVerified(
  userId: string,
  placeId: string
): Promise<boolean> {
  const verification = await getVerification(userId, placeId);

  if (!verification) return false;

  return verification.gpsOk && verification.qrOk && verification.receiptOk;
}

/**
 * Get verification progress (0-100%)
 */
export async function getVerificationProgress(
  userId: string,
  placeId: string
): Promise<number> {
  const verification = await getVerification(userId, placeId);

  if (!verification) return 0;

  let completed = 0;
  if (verification.gpsOk) completed++;
  if (verification.qrOk) completed++;
  if (verification.receiptOk) completed++;

  return Math.round((completed / 3) * 100);
}

/**
 * Get all verifications for user (with place details)
 */
export async function getUserVerifications(
  userId: string,
  limit: number = 10
): Promise<Array<Verification & { place: { name: string; address: string | null } }>> {
  return await prisma.verification.findMany({
    where: { userId },
    include: {
      place: {
        select: {
          name: true,
          address: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}

/**
 * Delete verification (for cleanup/testing)
 */
export async function deleteVerification(
  userId: string,
  placeId: string
): Promise<void> {
  await prisma.verification.delete({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
  });
}

/**
 * Count completed verifications for user
 */
export async function countCompletedVerifications(
  userId: string
): Promise<number> {
  return await prisma.verification.count({
    where: {
      userId,
      gpsOk: true,
      qrOk: true,
      receiptOk: true,
    },
  });
}

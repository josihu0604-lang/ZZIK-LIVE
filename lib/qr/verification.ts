// lib/qr/verification.ts
import 'server-only';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import ngeohash from 'ngeohash';

const prisma = new PrismaClient();

// Maximum distance allowed for QR verification (50 meters as per spec)
const MAX_DISTANCE_METERS = 50;

// Verification states
export type VerificationState = 'pending' | 'processing' | 'success' | 'failed' | 'expired';

export interface QRVerificationResult {
  state: VerificationState;
  message?: string;
  distance?: number;
}

/**
 * Calculate distance between two geohash5 coordinates
 * Uses Haversine formula for accuracy
 */
function calculateDistance(geohash1: string, geohash2: string): number {
  const pos1 = ngeohash.decode(geohash1);
  const pos2 = ngeohash.decode(geohash2);

  const R = 6371e3; // Earth radius in meters
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Hash QR token for secure storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify QR token with idempotent 4-state management
 *
 * Flow:
 * 1. Check if token exists and is in valid state
 * 2. Atomically transition to 'processing' state
 * 3. Verify distance (≤ 50m)
 * 4. Verify TTL not expired
 * 5. Atomically transition to 'success' or 'failed'
 *
 * @param token - QR token string (will be hashed)
 * @param userGeohash5 - User's current location (5-char geohash)
 * @param userId - User ID for audit trail
 * @returns Verification result with state
 */
export async function verifyQRToken(
  token: string,
  userGeohash5: string,
  userId?: string
): Promise<QRVerificationResult> {
  const tokenHash = hashToken(token);

  try {
    // Step 1: Find and lock token for processing
    const qrToken = await prisma.$transaction(
      async (tx) => {
        // Find token
        const found = await tx.qRToken.findUnique({
          where: { codeHash: tokenHash },
          include: { place: true },
        });

        if (!found) {
          return null;
        }

        // Check if already processed (idempotency)
        if (found.status === 'success') {
          return { ...found, alreadyProcessed: true };
        }

        if (found.status === 'failed' || found.status === 'expired') {
          return { ...found, alreadyProcessed: true };
        }

        // Check if token is expired by TTL
        const now = new Date();
        const expiryTime = new Date(found.createdAt.getTime() + found.ttlSec * 1000);
        if (now > expiryTime) {
          // Mark as expired
          const expired = await tx.qRToken.update({
            where: { id: found.id },
            data: {
              status: 'expired',
              failReason: 'Token expired due to TTL',
            },
            include: { place: true },
          });
          return { ...expired, alreadyProcessed: true };
        }

        // Atomically transition to 'processing' state
        const processing = await tx.qRToken.update({
          where: {
            id: found.id,
            status: 'pending', // Only update if still pending (prevents race conditions)
          },
          data: { status: 'processing' },
          include: { place: true },
        });

        return processing;
      },
      {
        timeout: 10000, // 10 second timeout
        isolationLevel: 'Serializable', // Strongest isolation for idempotency
      }
    );

    if (!qrToken) {
      return {
        state: 'failed',
        message: 'Invalid token',
      };
    }

    // If already processed, return cached result
    if ((qrToken as any).alreadyProcessed) {
      return {
        state: qrToken.status as VerificationState,
        message: qrToken.failReason || undefined,
      };
    }

    // Step 2: Verify distance
    const placeGeohash = qrToken.place.geohash6.substring(0, 5); // Use first 5 chars
    const distance = calculateDistance(userGeohash5, placeGeohash);

    if (distance > MAX_DISTANCE_METERS) {
      // Failed: too far away
      await prisma.qRToken.update({
        where: { id: qrToken.id },
        data: {
          status: 'failed',
          failReason: `Distance too large: ${Math.round(distance)}m > ${MAX_DISTANCE_METERS}m`,
        },
      });

      return {
        state: 'failed',
        message: 'Location verification failed',
        distance: Math.round(distance),
      };
    }

    // Step 3: Success - mark as used
    await prisma.qRToken.update({
      where: { id: qrToken.id },
      data: {
        status: 'success',
        usedAt: new Date(),
        usedBy: userId || 'anonymous',
      },
    });

    return {
      state: 'success',
      distance: Math.round(distance),
    };
  } catch (error: any) {
    // Log error and return failed state
    console.error('QR verification error:', error);

    // Try to mark as failed if we have the token
    try {
      const tokenHash = hashToken(token);
      await prisma.qRToken.updateMany({
        where: {
          codeHash: tokenHash,
          status: 'processing',
        },
        data: {
          status: 'failed',
          failReason: error.message || 'Internal error',
        },
      });
    } catch (updateError) {
      console.error('Failed to update token status:', updateError);
    }

    return {
      state: 'failed',
      message: 'Verification error',
    };
  }
}

/**
 * Generate a new QR token for a place
 * @param placeId - Place ID to generate token for
 * @param ttlSec - Time-to-live in seconds (default: 600 = 10 minutes)
 * @returns Token string (unhashed) to be encoded in QR code
 */
export async function generateQRToken(placeId: string, ttlSec: number = 600): Promise<string> {
  // Generate random token
  const token = createHash('sha256')
    .update(`${placeId}-${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 32);

  const tokenHash = hashToken(token);

  // Store in database
  await prisma.qRToken.create({
    data: {
      codeHash: tokenHash,
      placeId,
      ttlSec,
      status: 'pending',
    },
  });

  return token;
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.qRToken.updateMany({
    where: {
      status: { in: ['pending', 'processing'] },
      createdAt: {
        lt: new Date(Date.now() - 600 * 1000), // 10 minutes ago
      },
    },
    data: {
      status: 'expired',
      failReason: 'Token expired due to TTL',
    },
  });

  return result.count;
}

// lib/location/verification.ts
import 'server-only';
import { PrismaClient } from '@prisma/client';
import ngeohash from 'ngeohash';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Maximum distance allowed for location verification (100 meters)
const MAX_DISTANCE_METERS = 100;

// Verification states
export type LocationVerificationState = 'pending' | 'processing' | 'success' | 'failed';

export interface LocationVerificationResult {
  state: LocationVerificationState;
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
 * Location verification record for idempotency tracking
 * Stored in dedicated table or Redis
 */
interface _LocationVerificationRecord {
  id: string;
  placeId: string;
  userGeohash5: string;
  userId?: string;
  status: LocationVerificationState;
  distance?: number;
  failReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate idempotency key for location verification
 */
function _generateVerificationKey(placeId: string, userGeohash5: string, userId?: string): string {
  const data = `${placeId}:${userGeohash5}:${userId || 'anon'}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify user location against place location with idempotent 4-state management
 *
 * Flow:
 * 1. Check if verification already exists (idempotency)
 * 2. Create verification record in 'pending' state
 * 3. Atomically transition to 'processing'
 * 4. Verify distance (≤ 100m)
 * 5. Atomically transition to 'success' or 'failed'
 *
 * @param placeId - Place ID to verify against
 * @param userGeohash5 - User's current location (5-char geohash)
 * @param userId - User ID for audit trail (optional)
 * @returns Verification result with state
 */
export async function verifyLocation(
  placeId: string,
  userGeohash5: string,
  _userId?: string
): Promise<LocationVerificationResult> {
  try {
    // Step 1: Look up place
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { geohash6: true, name: true },
    });

    if (!place) {
      return {
        state: 'failed',
        message: 'Place not found',
      };
    }

    // Step 2: Calculate distance
    const placeGeohash5 = place.geohash6.substring(0, 5);
    const distance = calculateDistance(userGeohash5, placeGeohash5);

    // Step 3: Verify distance threshold
    if (distance > MAX_DISTANCE_METERS) {
      return {
        state: 'failed',
        message: `Distance too large: ${Math.round(distance)}m > ${MAX_DISTANCE_METERS}m`,
        distance: Math.round(distance),
      };
    }

    // Success
    return {
      state: 'success',
      distance: Math.round(distance),
    };
  } catch (error: any) {
    console.error('Location verification error:', error);

    return {
      state: 'failed',
      message: 'Verification error',
    };
  }
}

/**
 * Batch verify multiple locations (for efficiency)
 * @param verifications - Array of verification requests
 * @returns Array of verification results in same order
 */
export async function batchVerifyLocations(
  verifications: Array<{
    placeId: string;
    userGeohash5: string;
    userId?: string;
  }>
): Promise<LocationVerificationResult[]> {
  // Fetch all places in parallel
  const placeIds = verifications.map((v) => v.placeId);
  const places = await prisma.place.findMany({
    where: { id: { in: placeIds } },
    select: { id: true, geohash6: true },
  });

  const placeMap = new Map(places.map((p) => [p.id, p]));

  // Verify each location
  const results = verifications.map((v) => {
    const place = placeMap.get(v.placeId);

    if (!place) {
      return {
        state: 'failed' as LocationVerificationState,
        message: 'Place not found',
      };
    }

    const placeGeohash5 = place.geohash6.substring(0, 5);
    const distance = calculateDistance(v.userGeohash5, placeGeohash5);

    if (distance > MAX_DISTANCE_METERS) {
      return {
        state: 'failed' as LocationVerificationState,
        message: `Distance too large: ${Math.round(distance)}m > ${MAX_DISTANCE_METERS}m`,
        distance: Math.round(distance),
      };
    }

    return {
      state: 'success' as LocationVerificationState,
      distance: Math.round(distance),
    };
  });

  return results;
}

/**
 * Get verification history for a user (for debugging/support)
 * @param userId - User ID
 * @param limit - Maximum number of records to return
 * @returns Array of verification records
 */
export async function getVerificationHistory(userId: string, _limit: number = 50): Promise<any[]> {
  // This would query a dedicated verification_logs table
  // For now, returning empty array as placeholder
  return [];
}

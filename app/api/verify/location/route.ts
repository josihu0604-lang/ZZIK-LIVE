import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import ngeohash from 'ngeohash';
import { Prisma } from '@prisma/client';
import { rateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  placeId: z.string().min(1),
  userGeohash5: z.string().length(5),
  ts: z.number().int().optional(),
});

const MAX_DISTANCE_METERS = 120; // 120 meters threshold

export async function POST(req: NextRequest) {
  // Parse request body
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PARAMS',
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  // Apply rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
  const rl = await rateLimit('verify_location', ip);

  if (rl.used > rl.limit) {
    return NextResponse.json(
      { error: 'RATE_LIMIT' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(rl.reset),
        },
      }
    );
  }

  const { placeId, userGeohash5, ts } = parsed.data;

  try {
    // Decode geohash to lat/lng
    const { latitude: lat, longitude: lng } = ngeohash.decode(userGeohash5);

    // Query distance using PostGIS ST_Distance
    const sql = Prisma.sql;
    const rows = await prisma.$queryRaw<{ distance_m: number }[]>(sql`
      SELECT 
        ST_Distance(
          p.location, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM "Place" p
      WHERE p.id = ${placeId}
      LIMIT 1
    `);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'PLACE_NOT_FOUND' }, { status: 404 });
    }

    const distance = rows[0].distance_m ?? 1e9;
    const gpsOk = distance <= MAX_DISTANCE_METERS;

    // TODO: Replace 'current' with actual user ID from session
    const userId = 'current';

    // Update verification record
    await prisma.verification.upsert({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
      update: { gpsOk },
      create: {
        userId,
        placeId,
        gpsOk,
      },
    });

    // Log for analytics (privacy-preserving)
    // Location verification - removed console.log

    // Optional: Log timestamp if provided
    if (ts) {
      const timeDiff = Math.abs(Date.now() - ts);
      if (timeDiff > 60000) {
        // More than 1 minute old
        console.warn(`Stale location data: ${timeDiff}ms old`);
      }
    }

    return NextResponse.json(
      {
        gpsOk,
        distanceMeters: Math.round(distance),
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      }
    );
  } catch (error) {
    console.error('Location verification error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

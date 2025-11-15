import 'server-only';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import ngeohash from 'ngeohash';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  geohash6: z.string().min(6).max(12),
  radius: z.coerce.number().int().min(50).max(3000).default(1000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().nullish()
});

interface PlaceResult {
  id: string;
  name: string;
  geohash6: string;
  distance_m: number;
  address?: string;
  category?: string;
}

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  
  // Parse query parameters
  const searchParams = req.nextUrl.searchParams;
  const params = Object.fromEntries(searchParams);
  
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: 'INVALID_PARAMS', 
        details: parsed.error.flatten() 
      }, 
      { status: 422 }
    );
  }

  const { geohash6, radius, limit, cursor } = parsed.data;
  
  // Decode geohash to coordinates
  const { latitude: lat, longitude: lng } = ngeohash.decode(geohash6);

  // Parse cursor if provided
  let afterDist = 0;
  let afterId = '';
  if (cursor) {
    const parts = cursor.split('|');
    if (parts.length === 2) {
      afterDist = parseFloat(parts[0]) || 0;
      afterId = parts[1] || '';
    }
  }

  try {
    // Use raw SQL for PostGIS spatial query with keyset pagination
    const sql = Prisma.sql;
    const rows = await prisma.$queryRaw<PlaceResult[]>(sql`
      WITH center AS (
        SELECT ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography AS c
      )
      SELECT 
        p.id, 
        p.name, 
        p.geohash6,
        p.address,
        p.category,
        ST_Distance(p.location, (SELECT c FROM center))::float8 AS distance_m
      FROM "Place" p
      WHERE 
        ST_DWithin(p.location, (SELECT c FROM center), ${radius}::float8)
        ${cursor ? sql`AND (ST_Distance(p.location, (SELECT c FROM center))::float8, p.id) > (${afterDist}::float8, ${afterId}::text)` : sql``}
      ORDER BY distance_m ASC, id ASC
      LIMIT ${limit}::int
    `);

    // Prepare response
    const items = rows.map(r => ({
      id: r.id,
      name: r.name,
      geohash6: r.geohash6,
      distanceMeters: Math.round(r.distance_m),
      ...(r.address && { address: r.address }),
      ...(r.category && { category: r.category })
    }));

    // Generate next cursor if there are results
    const last = rows.at(-1);
    const nextCursor = last && rows.length === limit 
      ? `${Math.round(last.distance_m)}|${last.id}` 
      : null;

    const t1 = performance.now();
    const duration = (t1 - t0).toFixed(1);

    return NextResponse.json(
      { 
        items, 
        nextCursor,
        meta: {
          center: { lat, lng },
          radius,
          limit,
          count: items.length
        }
      }, 
      {
        headers: { 
          'Server-Timing': `db;dur=${duration}`,
          'Cache-Control': 'public, max-age=60, s-maxage=120'
        }
      }
    );
  } catch (error) {
    console.error('Error in nearby places query:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' }, 
      { status: 500 }
    );
  }
}
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { searchPlaces } from '@/lib/search';
import ngeohash from 'ngeohash';
import { sha256 } from '@/lib/hash';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const schema = z.object({
  q: z.string().max(64).default(''),
  geohash5: z.string().length(5),
  radius: z.coerce.number().int().min(50).max(3000),
  lang: z.string().max(8).optional().default('ko'),
});

const VERSION = 'v1';

export async function GET(req: NextRequest) {
  const t0 = performance.now();
  const requestId = req.headers.get('x-request-id') ?? uuidv4();

  const url = new URL(req.url);
  const parsed = schema.safeParse({
    q: url.searchParams.get('q') ?? '',
    geohash5: url.searchParams.get('geohash5') ?? '',
    radius: url.searchParams.get('radius') ?? '1000',
    lang: url.searchParams.get('lang') ?? 'ko',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_PARAMS', details: parsed.error.flatten() },
      { status: 422, headers: { 'X-Request-Id': requestId } }
    );
  }

  const { q, geohash5, radius, lang } = parsed.data;

  // Rate limiting (60 requests per minute)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ident = sha256(ip);
  const rlKey = `rl:search:${ident}`;
  const limit = 60;

  const used = (await (redis as any).incr?.(rlKey)) ?? 1;
  if (used === 1) await (redis as any).expire?.(rlKey, 60);

  const remaining = Math.max(0, limit - used);
  const resetTtl = (await (redis as any).ttl?.(rlKey)) ?? 0;

  if (used > limit) {
    return NextResponse.json(
      { error: 'RATE_LIMIT' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(resetTtl),
          'X-Request-Id': requestId,
        },
      }
    );
  }

  // Cache key format: q|geohash5|radius|lang|v
  const cacheKey = `search:${q}|${geohash5}|${radius}|${lang}|${VERSION}`;
  const cached = await (redis as any).get?.(cacheKey);

  if (cached) {
    const t1 = performance.now();
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Cache': 'HIT',
        'X-Request-Id': requestId,
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(resetTtl),
        'Server-Timing': `app;dur=${(t1 - t0).toFixed(1)}`,
      },
    });
  }

  // Decode geohash to coordinates (internal calculation only; raw coordinates not logged)
  const { latitude: lat, longitude: lng } = ngeohash.decode(geohash5);

  const db0 = performance.now();
  const rows = await searchPlaces(lng, lat, radius, q.trim());
  const db1 = performance.now();

  const body = JSON.stringify({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      geohash6: r.geohash6,
      distanceMeters: Math.round(r.distance_meters),
      popularity: r.popularity ?? 0,
      score: Number(r.score.toFixed(6)),
    })),
    meta: { geohash5, radius, q, version: VERSION },
  });

  await (redis as any).set?.(cacheKey, body, 'EX', 60);

  const t1 = performance.now();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      'X-Cache': 'MISS',
      'X-Request-Id': requestId,
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTtl),
      'Server-Timing': `db;dur=${(db1 - db0).toFixed(1)}, app;dur=${(t1 - t0).toFixed(1)}`,
    },
  });
}

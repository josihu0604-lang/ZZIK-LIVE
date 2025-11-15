import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type SearchRow = {
  id: string;
  name: string;
  address: string | null;
  geohash6: string;
  distance_meters: number;
  popularity: number | null;
  text_rank: number;
  score: number;
};

export async function searchPlaces(
  lng: number,
  lat: number,
  radius: number,
  q: string
): Promise<SearchRow[]> {
  const sql = Prisma.sql;

  // Using raw SQL for PostGIS spatial queries and text search with ts_rank
  const rows = await prisma.$queryRaw<SearchRow[]>(sql`
    WITH params AS (
      SELECT ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography AS center,
      ${radius}::int AS r
    ),
    base AS (
      SELECT
        "Place".id,
        "Place".name,
        "Place".address,
        "Place".geohash6,
        ST_Distance("Place".location, (SELECT center FROM params))::float8 AS distance_meters,
        "Place".popularity,
        "Place".search_tsv
      FROM "Place"
      WHERE ST_DWithin("Place".location, (SELECT center FROM params), (SELECT r FROM params))
    ),
    ranked AS (
      SELECT *,
        CASE WHEN ${q} = '' THEN 0
        ELSE ts_rank(search_tsv, plainto_tsquery('simple', unaccent(${q})))
        END AS text_rank
      FROM base
    )
    SELECT
      id,
      name,
      address,
      geohash6,
      distance_meters,
      popularity,
      text_rank,
      (0.70 * text_rank + 0.20 * (1 / (1 + distance_meters / 200.0)) + 0.10 * COALESCE(popularity, 0)) AS score
    FROM ranked
    ORDER BY score DESC
    LIMIT 50
  `);

  return rows;
}

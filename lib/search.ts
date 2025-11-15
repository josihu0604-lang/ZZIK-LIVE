import { prisma } from './prisma';
import ngeohash from 'ngeohash';

export interface SearchResult {
  id: string;
  name: string;
  address?: string | null;
  category?: string | null;
  popularity: number;
  distance?: number;
  distance_meters?: number;
  geohash6?: string;
  score?: number;
}

export interface SearchOptions {
  query?: string;
  geohash5: string;
  radius: number;
  limit?: number;
  lang?: string;
}

/**
 * Search for places near a given geohash with optional text filter
 * @param options - Search parameters
 * @returns Array of matching places with distances
 */
export async function searchPlaces(options: SearchOptions): Promise<SearchResult[]> {
  const { query = '', geohash5, radius, limit = 20, lang = 'ko' } = options;
  
  // Decode geohash to get center lat/lng
  const decoded = ngeohash.decode(geohash5);
  const centerLat = decoded.latitude;
  const centerLng = decoded.longitude;
  
  // PostgreSQL/PostGIS query for spatial search
  // Using ST_DWithin for efficient radius search with GIST index
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT 
      id,
      name,
      address,
      category,
      popularity,
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography
      ) as distance
    FROM "Place"
    WHERE 
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography,
        ${radius}
      )
      ${query ? prisma.$queryRaw`AND (name ILIKE ${'%' + query + '%'} OR address ILIKE ${'%' + query + '%'})` : prisma.$queryRaw``}
    ORDER BY 
      popularity DESC,
      distance ASC
    LIMIT ${limit}
  `;
  
  return results;
}

/**
 * Search places by text only (no geospatial filter)
 * @param query - Search text
 * @param limit - Max results
 * @returns Array of matching places
 */
export async function searchPlacesByText(query: string, limit = 20): Promise<SearchResult[]> {
  const results = await prisma.place.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      address: true,
      category: true,
      popularity: true
    },
    orderBy: {
      popularity: 'desc'
    },
    take: limit
  });
  
  return results as SearchResult[];
}

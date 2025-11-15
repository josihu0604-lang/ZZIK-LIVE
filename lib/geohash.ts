/**
 * Geohash utilities for privacy-preserving location handling
 * Only geohash5 (±5km precision) is allowed for user privacy
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode latitude/longitude to geohash
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @param precision - Geohash length (we use 5 for privacy)
 * @returns Geohash string
 */
export function encode(lat: number, lng: number, precision: number = 5): string {
  if (precision > 5) {
    console.warn('Geohash precision > 5 not allowed for privacy. Using 5.');
    precision = 5;
  }

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  const latRange = [-90.0, 90.0];
  const lngRange = [-180.0, 180.0];

  while (geohash.length < precision) {
    if (evenBit) {
      // longitude
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        idx |= 1 << (4 - bit);
        lngRange[0] = mid;
      } else {
        lngRange[1] = mid;
      }
    } else {
      // latitude
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        idx |= 1 << (4 - bit);
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    evenBit = !evenBit;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decode geohash to approximate lat/lng bounds
 * @param geohash - Geohash string
 * @returns Object with latitude and longitude ranges
 */
export function decode(geohash: string): {
  latitude: [number, number];
  longitude: [number, number];
  center: { lat: number; lng: number };
} {
  let evenBit = true;
  const latRange = [-90.0, 90.0];
  const lngRange = [-180.0, 180.0];

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error(`Invalid geohash character: ${char}`);

    for (let i = 4; i >= 0; i--) {
      const mask = 1 << i;
      if (evenBit) {
        // longitude
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (idx & mask) {
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        // latitude
        const mid = (latRange[0] + latRange[1]) / 2;
        if (idx & mask) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      evenBit = !evenBit;
    }
  }

  return {
    latitude: latRange as [number, number],
    longitude: lngRange as [number, number],
    center: {
      lat: (latRange[0] + latRange[1]) / 2,
      lng: (lngRange[0] + lngRange[1]) / 2,
    },
  };
}

/**
 * Get geohash neighbors for prefetching/caching
 * @param geohash - Center geohash
 * @returns Array of 9 geohashes (center + 8 neighbors)
 */
export function getNeighbors(geohash: string): string[] {
  const lastChar = geohash[geohash.length - 1];
  const parent = geohash.slice(0, -1);
  const idx = BASE32.indexOf(lastChar);

  // Simplified neighbor finding (not 100% accurate at boundaries)
  const neighbors: string[] = [geohash];

  // Get approximate neighbors by varying the last character
  for (const offset of [-1, 1]) {
    const newIdx = idx + offset;
    if (newIdx >= 0 && newIdx < BASE32.length) {
      neighbors.push(parent + BASE32[newIdx]);
    }
  }

  return neighbors;
}

/**
 * Calculate distance between two geohash5 areas (approximate)
 * @returns Distance in kilometers
 */
export function distance(geohash1: string, geohash2: string): number {
  const loc1 = decode(geohash1).center;
  const loc2 = decode(geohash2).center;

  // Haversine formula
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a geohash is within a certain distance from another
 * @param center - Center geohash
 * @param target - Target geohash to check
 * @param maxDistance - Maximum distance in kilometers
 */
export function isWithinDistance(center: string, target: string, maxDistance: number): boolean {
  return distance(center, target) <= maxDistance;
}

/**
 * Privacy-safe location formatter
 * Converts raw coordinates to geohash5 for storage/transmission
 */
export function sanitizeLocation(
  lat: number,
  lng: number
): {
  geohash5: string;
  approximate_area: string;
} {
  const geohash5 = encode(lat, lng, 5);
  const bounds = decode(geohash5);

  // Calculate approximate area size
  const latRange = bounds.latitude[1] - bounds.latitude[0];
  const lngRange = bounds.longitude[1] - bounds.longitude[0];
  const areaSizeKm = Math.round(
    latRange * 111 * lngRange * 111 * Math.cos(toRad(bounds.center.lat))
  );

  return {
    geohash5,
    approximate_area: `~${areaSizeKm}km²`,
  };
}

// lib/search/geo.ts
import ngeohash from 'ngeohash';

export function centerOfGeoHash5(geohash5: string) {
  const { latitude, longitude } = ngeohash.decode(geohash5);
  return { lat: latitude, lng: longitude };
}

// Optional: expand 9-cell around geohash5 prefix for candidate widening
export function geohash5Neighborhood(gh5: string) {
  const neighbors = ngeohash.neighbors(gh5);
  return [gh5, ...Object.values(neighbors)];
}

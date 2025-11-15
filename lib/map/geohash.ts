import geohash from 'ngeohash';

/**
 * GPS 좌표를 geohash5로 변환 (약 5km 정밀도)
 * 로그/이벤트용 - 프라이버시 보호
 */
export const toGeohash5 = (lat: number, lng: number): string => {
  return geohash.encode(lat, lng, 5);
};

/**
 * GPS 좌표를 geohash6으로 변환 (약 1.2km 정밀도)
 * DB 저장/검색용
 */
export const toGeohash6 = (lat: number, lng: number): string => {
  return geohash.encode(lat, lng, 6);
};

/**
 * 9셀 확장 (중앙 + 8방향)
 * 근처 장소 검색 시 사용
 */
export function expandNineCells(gh6: string): string[] {
  const neighbors = geohash.neighbors(gh6);
  // ngeohash returns array: [n, ne, e, se, s, sw, w, nw]
  return [gh6, ...neighbors];
}

/**
 * Geohash 디코드
 */
export function decodeGeohash(hash: string): { latitude: number; longitude: number } {
  return geohash.decode(hash);
}

/**
 * 두 geohash 간 거리 계산 (meters)
 */
export function distanceBetween(hash1: string, hash2: string): number {
  const coord1 = decodeGeohash(hash1);
  const coord2 = decodeGeohash(hash2);

  return haversineDistance(coord1.latitude, coord1.longitude, coord2.latitude, coord2.longitude);
}

/**
 * Haversine 공식으로 두 지점 간 거리 계산 (meters)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 지구 반경 (meters)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

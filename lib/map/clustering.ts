import Supercluster from 'supercluster';

/**
 * Internal point feature for clustering (coordinates decoded from geohash)
 * NEVER expose raw coordinates - only use for server-side clustering
 */
export interface PointFeature {
  id: string;
  lng: number; // Decoded from geohash, internal use only
  lat: number; // Decoded from geohash, internal use only
  properties?: Record<string, any>;
}

export interface ClusterConfig {
  radius?: number; // 클러스터 반경 (pixels)
  maxZoom?: number; // 최대 클러스터링 줄 레벨
  minPoints?: number; // 최소 클러스터 포인트 수
}

/**
 * 맵 클러스터링을 위한 Supercluster 인덱스 생성
 */
export function buildCluster(points: PointFeature[], config: ClusterConfig = {}): Supercluster {
  const { radius = 60, maxZoom = 18, minPoints = 2 } = config;

  const index = new Supercluster({
    radius,
    maxZoom,
    minPoints,
  });

  // GeoJSON Feature 형식으로 변환
  const features = points.map((p) => ({
    type: 'Feature' as const,
    properties: {
      id: p.id,
      ...p.properties,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [p.lng, p.lat],
    },
  }));

  index.load(features);

  return index;
}

/**
 * 특정 bbox와 zoom 레벨에서 클러스터 가져오기
 */
export function getClusters(
  index: Supercluster,
  bbox: [number, number, number, number], // [west, south, east, north]
  zoom: number
) {
  return index.getClusters(bbox, zoom);
}

/**
 * 클러스터 확대 시 하위 포인트 가져오기
 */
export function getClusterLeaves(index: Supercluster, clusterId: number, limit = 10, offset = 0) {
  return index.getLeaves(clusterId, limit, offset);
}

/**
 * 클러스터 클릭 시 확대 레벨 계산
 */
export function getClusterExpansionZoom(index: Supercluster, clusterId: number): number {
  return index.getClusterExpansionZoom(clusterId);
}

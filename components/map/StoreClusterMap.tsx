'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

type Store = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
};

type Props = {
  stores: Store[];
  style?: string;
  height?: number;
};

/**
 * 멀티 스토어 클러스터 맵
 */
export default function StoreClusterMap({
  stores,
  style = 'mapbox://styles/mapbox/light-v11',
  height = 360,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: ref.current,
      style,
      center: [127.0276, 37.4979],
      zoom: 11,
    });
    mapRef.current = map;

    map.on('load', () => {
      const features = stores.map((s) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [s.lng, s.lat],
        },
        properties: {
          id: s.id,
          name: s.name,
          radius: s.radius,
        },
      }));

      map.addSource('stores', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
      });

      // 클러스터 레이어
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stores',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#86efac',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            10,
            22,
            30,
            30,
          ],
        },
      });

      // 클러스터 카운트
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'stores',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
        },
      });

      // 개별 포인트
      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'stores',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#22c55e',
          'circle-radius': 6,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stores, style]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="rounded-xl overflow-hidden border border-[var(--border)]"
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

type Props = {
  center: { lat: number; lng: number };
  radius: number; // meters
  user?: { lat: number; lng: number };
  height?: number;
  styleUrl?: string;
};

/**
 * 지오펜스 시각화 맵 (단일 매장 + 사용자 위치)
 */
export default function GeoFenceMap({
  center,
  radius,
  user,
  height = 300,
  styleUrl = 'mapbox://styles/mapbox/streets-v12',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN.includes('demo_token')) {
      console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not set or invalid');
      return;
    }

    const map = new mapboxgl.Map({
      container: ref.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom: 16,
    });
    mapRef.current = map;

    map.on('load', () => {
      // 지오펜스 원 그리기
      const circle = circlePolygon(center.lng, center.lat, radius, 64);
      map.addSource('fence', {
        type: 'geojson',
        data: circle as any,
      });

      map.addLayer({
        id: 'fence-fill',
        type: 'fill',
        source: 'fence',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.15,
        },
      });

      map.addLayer({
        id: 'fence-line',
        type: 'line',
        source: 'fence',
        paint: {
          'line-color': '#22c55e',
          'line-width': 2,
        },
      });

      // 매장 마커
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      // 사용자 위치 마커
      if (user) {
        new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([user.lng, user.lat])
          .addTo(map);
      }

      // 바운드 맞추기
      const bounds = new mapboxgl.LngLatBounds();
      circle.geometry.coordinates[0].forEach(([lng, lat]) =>
        bounds.extend([lng, lat])
      );
      if (user) bounds.extend([user.lng, user.lat]);
      map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 0 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, radius, user, styleUrl]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="rounded-xl overflow-hidden border border-[var(--border)]"
    />
  );
}

/**
 * 원을 GeoJSON Polygon으로 변환
 */
function circlePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  points: number = 64
) {
  const coords: [number, number][] = [];
  const R = 6378137; // 지구 반경 (미터)

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    const dx = (radiusMeters * Math.cos(theta)) / R;
    const dy = (radiusMeters * Math.sin(theta)) / R;
    const lngOff = (dx / Math.cos((lat * Math.PI) / 180)) * (180 / Math.PI);
    const latOff = dy * (180 / Math.PI);
    coords.push([lng + lngOff, lat + latOff]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {},
  };
}

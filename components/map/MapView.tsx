'use client';

import { useEffect, useRef, useState } from 'react';
// import dynamic from 'next/dynamic'; // Unused
import { LocationPermissionRequest } from '../permissions/PermissionRequest';
import { decode as decodeGeohash, encode as encodeGeohash } from '@/lib/geohash';
import type { Map as MapboxMap } from 'mapbox-gl';

interface MapViewProps {
  centerGeohash5?: string;
  zoom?: number;
  onLocationGranted?: (geohash5: string) => void; // Now returns geohash5, not raw coords
  accessToken?: string;
}

/**
 * SSR-safe MapView component with privacy-preserving geohash support
 * Never exposes raw coordinates - only geohash5 (±5km precision)
 */
export default function MapView({
  centerGeohash5 = 'wydm6', // Seoul default
  zoom = 14,
  onLocationGranted,
  accessToken,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  useEffect(() => {
    // Check if we have permission already
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setHasPermission(result.state === 'granted');
        })
        .catch(() => {
          // Fallback for browsers that don't support permissions API
          setHasPermission(false);
        });
    } else {
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    if (!hasPermission || !mapContainer.current || mapRef.current) return;

    const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn('Mapbox access token not provided');
      return;
    }

    setLoadStartTime(Date.now());

    const initMap = async () => {
      try {
        // Dynamic import to avoid SSR issues (critical for Next.js)
        const mapboxgl = (await import('mapbox-gl')).default;

        // Decode geohash5 to approximate center (Privacy: using geohash decode, not raw input)
        const { center } = decodeGeohash(centerGeohash5);

        mapboxgl.accessToken = token;

        // Initialize map with decoded geohash center (Privacy: internal use only, never exposed)
        mapRef.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [center.lng, center.lat], // Privacy: decoded from geohash5, not raw coordinates
          zoom,
          attributionControl: false,
          interactive: true,
        });

        // Add navigation controls with pitch support
        mapRef.current.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: true }),
          'bottom-right'
        );

        // Add geolocate control
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: false,
        });

        mapRef.current.addControl(geolocateControl, 'bottom-right');

        // Track map load performance
        mapRef.current.on('load', () => {
          const loadTime = Date.now() - loadStartTime;
          setIsMapLoaded(true);

          // Log performance metric (should be ≤1.5s target)
          if (loadTime > 1500) {
            console.warn(`Map load time ${loadTime}ms exceeds 1.5s target`);
          }

          // Auto-trigger geolocation lazily
          geolocateControl.trigger();
        });

        // Handle geolocation - convert to geohash5 before callback
        geolocateControl.on('geolocate', (e: any) => {
          const geohash5 = encodeGeohash(e.coords.latitude, e.coords.longitude, 5);
          // CRITICAL: Only pass geohash5, never raw coordinates
          onLocationGranted?.(geohash5);
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasPermission, centerGeohash5, zoom, accessToken, onLocationGranted, loadStartTime]);

  const handleLocationGranted = (position: GeolocationPosition) => {
    setHasPermission(true);
    // Convert to geohash5 before passing up
    const geohash5 = encodeGeohash(position.coords.latitude, position.coords.longitude, 5);
    onLocationGranted?.(geohash5);
  };

  if (hasPermission === false) {
    return (
      <LocationPermissionRequest
        onGranted={handleLocationGranted}
        onDenied={() => setHasPermission(false)}
      />
    );
  }

  if (hasPermission === null) {
    return (
      <div
        className="zzik-skeleton animate"
        style={{
          width: '100%',
          height: 'calc(100vh - 200px)',
          borderRadius: 'var(--radius)',
        }}
        role="status"
        aria-label="지도 권한 확인 중"
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 200px)' }}>
      <div
        id="zl-map"
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
        role="application"
        aria-label="Explore map"
      />
      {!isMapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            className="zzik-skeleton animate"
            style={{ width: '60px', height: '4px', margin: '0 auto' }}
          />
          <p className="typo-caption muted" style={{ marginTop: '8px' }}>
            지도 로딩 중...
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { EnhancedGPS, type GPSPosition } from '@/lib/geolocation/enhanced-gps';
import { GeofenceValidator, type Store, type GeofenceResult } from '@/lib/geolocation/geofence';
import AccuracyCircle from './AccuracyCircle';
import DistanceBadge, { GPSStatusBadge } from './DistanceBadge';
import { analytics } from '@/lib/analytics';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

interface MapLiveExploreProps {
  stores: Store[];
  onStoreSelect?: (storeId: string) => void;
  height?: number;
  enableGeofence?: boolean;
}

/**
 * Enhanced Map with live GPS tracking, geofence validation, and visual feedback
 */
export default function MapLiveExplore({
  stores,
  onStoreSelect,
  height = 400,
  enableGeofence = true,
}: MapLiveExploreProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const gpsServiceRef = useRef<EnhancedGPS | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [userPosition, setUserPosition] = useState<GPSPosition | null>(null);
  const [validationResults, setValidationResults] = useState<Map<string, GeofenceResult>>(new Map());
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string>('');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not set');
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [127.0276, 37.4979], // Default: Gangnam
      zoom: 14,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add stores as markers
      stores.forEach((store) => {
        const el = document.createElement('div');
        el.className = 'store-marker';
        el.innerHTML = `
          <div class="marker-pin ${enableGeofence ? 'geofence-enabled' : ''}">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
              <path d="M16 0C7.16 0 0 7.16 0 16C0 24.84 16 40 16 40S32 24.84 32 16C32 7.16 24.84 0 16 0Z" 
                fill="currentColor"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([store.lng, store.lat])
          .addTo(map);

        // Store marker reference
        markersRef.current.set(store.id, marker);

        // Add click handler
        el.addEventListener('click', () => {
          handleStoreClick(store.id);
        });
      });

      // Start GPS tracking if geofence enabled
      if (enableGeofence) {
        startGPSTracking();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stores, enableGeofence]);

  // Start GPS tracking
  const startGPSTracking = useCallback(() => {
    if (!gpsServiceRef.current) {
      gpsServiceRef.current = new EnhancedGPS({
        enableHighAccuracy: true,
        kalmanEnabled: true,
        minConfidence: 30,
      });
    }

    const unsubscribe = gpsServiceRef.current.watchPosition(
      (position) => {
        setUserPosition(position);
        setIsTracking(true);
        setGpsError('');
        updateUserMarker(position);
        validateStores(position);
        
        // Track GPS update
        analytics.track('gps_update', {
          accuracy: position.accuracy,
          confidence: position.confidence,
        });
      },
      (error) => {
        setGpsError(getGPSErrorMessage(error));
        setIsTracking(false);
        
        analytics.track('gps_error', { code: error.code });
      }
    );

    return unsubscribe;
  }, []);

  // Update user marker on map
  const updateUserMarker = useCallback((position: GPSPosition) => {
    if (!mapRef.current) return;

    if (!userMarkerRef.current) {
      // Create user marker
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div class="user-location-pin">
          <div class="pulse-ring"></div>
          <div class="center-dot"></div>
        </div>
      `;

      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([position.lng, position.lat])
        .addTo(mapRef.current);
    } else {
      // Update position
      userMarkerRef.current.setLngLat([position.lng, position.lat]);
    }

    // Pan to user location on first update
    if (!isTracking) {
      mapRef.current.flyTo({
        center: [position.lng, position.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [isTracking]);

  // Validate stores against user position
  const validateStores = useCallback((position: GPSPosition) => {
    const results = GeofenceValidator.preValidateBatch(position, stores);
    setValidationResults(results);

    // Update marker styling based on validation
    results.forEach((result, storeId) => {
      const marker = markersRef.current.get(storeId);
      if (!marker) return;

      const element = marker.getElement();
      if (!element) return;

      // Update marker class based on status
      element.classList.remove('allow', 'warn', 'block');
      element.classList.add(result.status);

      // Add/update distance badge
      updateDistanceBadge(element, storeId, result);
    });
  }, [stores]);

  // Update distance badge on marker
  const updateDistanceBadge = (element: HTMLElement, storeId: string, result: GeofenceResult) => {
    let badge = element.querySelector('.distance-badge') as HTMLElement;
    
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'distance-badge';
      element.appendChild(badge);
    }

    const eta = GeofenceValidator.calculateWalkingETA(result.distance);
    badge.innerHTML = `
      <span class="distance">${formatDistance(result.distance)}</span>
      ${result.status !== 'block' && eta ? `<span class="eta">${GeofenceValidator.formatETA(eta)}</span>` : ''}
    `;
    badge.className = `distance-badge ${result.status}`;
  };

  // Format distance for badge
  const formatDistance = (meters: number): string => {
    if (meters < 100) return '근처';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Handle store marker click
  const handleStoreClick = useCallback((storeId: string) => {
    setSelectedStore(storeId);
    onStoreSelect?.(storeId);
    
    analytics.track('pin_tap', { place_id: storeId });
  }, [onStoreSelect]);

  // Get GPS error message
  const getGPSErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return '위치 권한이 거부되었습니다. 설정에서 허용해주세요.';
      case error.POSITION_UNAVAILABLE:
        return 'GPS 신호를 찾을 수 없습니다.';
      case error.TIMEOUT:
        return 'GPS 위치 확인 시간이 초과되었습니다.';
      default:
        return 'GPS 오류가 발생했습니다.';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gpsServiceRef.current?.dispose();
      userMarkerRef.current?.remove();
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, []);

  return (
    <div className="relative">
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="rounded-xl overflow-hidden border border-[var(--border)]"
      />

      {/* Accuracy circle overlay */}
      {mapRef.current && userPosition && (
        <AccuracyCircle
          map={mapRef.current}
          position={{ lat: userPosition.lat, lng: userPosition.lng }}
          accuracy={userPosition.accuracy}
          confidence={userPosition.confidence}
          visible={enableGeofence}
        />
      )}

      {/* GPS status badge */}
      {enableGeofence && userPosition && (
        <div className="absolute top-3 right-3">
          <GPSStatusBadge
            accuracy={userPosition.accuracy}
            confidence={userPosition.confidence}
          />
        </div>
      )}

      {/* GPS error message */}
      {gpsError && (
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
            {gpsError}
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style jsx global>{`
        .store-marker {
          cursor: pointer;
          transition: all 0.2s;
        }

        .store-marker.allow .marker-pin {
          color: #22c55e;
        }

        .store-marker.warn .marker-pin {
          color: #eab308;
        }

        .store-marker.block .marker-pin {
          color: #9ca3af;
          opacity: 0.5;
        }

        .store-marker:hover {
          transform: scale(1.1);
        }

        .user-location-pin {
          width: 20px;
          height: 20px;
          position: relative;
        }

        .pulse-ring {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          animation: pulse 2s infinite;
        }

        .center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .distance-badge {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .distance-badge.allow {
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .distance-badge.warn {
          color: #a16207;
          border: 1px solid #fde68a;
        }

        .distance-badge.block {
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .distance-badge .eta {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
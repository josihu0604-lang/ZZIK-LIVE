'use client';

import { useEffect, useRef, useState } from 'react';
import { LocationPermissionRequest } from '../permissions/PermissionRequest';
import { decode as decodeGeohash, encode as encodeGeohash } from '@/lib/geohash';
import { Icon } from '@/components/ui/Icon';

interface MapViewProps {
  centerGeohash5?: string;
  zoom?: number;
  onLocationGranted?: (geohash5: string) => void;
  accessToken?: string;
}

/**
 * SSR-safe MapView component with dynamic mapbox-gl loading
 * Privacy-preserving: only exposes geohash5 (±5km precision)
 */
export default function MapViewDynamic({
  centerGeohash5 = 'wydm6', // Seoul default
  zoom = 14,
  onLocationGranted,
  accessToken,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mapboxglRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  // Check geolocation permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setHasPermission(result.state === 'granted');
        })
        .catch(() => {
          setHasPermission(false);
        });
    } else {
      setHasPermission(false);
    }
  }, []);

  // Initialize map with dynamic import
  useEffect(() => {
    if (!hasPermission || !mapContainer.current || mapRef.current) return;
    if (!accessToken) {
      setMapError('Map access token not provided');
      return;
    }

    const initMap = async () => {
      setLoadStartTime(Date.now());

      try {
        // Dynamically import mapbox-gl
        const mapboxgl = (await import('mapbox-gl')).default;
        mapboxglRef.current = mapboxgl;

        // Import mapbox CSS
        // await import('mapbox-gl/dist/mapbox-gl.css');

        mapboxgl.accessToken = accessToken;

        // Decode geohash to coordinates
        const center = decodeGeohash(centerGeohash5);

        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [center.longitude, center.latitude],
          zoom,
          pitch: 0,
          bearing: 0,
          interactive: true,
          attributionControl: false,
        } as any);

        mapRef.current = map;

        // Add navigation controls
        const navControl = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: false,
        } as any);
        map.addControl(navControl, 'top-right');

        // Add scale control
        if ((mapboxgl as any).ScaleControl) {
          const scaleControl = new (mapboxgl as any).ScaleControl({
            maxWidth: 80,
            unit: 'metric',
          });
          map.addControl(scaleControl, 'bottom-left');
        }

        // Map loaded event
        map.on('load', () => {
          const tookMs = Date.now() - loadStartTime;
          setIsMapLoaded(true);
          console.log(`Map loaded in ${tookMs}ms`);

          // Add sample markers (would come from API in production)
          addSampleMarkers(map, mapboxgl);
        });

        // Handle user location
        if (hasPermission) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userGeohash5 = encodeGeohash(
                position.coords.latitude,
                position.coords.longitude,
                5 // 5-character precision for privacy
              );

              // Add user marker
              if ((mapboxgl as any).Marker) {
                const userMarker = new (mapboxgl as any).Marker({
                  color: '#10B981',
                })
                  .setLngLat([position.coords.longitude, position.coords.latitude])
                  .addTo(map);
              }

              // Fly to user location
              (map as any).flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 15,
                essential: true,
                duration: 1500,
              });

              // Notify parent with geohash5 (not raw coords)
              onLocationGranted?.(userGeohash5);
            },
            (error) => {
              console.error('Geolocation error:', error);
            }
          );
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError('Failed to load map');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasPermission, centerGeohash5, zoom, onLocationGranted, accessToken, loadStartTime]);

  // Add sample markers for demo
  const addSampleMarkers = (map: any, mapboxgl: any) => {
    const sampleOffers = [
      { geohash5: 'wydm6', title: 'Gangnam Coffee', category: 'cafe' },
      { geohash5: 'wydm8', title: 'Seoul BBQ', category: 'restaurant' },
      { geohash5: 'wydm7', title: 'Myeongdong Shop', category: 'retail' },
    ];

    sampleOffers.forEach((offer) => {
      const coords = decodeGeohash(offer.geohash5);

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.background = getCategoryColor(offer.category);
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

      // Add icon based on category
      const iconEl = document.createElement('div');
      iconEl.innerHTML = getCategoryIcon(offer.category);
      iconEl.style.color = 'white';
      iconEl.style.fontSize = '16px';
      el.appendChild(iconEl);

      // Create marker with custom element
      if ((mapboxgl as any).Marker && (mapboxgl as any).Popup) {
        const marker = new (mapboxgl as any).Marker(el)
          .setLngLat([coords.longitude, coords.latitude])
          .setPopup(
            new (mapboxgl as any).Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">
                    ${offer.title}
                  </h3>
                  <p style="margin: 0; font-size: 12px; color: #6B7280;">
                    Category: ${offer.category}
                  </p>
                </div>
              `)
          )
          .addTo(map);
      }
    });
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'cafe':
        return '#8B4513'; // Brown
      case 'restaurant':
        return '#FF6B6B'; // Red
      case 'retail':
        return '#4ECDC4'; // Teal
      default:
        return '#2563EB'; // Blue
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'cafe':
        return '☕';
      case 'restaurant':
        return '🍽️';
      case 'retail':
        return '🛍️';
      default:
        return '📍';
    }
  };

  // Handle location permission request
  const handleLocationGranted = () => {
    setHasPermission(true);
  };

  const handleLocationDenied = () => {
    setHasPermission(false);
    console.warn('Location permission denied - using default location');
  };

  // Show error state
  if (mapError) {
    return (
      <div
        className="card"
        style={{
          padding: '24px',
          textAlign: 'center',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          name="alert-circle"
          size={48}
          className="text-danger"
          style={{ marginBottom: '16px' }}
        />
        <h3 className="h5">Map Error</h3>
        <p className="body-small text-muted" style={{ marginTop: '8px' }}>
          {mapError}
        </p>
      </div>
    );
  }

  return (
    <div className="map-wrap" style={{ position: 'relative' }}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="map-container"
        style={{
          width: '100%',
          height: 'calc(100vh - 280px)',
          minHeight: '400px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-subtle)',
        }}
        role="region"
        aria-label="Interactive map showing nearby offers"
      />

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="text-center">
            <Icon name="loader" size={32} className="animate-spin text-primary" />
            <p className="caption text-muted" style={{ marginTop: '8px' }}>
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Location permission request */}
      {hasPermission === false && (
        <LocationPermissionRequest
          onGranted={handleLocationGranted}
          onDenied={handleLocationDenied}
        />
      )}

      {/* Map legend */}
      {isMapLoaded && (
        <div
          className="card"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            padding: '12px',
            minWidth: '150px',
            maxWidth: '200px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h4 className="caption font-semibold" style={{ marginBottom: '8px' }}>
            Categories
          </h4>
          <div className="space-y-1">
            {['cafe', 'restaurant', 'retail'].map((cat) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: getCategoryColor(cat),
                  }}
                />
                <span className="caption" style={{ textTransform: 'capitalize' }}>
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add spin animation for loader
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

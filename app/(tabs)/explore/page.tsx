'use client';

import dynamic from 'next/dynamic';
import AuthGate from '@/components/auth/AuthGate';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import ReelsCarousel from '@/components/reels/ReelsCarousel';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { Icon } from '@/components/ui/Icon';

// Dynamic import to avoid SSR issues with Mapbox
const MapView = dynamic(() => import('@/components/map/MapViewDynamic'), {
  ssr: false,
  loading: () => (
    <div
      className="zzik-skeleton animate"
      style={{
        width: '100%',
        height: 'calc(100vh - 200px)',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  ),
});

export default function ExplorePage() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  useEffect(() => {
    // Track page view with geohash5 (not raw coordinates)
    track('map_view', {
      geohash5: 'wydm6', // Seoul area geohash5
      zoom: 12,
      took_ms: 0,
    });
  }, []);

  const handleLocationGranted = (geohash5: string) => {
    // Privacy-preserving: receives geohash5, not raw coordinates
    track('map_view', {
      geohash5,
      zoom: 14,
      took_ms: 0,
    });
  };

  const sampleReels = [
    {
      id: 'r1',
      src: '/sample/reel-01.mp4',
      poster: '/sample/reel-01.jpg',
      title: '성수 카페 LIVE',
      location: '성수동',
      verified: true,
    },
    {
      id: 'r2',
      src: '/sample/reel-02.mp4',
      poster: '/sample/reel-02.jpg',
      title: '강남 맛집 체험',
      location: '강남역',
      verified: true,
    },
  ];

  return (
    <AuthGate>
      <main style={{ flex: 1, overflow: 'auto' }} aria-label="Explore">
        <section className="zzik-page">
          <header className="zzik-col" style={{ marginBottom: '16px' }}>
            <h1 className="h2">
              <span
                style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}
              >
                <Icon name="map-pin" size={24} />
              </span>
              Nearby LIVE Experiences
            </h1>
            <p className="body-small text-muted">
              Find offers on the map, verify visits with QR and receipts to earn rewards
            </p>
          </header>

          {/* Map View */}
          <div style={{ marginBottom: '24px' }}>
            <MapView accessToken={mapboxToken} onLocationGranted={handleLocationGranted} />
          </div>

          {/* LIVE Reels Carousel */}
          <div>
            <h2 className="h4" style={{ marginBottom: '12px' }}>
              <span
                style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}
              >
                <Icon name="trending-up" size={20} />
              </span>
              Popular LIVE Reels
            </h2>
            <ReelsCarousel
              items={sampleReels}
              onItemClick={(item) => {
                track('reel_click', { reel_id: item.id });
              }}
            />
          </div>
        </section>
      </main>
      <BottomTabBar />
    </AuthGate>
  );
}

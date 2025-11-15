'use client';

import dynamic from 'next/dynamic';
import AuthGate from '@/components/auth/AuthGate';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { Icon } from '@/components/ui/Icon';

// Dynamic imports for performance optimization
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

const ReelsCarousel = dynamic(() => import('@/components/reels/ReelsCarousel'), {
  ssr: false,
  loading: () => (
    <div
      className="zzik-skeleton animate"
      style={{
        width: '100%',
        height: '240px',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  ),
});

export default function ExplorePage() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  const hasMapboxToken = !!mapboxToken;

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
            {hasMapboxToken ? (
              <MapView accessToken={mapboxToken} onLocationGranted={handleLocationGranted} />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--sp-6)',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <Icon name="map-pin" size={48} />
                <h3 style={{ margin: 'var(--sp-4) 0 var(--sp-2) 0', fontSize: '20px' }}>
                  지도 기능 준비 중
                </h3>
                <p style={{ margin: 0, opacity: 0.9, maxWidth: '400px' }}>
                  현재 MapBox 토큰이 설정되지 않았습니다. 개발 환경에서는 주변 장소 목록으로
                  대체됩니다.
                </p>
              </div>
            )}
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

'use client';

import { useState } from 'react';
import SearchBar from '@/components/pass/SearchBar';
import FilterChips from '@/components/pass/FilterChips';
import ReelsCarousel from '@/components/pass/ReelsCarousel';
import MiniMap from '@/components/pass/MiniMap';
import MapLiveExplore from '@/components/map/MapLiveExplore';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { Filter, Reel, MapPin } from '@/types';
import { analytics } from '@/lib/analytics';
import { useRouter } from 'next/navigation';

// Mock data
const mockFilters: Filter[] = [
  { id: 'cafe', label: '카페', selected: false },
  { id: 'bar', label: '바/술집', selected: false },
  { id: 'activity', label: '액티비티', selected: false },
  { id: 'nearby', label: '가까운 순', selected: false },
  { id: 'discount', label: '할인율 높은 순', selected: false },
];

const mockReels: Reel[] = [
  {
    id: '1',
    placeId: 'place1',
    coverUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    videoUrl: '/videos/reel1.mp4',
    duration: 15,
    viewCount: 1200,
  },
  {
    id: '2',
    placeId: 'place2',
    coverUrl: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400',
    videoUrl: '/videos/reel2.mp4',
    duration: 20,
    viewCount: 850,
  },
  {
    id: '3',
    placeId: 'place3',
    coverUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    videoUrl: '/videos/reel3.mp4',
    duration: 18,
    viewCount: 2300,
  },
];

const mockPins: MapPin[] = [
  { id: 'place1', lat: 37.5665, lng: 126.978, category: 'cafe' },
  { id: 'place2', lat: 37.5675, lng: 126.98, category: 'bar', count: 3 },
  { id: 'place3', lat: 37.565, lng: 126.975, category: 'activity' },
];

// Convert to Store format for enhanced map
const mockStores = mockPins.map(pin => ({
  id: pin.id,
  name: `Store ${pin.id}`,
  lat: pin.lat,
  lng: pin.lng,
  radius: 120, // 120m geofence radius
  strictMode: pin.category === 'bar', // Stricter validation for bars
}));

export default function PassPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filter[]>(mockFilters);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    analytics.track('search_submit', { query });
  };

  const handleFilterToggle = (id: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
    analytics.track('filter_toggle', { id });
  };

  const handleFilterClear = () => {
    setFilters((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  const handleReelOpen = (reelId: string) => {
    analytics.track('reels_impression', { reel_id: reelId });
    router.push(`/pass/live/${reelId}`);
  };

  const handlePinTap = (placeId: string) => {
    analytics.pinTap(placeId);
    // Open place sheet (to be implemented)
    console.log('Pin tapped:', placeId);
  };

  const handleMyLocation = () => {
    console.log('Navigate to my location');
    analytics.track('my_location_click');
  };

  return (
    <div className="space-y-[var(--sp-6)]">
      {/* Search & Filters */}
      <div className="px-4 pt-4 space-y-[var(--sp-3)]">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
        />
        <FilterChips
          filters={filters}
          onToggle={handleFilterToggle}
          onClear={handleFilterClear}
        />
      </div>

      {/* LIVE Reels Carousel */}
      <ReelsCarousel items={mockReels} onOpen={handleReelOpen} />

      {/* Map - Use enhanced map if feature flag is enabled */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            주변 체험권
          </h2>
          <button
            onClick={() => router.push('/pass/map')}
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            전체 지도 보기
          </button>
        </div>
        {isFeatureEnabled('GEOFENCE_V2') ? (
          <MapLiveExplore
            stores={mockStores}
            onStoreSelect={handlePinTap}
            height={300}
            enableGeofence={true}
          />
        ) : (
          <MiniMap
            pins={mockPins}
            onPinTap={handlePinTap}
            onMyLocation={handleMyLocation}
            className="h-[300px]"
          />
        )}
      </div>

      {/* Additional content sections can be added here */}
    </div>
  );
}

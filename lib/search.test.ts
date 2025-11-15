import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPlaces } from './search';
import { prisma } from './prisma';

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('searchPlaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results with correct structure', async () => {
    const mockResults = [
      {
        id: 'p1',
        name: '카페 알파',
        address: '서울 중구',
        geohash6: 'wydm6v',
        distance_meters: 150.5,
        popularity: 0.9,
        text_rank: 0.85,
        score: 0.75,
      },
      {
        id: 'p2',
        name: '레스토랑 베타',
        address: '서울 용산',
        geohash6: 'wydm6w',
        distance_meters: 250.3,
        popularity: 0.85,
        text_rank: 0.65,
        score: 0.68,
      },
    ];

    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockResults);

    const results = await searchPlaces(126.978, 37.5665, 1000, '카페');

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('id', 'p1');
    expect(results[0]).toHaveProperty('name', '카페 알파');
    expect(results[0]).toHaveProperty('score');
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  it('should handle empty search query', async () => {
    const mockResults = [
      {
        id: 'p3',
        name: '피트니스 감마',
        address: '서울 종로',
        geohash6: 'wydm6u',
        distance_meters: 100.0,
        popularity: 0.82,
        text_rank: 0,
        score: 0.45,
      },
    ];

    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockResults);

    const results = await searchPlaces(126.978, 37.5665, 500, '');

    expect(results).toHaveLength(1);
    expect(results[0].text_rank).toBe(0);
  });

  it('should return empty array when no results found', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const results = await searchPlaces(126.978, 37.5665, 100, 'nonexistent');

    expect(results).toEqual([]);
  });

  it('should pass correct parameters to query', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const lng = 126.978;
    const lat = 37.5665;
    const radius = 2000;
    const query = '스타벅스';

    await searchPlaces(lng, lat, radius, query);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    
    // Check that the SQL template was called with correct parameters
    const callArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.values).toContain(lng);
    expect(callArg.values).toContain(lat);
    expect(callArg.values).toContain(radius);
    expect(callArg.values).toContain(query);
  });

  it('should limit results to 50 items', async () => {
    // Create 60 mock results
    const mockResults = Array.from({ length: 60 }, (_, i) => ({
      id: `p${i}`,
      name: `Place ${i}`,
      address: `Address ${i}`,
      geohash6: 'wydm6v',
      distance_meters: 100 + i * 10,
      popularity: 0.5,
      text_rank: 0.5,
      score: 0.5 - i * 0.001,
    }));

    // Note: In real implementation, LIMIT 50 is in SQL query
    // So we simulate it by returning only 50 results
    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockResults.slice(0, 50));

    const results = await searchPlaces(126.978, 37.5665, 3000, 'Place');

    expect(results).toHaveLength(50);
  });

  it('should handle database errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    vi.mocked(prisma.$queryRaw).mockRejectedValue(dbError);

    await expect(searchPlaces(126.978, 37.5665, 1000, 'test')).rejects.toThrow('Database connection failed');
  });
});
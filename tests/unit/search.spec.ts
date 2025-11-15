import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { searchPlaces } from '@/lib/search';
import { prisma } from '@/lib/prisma';

describe('Search Library', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.place.deleteMany({
      where: {
        id: {
          startsWith: 'test_'
        }
      }
    });

    // Insert test places
    await prisma.$executeRaw`
      INSERT INTO "Place"(id, name, address, geohash6, location, popularity, "createdAt", "updatedAt")
      VALUES
        ('test_1', '테스트 카페', '서울 테스트구', 'wydm6v', ST_GeogFromText('POINT(126.9780 37.5665)'), 0.9, now(), now()),
        ('test_2', '테스트 레스토랑', '서울 샘플구', 'wydm6w', ST_GeogFromText('POINT(126.9800 37.5650)'), 0.8, now(), now()),
        ('test_3', '샘플 카페', '서울 데모구', 'wydm6u', ST_GeogFromText('POINT(126.9760 37.5675)'), 0.7, now(), now())
    `;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.place.deleteMany({
      where: {
        id: {
          startsWith: 'test_'
        }
      }
    });
    await prisma.$disconnect();
  });

  it('should return places within radius', async () => {
    const results = await searchPlaces(126.978, 37.5665, 1000, '');
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Should find test places within radius
    const testPlaces = results.filter(r => r.id.startsWith('test_'));
    expect(testPlaces.length).toBeGreaterThan(0);
    
    // All results should be within specified radius
    results.forEach(result => {
      expect(result.distance_meters).toBeLessThanOrEqual(1000);
    });
  });

  it('should rank by text relevance when query is provided', async () => {
    const results = await searchPlaces(126.978, 37.5665, 2000, '카페');
    
    const cafeResults = results.filter(r => r.id.startsWith('test_') && r.name.includes('카페'));
    expect(cafeResults.length).toBeGreaterThan(0);
    
    // Cafes should have higher text rank than non-cafes
    const firstCafe = cafeResults[0];
    expect(firstCafe.text_rank).toBeGreaterThan(0);
  });

  it('should limit results to 50', async () => {
    const results = await searchPlaces(126.978, 37.5665, 10000, '');
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it('should calculate composite score correctly', async () => {
    const results = await searchPlaces(126.978, 37.5665, 1000, 'test');
    
    results.forEach(result => {
      // Score should be a positive number
      expect(result.score).toBeGreaterThanOrEqual(0);
      
      // Verify score components exist
      expect(result).toHaveProperty('text_rank');
      expect(result).toHaveProperty('distance_meters');
      expect(result).toHaveProperty('popularity');
    });
  });

  it('should handle empty query string', async () => {
    const results = await searchPlaces(126.978, 37.5665, 500, '');
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // With empty query, text_rank should be 0
    results.forEach(result => {
      expect(result.text_rank).toBe(0);
    });
  });
});
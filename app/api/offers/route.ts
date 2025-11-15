import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRequestId, log } from '@/lib/server/logger';
import { expandNineCells } from '@/lib/map/geohash';

const OffersQuerySchema = z.object({
  geohash5: z
    .string()
    .regex(/^[0-9a-z]{5}$/i)
    .optional(),
  radius: z.coerce.number().min(100).max(50000).default(5000), // meters
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const startTime = Date.now();

  try {
    const searchParams = req.nextUrl.searchParams;
    const query = OffersQuerySchema.parse({
      geohash5: searchParams.get('geohash5'),
      radius: searchParams.get('radius'),
      limit: searchParams.get('limit'),
    });

    let offers = [];

    if (query.geohash5) {
      // 위치 기반 검색 - geohash5를 geohash6로 확장
      const geohash6 = query.geohash5 + '0'; // Default expansion
      const _nearbyHashes = expandNineCells(geohash6);

      // TODO: DB에서 가까운 오퍼 가져오기
      // const offers = await prisma.offer.findMany({
      //   where: {
      //     status: 'active',
      //     validUntil: { gte: new Date() },
      //     place: {
      //       geohash6: { in: nearbyHashes },
      //     },
      //   },
      //   include: {
      //     place: true,
      //   },
      //   take: query.limit,
      //   orderBy: [
      //     { place: { popularity: 'desc' } },
      //     { createdAt: 'desc' },
      //   ],
      // });

      // 모의 데이터
      offers = [
        {
          id: 'offer_001',
          title: '아메리카노 무료',
          description: '첫 방문 고객 아메리카노 1잔 무료',
          status: 'active',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          place: {
            id: 'place_001',
            name: 'ZZIK Demo Cafe',
            geohash6: 'wydm6v',
            category: 'cafe',
            distance: 450, // meters
          },
        },
        {
          id: 'offer_002',
          title: '헤어드라이 50% 할인',
          description: '신규 고객 헤어드라이 서비스 반값',
          status: 'active',
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          place: {
            id: 'place_002',
            name: 'ZZIK Hair Salon',
            geohash6: 'wydm6v',
            category: 'beauty',
            distance: 820,
          },
        },
      ];

      log('info', 'Offers fetched by location', {
        requestId,
        geohash5: geohash6.slice(0, 5), // 로그에는 geohash5만
        count: offers.length,
        tookMs: Date.now() - startTime,
      });
    } else {
      // 전체 오퍼 목록 (인기순)
      // TODO: DB에서 모든 활성 오퍼 가져오기
      offers = [
        {
          id: 'offer_001',
          title: '아메리카노 무료',
          description: '첫 방문 고객 아메리카노 1잔 무료',
          status: 'active',
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          place: {
            id: 'place_001',
            name: 'ZZIK Demo Cafe',
            geohash6: 'wydm6v',
            category: 'cafe',
          },
        },
        {
          id: 'offer_003',
          title: '런치 세트 20% 할인',
          description: '평일 런치타임 특별 할인',
          status: 'active',
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          place: {
            id: 'place_003',
            name: 'ZZIK Restaurant',
            geohash6: 'wydjbp',
            category: 'restaurant',
          },
        },
      ];

      log('info', 'All offers fetched', {
        requestId,
        count: offers.length,
        tookMs: Date.now() - startTime,
      });
    }

    return NextResponse.json(
      {
        offers,
        count: offers.length,
        requestId,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      log('warn', 'Invalid offers query', {
        requestId,
        errorCount: error.issues.length,
      });

      return NextResponse.json(
        {
          error: 'invalid_query',
          message: 'Invalid query parameters',
          requestId,
        },
        { status: 400 }
      );
    }

    log('error', 'Offers fetch error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to fetch offers',
        requestId,
      },
      { status: 500 }
    );
  }
}

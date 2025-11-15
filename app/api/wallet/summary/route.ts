import { NextRequest, NextResponse } from 'next/server';
import { createRequestId, log } from '@/lib/server/logger';

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const startTime = Date.now();

  try {
    // TODO: Get user from session/JWT
    const userId = 'user_demo_001'; // Mock user ID

    // TODO: Fetch from database
    // const [vouchers, balance, recentActivity] = await Promise.all([
    //   prisma.voucher.count({
    //     where: { userId, status: 'issued' },
    //   }),
    //   prisma.ledger.findFirst({
    //     where: { userId },
    //     orderBy: { createdAt: 'desc' },
    //     select: { balance: true },
    //   }),
    //   prisma.ledger.findMany({
    //     where: { userId },
    //     orderBy: { createdAt: 'desc' },
    //     take: 5,
    //   }),
    // ]);

    // Mock data
    const summary = {
      vouchers: {
        active: 3,
        used: 1,
        expired: 0,
      },
      points: {
        balance: 1500,
        pending: 200,
        lifetime: 2000,
      },
      recentActivity: [
        {
          id: 'ledger_002',
          type: 'credit',
          amount: 500,
          reason: '릴스 조회수 리워드',
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          id: 'ledger_001',
          type: 'credit',
          amount: 1000,
          reason: '영수증 인증 리워드',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
      level: {
        current: 'Silver',
        progress: 75,
        nextLevel: 'Gold',
        pointsToNext: 500,
      },
    };

    log('info', 'Wallet summary fetched', {
      requestId,
      userId: userId.slice(0, 8) + '***',
      tookMs: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        summary,
        requestId,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    log('error', 'Wallet summary error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to fetch wallet summary',
        requestId,
      },
      { status: 500 }
    );
  }
}

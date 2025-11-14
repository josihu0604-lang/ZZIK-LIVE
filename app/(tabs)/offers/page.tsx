'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/auth/AuthGate';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import { track } from '@/lib/analytics';

interface Offer {
  id: string;
  title: string;
  description: string;
  location: string;
  discount: string;
  expiresIn: string;
  expiresAt: Date;
  status: 'active' | 'used' | 'expired';
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading offers
    const loadOffers = async () => {
      // In production, fetch from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const sampleOffers: Offer[] = [
        {
          id: 'o1',
          title: '성수 카페 베타',
          description: '아메리카노 20% 할인',
          location: '성수동 2가',
          discount: '20%',
          expiresIn: '23시간',
          expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
          status: 'active',
        },
        {
          id: 'o2',
          title: '강남 버거집',
          description: '세트 메뉴 15% 할인',
          location: '강남역 3번 출구',
          discount: '15%',
          expiresIn: '2일',
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      ];

      setOffers(sampleOffers);
      setIsLoading(false);

      track('offers_view', {
        offer_count: sampleOffers.length,
        active_count: sampleOffers.filter((o) => o.status === 'active').length,
      });
    };

    loadOffers();
  }, []);

  const handleOfferClick = (offer: Offer) => {
    track('offer_click', {
      offer_id: offer.id,
      status: offer.status,
    });
  };

  if (isLoading) {
    return (
      <AuthGate>
        <main style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <LoadingState label="오퍼를 불러오는 중..." />
        </main>
        <BottomTabBar />
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <section className="zzik-page">
          <header className="zzik-col" style={{ marginBottom: '24px' }}>
            <h1 className="typo-body" style={{ fontSize: '20px', fontWeight: 600 }}>
              받은 오퍼
            </h1>
            <p className="typo-caption muted">
              삼중 검증(GPS+QR+영수증)으로 사용 가능한 오퍼입니다
            </p>
          </header>

          {offers.length === 0 ? (
            <EmptyState
              label="아직 받은 오퍼가 없습니다"
              description="지도에서 주변 매장을 탐색해보세요"
              action={
                <Link href="/(tabs)/explore" className="btn">
                  지도에서 탐색하기
                </Link>
              }
            />
          ) : (
            <div className="grid" style={{ gap: '12px' }}>
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="card"
                  style={{ padding: '16px' }}
                  onClick={() => handleOfferClick(offer)}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                        {offer.title}
                      </h3>
                      <p className="typo-caption muted" style={{ marginBottom: '8px' }}>
                        {offer.description}
                      </p>
                      <div className="row" style={{ gap: '8px' }}>
                        <span className="typo-caption">📍 {offer.location}</span>
                        <span
                          className="typo-caption"
                          style={{
                            color: offer.expiresIn.includes('시간')
                              ? 'var(--warning)'
                              : 'var(--text-tertiary)',
                          }}
                        >
                          ⏱️ {offer.expiresIn} 남음
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: '#00130e',
                        borderRadius: 'var(--radius)',
                        fontWeight: 600,
                        fontSize: '20px',
                      }}
                    >
                      {offer.discount}
                    </div>
                  </div>

                  <div className="row" style={{ marginTop: '12px', gap: '8px' }}>
                    <button className="btn ghost" style={{ flex: 1 }}>
                      🗺️ 길찾기
                    </button>
                    <Link href="/(tabs)/scan" className="btn" style={{ flex: 1 }}>
                      📷 QR 스캔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomTabBar />
    </AuthGate>
  );
}

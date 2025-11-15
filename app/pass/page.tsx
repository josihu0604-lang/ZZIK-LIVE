// app/pass/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function PassContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const guestParam = searchParams?.get('guest') === '1';
    const guestCookie = document.cookie.includes('zzik_guest=1');

    if (guestParam) {
      document.cookie = `zzik_guest=1; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
      setIsGuest(true);
    } else {
      setIsGuest(guestCookie);
    }
  }, [searchParams]);

  const handleProtectedAction = (action: string) => {
    if (isGuest) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'guest_restricted_access', {
          attempted_action: action,
        });
      }
      router.push(`/auth/login?next=/${action}`);
    } else {
      router.push(`/${action}`);
    }
  };

  return (
    <>
      <main className="pass-container">
        <div className="pass-content">
          <header className="pass-header">
            <div className="brand-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect width="40" height="40" rx="12" fill="var(--brand-subtle)" />
                <path
                  d="M20 10l3 6 6.5 1-5 4.5 1.5 7L20 25l-6 3.5 1.5-7-5-4.5 6.5-1 3-6z"
                  fill="var(--brand)"
                />
              </svg>
            </div>
            <h1 className="text-h2">ZZIK LIVE Pass</h1>
            <p className="text-body text-secondary">
              {isGuest ? '게스트 모드로 둘러보는 중입니다' : '지도 기반 실시간 경험을 탐색하세요'}
            </p>
          </header>

          {isGuest && (
            <div className="guest-notice">
              <div className="notice-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="var(--warning)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M10 6v5M10 13v1"
                    stroke="var(--warning)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="notice-content">
                <h3 className="text-small">게스트 모드 안내</h3>
                <p className="text-xs text-muted">
                  현재 제한된 기능만 사용 가능합니다. 스캔, 지갑 등 주요 기능을 이용하려면 로그인이
                  필요합니다.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="btn-primary notice-cta"
                >
                  로그인하기
                </button>
              </div>
            </div>
          )}

          <div className="feature-grid">
            <FeatureCard
              icon="🗺️"
              title="지도 탐색"
              description="주변의 실시간 콘텐츠를 둘러보세요"
              onClick={() => router.push('/(tabs)/explore')}
              available={true}
            />

            <FeatureCard
              icon="📷"
              title="QR 스캔"
              description={isGuest ? '로그인이 필요한 기능입니다' : 'QR 코드로 방문 인증하기'}
              onClick={() => handleProtectedAction('scan')}
              available={!isGuest}
              locked={isGuest}
            />

            <FeatureCard
              icon="💰"
              title="지갑"
              description={isGuest ? '로그인이 필요한 기능입니다' : '포인트와 보상 확인하기'}
              onClick={() => handleProtectedAction('wallet')}
              available={!isGuest}
              locked={isGuest}
            />

            <FeatureCard
              icon="🎁"
              title="오퍼"
              description="특별 혜택과 프로모션 확인"
              onClick={() => router.push('/(tabs)/offers')}
              available={true}
            />
          </div>
        </div>
      </main>

      <style jsx>{`
        .pass-container {
          min-height: 100dvh;
          background: var(--bg);
          padding: var(--sp-6) var(--sp-4);
        }
        .pass-content {
          max-width: 640px;
          margin: 0 auto;
        }
        .pass-header {
          text-align: center;
          margin-bottom: var(--sp-8);
        }
        .brand-icon {
          display: inline-flex;
          margin-bottom: var(--sp-4);
        }
        .pass-header h1 {
          color: var(--text);
          margin: 0 0 var(--sp-2) 0;
        }
        .pass-header p {
          margin: 0;
        }
        .guest-notice {
          display: flex;
          gap: var(--sp-3);
          padding: var(--sp-4);
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: var(--radius-lg);
          margin-bottom: var(--sp-6);
        }
        .notice-icon {
          flex-shrink: 0;
        }
        .notice-content h3 {
          margin: 0 0 var(--sp-2) 0;
          color: var(--text);
          font-weight: var(--font-semibold);
        }
        .notice-content p {
          margin: 0 0 var(--sp-3) 0;
          line-height: 1.5;
        }
        .notice-cta {
          font-size: var(--text-sm);
          padding: var(--sp-2) var(--sp-4);
          min-height: 36px;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--sp-4);
        }

        @media (max-width: 640px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

export default function PassPage() {
  return (
    <Suspense
      fallback={
        <main className="pass-container">
          <div className="pass-content">
            <p className="text-body text-secondary">로딩 중...</p>
          </div>
        </main>
      }
    >
      <PassContent />
    </Suspense>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  onClick,
  available,
  locked = false,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  available: boolean;
  locked?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`feature-card ${locked ? 'locked' : ''}`}
        disabled={!available && locked}
        role="button"
        aria-label={`${title} - ${description}`}
      >
        <div className="feature-icon">{icon}</div>
        <div className="feature-content">
          <h3 className="text-lg feature-title">
            {title}
            {locked && <span className="lock-badge">🔒</span>}
          </h3>
          <p className="text-small text-muted feature-description">{description}</p>
        </div>
        {!locked && (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="arrow-icon"
            aria-hidden="true"
          >
            <path
              d="M7 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <style jsx>{`
        .feature-card {
          display: flex;
          align-items: center;
          gap: var(--sp-4);
          padding: var(--sp-5);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-align: left;
          cursor: pointer;
          transition: all var(--duration-base) var(--ease-in-out);
          box-shadow: var(--shadow);
          position: relative;
        }
        .feature-card:hover:not(.locked) {
          border-color: var(--brand);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
          transform: translateY(-2px);
        }
        .feature-card:active:not(.locked) {
          transform: translateY(0);
        }
        .feature-card.locked {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .feature-icon {
          font-size: 32px;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-subtle);
          border-radius: var(--radius);
        }
        .feature-content {
          flex: 1;
        }
        .feature-title {
          margin: 0 0 var(--sp-1) 0;
          color: var(--text);
          font-weight: var(--font-semibold);
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }
        .lock-badge {
          font-size: 14px;
        }
        .feature-description {
          margin: 0;
          line-height: 1.5;
        }
        .arrow-icon {
          flex-shrink: 0;
          color: var(--text-muted);
          transition: all var(--duration-fast);
        }
        .feature-card:hover:not(.locked) .arrow-icon {
          color: var(--brand);
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, any>) => void;
  }
}

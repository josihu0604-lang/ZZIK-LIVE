'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PassPage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  
  useEffect(() => {
    // Check if user is a guest
    const guestCookie = document.cookie.includes('zzik_guest=1');
    setIsGuest(guestCookie);
  }, []);

  const handleProtectedAction = (action: string) => {
    if (isGuest) {
      // Track analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'guest_restricted_access', { 
          attempted_action: action 
        });
      }
      
      // Show message and redirect to login
      alert('이 기능은 로그인 후 이용할 수 있어요.');
      router.push(`/auth/login?next=/${action}`);
    } else {
      router.push(`/${action}`);
    }
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: 'var(--safe-x)',
      maxWidth: 'var(--safe-max)',
      margin: '0 auto'
    }}>
      <header style={{ paddingTop: '40px', paddingBottom: '24px' }}>
        <h1 className="h1" style={{ marginBottom: '8px' }}>
          ZZIK LIVE Pass
        </h1>
        <p className="sub">
          {isGuest 
            ? '게스트 모드로 둘러보는 중입니다' 
            : '지도 기반 실시간 경험을 탐색하세요'
          }
        </p>
      </header>

      {isGuest && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          marginBottom: '24px'
        }}>
          <p className="small" style={{ marginBottom: '12px' }}>
            🔒 게스트 모드 안내
          </p>
          <p className="small" style={{ lineHeight: 1.6 }}>
            현재 제한된 기능만 사용 가능합니다.
            스캔, 지갑 등 주요 기능을 이용하려면 로그인이 필요합니다.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            로그인하기
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        {/* Explore - Available to guests */}
        <button
          onClick={() => router.push('/(tabs)/explore')}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all var(--transition-base)'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            🗺️ 지도 탐색
          </h2>
          <p className="small">
            주변의 실시간 콘텐츠를 둘러보세요
          </p>
        </button>

        {/* Scan - Protected */}
        <button
          onClick={() => handleProtectedAction('scan')}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            background: isGuest ? 'var(--surface)' : 'var(--surface)',
            border: '1px solid var(--border)',
            textAlign: 'left',
            cursor: 'pointer',
            opacity: isGuest ? 0.7 : 1,
            transition: 'all var(--transition-base)'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            📷 QR 스캔 {isGuest && '🔒'}
          </h2>
          <p className="small">
            {isGuest 
              ? '로그인이 필요한 기능입니다'
              : 'QR 코드로 방문 인증하기'
            }
          </p>
        </button>

        {/* Wallet - Protected */}
        <button
          onClick={() => handleProtectedAction('wallet')}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            background: isGuest ? 'var(--surface)' : 'var(--surface)',
            border: '1px solid var(--border)',
            textAlign: 'left',
            cursor: 'pointer',
            opacity: isGuest ? 0.7 : 1,
            transition: 'all var(--transition-base)'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            💰 지갑 {isGuest && '🔒'}
          </h2>
          <p className="small">
            {isGuest 
              ? '로그인이 필요한 기능입니다'
              : '포인트와 보상 확인하기'
            }
          </p>
        </button>
      </div>
    </main>
  );
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters?: Record<string, any>
    ) => void;
  }
}
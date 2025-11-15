// app/offline/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        router.back();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.back();
    } else {
      alert('아직 오프라인 상태입니다. 인터넷 연결을 확인해주세요.');
    }
  };

  return (
    <div className="error-container min-h-screen safe-all">
      <svg
        className="error-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>

      {isOnline ? (
        <>
          <h1 className="error-title text-brand">✓ 연결되었습니다!</h1>
          <p className="error-message">
            인터넷 연결이 복구되었습니다. 잠시 후 이전 페이지로 돌아갑니다...
          </p>
        </>
      ) : (
        <>
          <h1 className="error-title">인터넷 연결 없음</h1>
          <p className="error-message">
            인터넷 연결이 끊겼습니다. 연결을 확인하고 다시 시도해주세요.
          </p>

          <div className="error-actions">
            <button
              type="button"
              onClick={handleRetry}
              className="btn btn-primary"
              aria-label="다시 시도"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn btn-secondary"
              aria-label="홈으로 이동"
            >
              홈으로 이동
            </button>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-subtle">
            <h3 className="text-base font-semibold mb-2">오프라인 모드</h3>
            <p className="text-sm text-secondary">
              일부 캐시된 콘텐츠는 오프라인에서도 사용할 수 있습니다.
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .error-container {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

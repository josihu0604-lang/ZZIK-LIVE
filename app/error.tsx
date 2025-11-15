'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}
          role="img"
          aria-label="Error"
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          문제가 발생했습니다
        </h1>
        <p
          style={{
            color: 'var(--text-muted, #666)',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          일시적인 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details
            style={{
              textAlign: 'left',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
              에러 상세 정보 (개발 모드)
            </summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => reset()} variant="primary" size="lg" aria-label="다시 시도하기">
            다시 시도
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="secondary"
            size="lg"
            aria-label="홈으로 이동"
          >
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}

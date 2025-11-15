'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
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
                fontSize: '64px',
                marginBottom: '24px',
              }}
              role="img"
              aria-label="Critical Error"
            >
              🚨
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#1a1a1a',
              }}
            >
              심각한 오류가 발생했습니다
            </h1>
            <p
              style={{
                color: '#666',
                marginBottom: '32px',
                lineHeight: 1.6,
                fontSize: '16px',
              }}
            >
              애플리케이션에 예상치 못한 문제가 발생했습니다. 불편을 드려 죄송합니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                aria-label="다시 시도하기"
              >
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                aria-label="홈으로 이동"
              >
                홈으로
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && error.message && (
              <details
                style={{
                  marginTop: '32px',
                  textAlign: 'left',
                  padding: '16px',
                  backgroundColor: '#fee',
                  borderRadius: '8px',
                  fontSize: '14px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <summary
                  style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px', color: '#c00' }}
                >
                  에러 상세 (개발 모드)
                </summary>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#600',
                  }}
                >
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      role="status"
      aria-live="polite"
      aria-label="페이지 로딩 중"
    >
      <div style={{ textAlign: 'center' }}>
        {/* Spinner */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            border: '4px solid rgba(16, 185, 129, 0.1)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
          aria-hidden="true"
        />
        <p
          style={{
            color: 'var(--text-muted, #666)',
            fontSize: '16px',
          }}
        >
          로딩 중...
        </p>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-container min-h-screen">
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
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h1 className="error-title">404 - 페이지를 찾을 수 없습니다</h1>
      <p className="error-message">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>

      <div className="error-actions">
        <Link href="/" className="btn btn-primary">
          홈으로 이동
        </Link>
        <button type="button" onClick={() => window.history.back()} className="btn btn-secondary">
          이전 페이지
        </button>
      </div>
    </div>
  );
}

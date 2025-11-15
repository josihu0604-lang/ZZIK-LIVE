// components/ui/ErrorAlert.tsx
'use client';

import React from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = '오류',
  message,
  onRetry,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  return (
    <div className={`error-inline ${className}`} role="alert">
      <svg
        className="error-inline-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        {title && <strong className="block mb-1">{title}</strong>}
        <span>{message}</span>
      </div>
      {(onRetry || onDismiss) && (
        <div className="flex gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium underline"
              aria-label="다시 시도"
            >
              다시 시도
            </button>
          )}
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="text-sm" aria-label="닫기">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorAlert title="네트워크 오류" message="인터넷 연결을 확인해주세요." onRetry={onRetry} />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorAlert
      title="서버 오류"
      message="서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      onRetry={onRetry}
    />
  );
}

export function NotFoundError() {
  return <ErrorAlert title="찾을 수 없음" message="요청하신 페이지를 찾을 수 없습니다." />;
}

export function UnauthorizedError() {
  return (
    <ErrorAlert title="권한 없음" message="이 페이지에 접근할 권한이 없습니다. 로그인해주세요." />
  );
}

export default ErrorAlert;

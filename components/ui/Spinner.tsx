// components/ui/Spinner.tsx
'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'danger';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', color = 'primary', className = '', label }: SpinnerProps) {
  const spinnerClass = `spinner spinner-${size} spinner-${color} ${className}`.trim();

  return (
    <div className={spinnerClass} role="status" aria-label={label || '로딩 중'}>
      <span className="loading-sr">{label || '로딩 중...'}</span>
    </div>
  );
}

export function DotsSpinner({ className = '', label }: { className?: string; label?: string }) {
  return (
    <div className={`spinner-dots ${className}`} role="status" aria-label={label || '로딩 중'}>
      <span />
      <span />
      <span />
      <span className="loading-sr">{label || '로딩 중...'}</span>
    </div>
  );
}

export function LoadingOverlay({
  children,
  dark = false,
  fullscreen = false,
  text,
}: {
  children?: React.ReactNode;
  dark?: boolean;
  fullscreen?: boolean;
  text?: string;
}) {
  const overlayClass =
    `loading-overlay ${dark ? 'loading-overlay-dark' : ''} ${fullscreen ? 'loading-overlay-full' : ''}`.trim();

  return (
    <div className={overlayClass}>
      <div className="loading-container">
        {children || <Spinner size="lg" color={dark ? 'white' : 'primary'} />}
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
}

export default Spinner;

// components/ui/Progress.tsx
'use client';

import React from 'react';

interface ProgressProps {
  value?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  className?: string;
  label?: string;
}

export function Progress({
  value = 0,
  size = 'md',
  indeterminate = false,
  className = '',
  label,
}: ProgressProps) {
  const progressClass =
    `progress progress-${size} ${indeterminate ? 'progress-indeterminate' : ''} ${className}`.trim();
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={progressClass}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || '진행률'}
    >
      <div
        className="progress-bar"
        style={indeterminate ? undefined : { width: `${clampedValue}%` }}
      />
    </div>
  );
}

export function LinearProgress({ label }: { label?: string }) {
  return <Progress indeterminate label={label} />;
}

export default Progress;

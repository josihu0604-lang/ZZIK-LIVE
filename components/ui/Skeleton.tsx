// components/ui/Skeleton.tsx
'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'image' | 'card' | 'button';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  count?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  size = 'md',
  width,
  height,
  rounded = false,
  count = 1,
}: SkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return `skeleton-text${size !== 'md' ? `-${size}` : ''}`;
      case 'title':
        return 'skeleton-title';
      case 'avatar':
        return `skeleton-avatar${size !== 'md' ? `-${size}` : ''}`;
      case 'image':
        return 'skeleton-image';
      case 'card':
        return 'skeleton-card';
      case 'button':
        return 'skeleton-button';
      default:
        return 'skeleton-text';
    }
  };

  const style: React.CSSProperties = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  const skeletonClass =
    `skeleton ${getVariantClass()} ${rounded ? 'skeleton-rounded' : ''} ${className}`.trim();

  if (count > 1) {
    return (
      <div className="stack-sm">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} style={style} aria-hidden="true" />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} style={style} aria-hidden="true" />;
}

// Pre-built skeleton patterns
export function SkeletonFeedCard() {
  return (
    <div className="skeleton-feed-card" aria-busy="true" aria-label="콘텐츠 로딩 중">
      <div className="skeleton-feed-card-header">
        <Skeleton variant="avatar" size="md" />
        <div className="flex-1">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" size="sm" width="60%" />
        </div>
      </div>
      <div className="skeleton-feed-card-image skeleton" />
      <div className="skeleton-feed-card-content">
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
      </div>
      <div className="skeleton-feed-card-footer">
        <Skeleton variant="text" size="sm" width="80px" />
        <Skeleton variant="text" size="sm" width="60px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="목록 로딩 중">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-4">
          <Skeleton variant="avatar" size="md" />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" size="sm" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex flex-col items-center p-6" aria-busy="true" aria-label="프로필 로딩 중">
      <Skeleton variant="avatar" size="lg" rounded />
      <Skeleton variant="title" width="200px" className="mt-4" />
      <Skeleton variant="text" width="300px" count={2} className="mt-2" />
      <div className="flex gap-3 mt-6">
        <Skeleton variant="button" width="120px" />
        <Skeleton variant="button" width="120px" />
      </div>
    </div>
  );
}

export default Skeleton;

// components/mobile/PullToRefresh.tsx
'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { triggerHaptic } from '@/lib/utils/touch';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    let isAtTop = true;

    const handleScroll = () => {
      isAtTop = window.scrollY === 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop || refreshing) return;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop || refreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        setPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));

        // Haptic feedback when reaching threshold
        if (distance >= threshold && distance < threshold + 5) {
          triggerHaptic('medium');
        }

        // Prevent default scrolling when pulling
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;

      if (pullDistance >= threshold && !refreshing) {
        setRefreshing(true);
        triggerHaptic('heavy');

        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setRefreshing(false);
        }
      }

      setPulling(false);
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, pulling, refreshing, pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const indicatorOpacity = pulling || refreshing ? progress : 0;
  const indicatorTransform =
    pulling || refreshing
      ? `translateY(${Math.min(pullDistance, threshold)}px)`
      : 'translateY(-100%)';

  return (
    <div ref={containerRef} className={`pull-to-refresh ${className}`}>
      {/* Pull indicator */}
      <div
        className="pull-to-refresh-indicator"
        style={{
          opacity: indicatorOpacity,
          transform: indicatorTransform,
          transition: pulling ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
        {refreshing ? (
          <>
            <Spinner size="md" color="primary" />
            <span className="text-sm text-muted">새로고침 중...</span>
          </>
        ) : (
          <>
            <svg
              className="pull-to-refresh-spinner"
              style={{
                transform: `rotate(${progress * 360}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm text-muted">
              {progress >= 1 ? '놓아서 새로고침' : '당겨서 새로고침'}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform:
            pulling || refreshing
              ? `translateY(${Math.min(pullDistance * 0.5, threshold * 0.5)}px)`
              : 'translateY(0)',
          transition: pulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

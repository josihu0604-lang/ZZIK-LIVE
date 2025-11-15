// components/mobile/Swipeable.tsx
'use client';

import { useRef, useState, ReactNode } from 'react';
import { triggerHaptic } from '@/lib/utils/touch';

interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: 'danger' | 'warning' | 'primary';
  onClick: () => void;
}

interface SwipeableProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export default function Swipeable({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
  className = '',
}: SwipeableProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;

    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;

    // Limit swipe distance
    const maxDistance = rightActions.length > 0 ? rightActions.length * 80 : 0;
    const minDistance = leftActions.length > 0 ? -leftActions.length * 80 : 0;

    const newOffset = Math.max(minDistance, Math.min(distance, maxDistance));
    setOffset(newOffset);

    // Haptic feedback when reaching threshold
    if (Math.abs(newOffset) >= threshold && Math.abs(offset) < threshold) {
      triggerHaptic('light');
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    // Snap to action or reset
    if (Math.abs(offset) >= threshold) {
      // Snap to action position
      if (offset > 0 && rightActions.length > 0) {
        setOffset(rightActions.length * 80);
      } else if (offset < 0 && leftActions.length > 0) {
        setOffset(-leftActions.length * 80);
      }
    } else {
      // Reset position
      setOffset(0);
    }

    setIsSwiping(false);
  };

  const handleActionClick = (action: SwipeAction) => {
    triggerHaptic('medium');
    action.onClick();
    setOffset(0); // Reset after action
  };

  // Reset function for future use
  // const reset = () => {
  //   setOffset(0);
  // };

  return (
    <div className={`swipeable ${className}`}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div
          className="swipeable-actions"
          style={{
            left: 0,
            right: 'auto',
            opacity: offset < 0 ? 1 : 0,
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              type="button"
              className={`swipeable-action swipeable-action-${action.color}`}
              onClick={() => handleActionClick(action)}
              aria-label={action.label}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div
          className="swipeable-actions"
          style={{
            left: 'auto',
            right: 0,
            opacity: offset > 0 ? 1 : 0,
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              type="button"
              className={`swipeable-action swipeable-action-${action.color}`}
              onClick={() => handleActionClick(action)}
              aria-label={action.label}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Swipeable content */}
      <div
        ref={contentRef}
        className="swipeable-content"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Common swipe action icons
export const DeleteIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export const ArchiveIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    />
  </svg>
);

export const StarIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

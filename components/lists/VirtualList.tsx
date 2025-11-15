'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './VirtualList.module.css';

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowHeight?: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  rowHeight = 72,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handle scroll
  const handleScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      // Check if end reached
      if (
        onEndReached &&
        target.scrollHeight - target.scrollTop - target.clientHeight < endReachedThreshold
      ) {
        onEndReached();
      }
    },
    [onEndReached, endReachedThreshold]
  );

  // Update container height
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);

    return () => observer.disconnect();
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={{ contain: 'strict' }}
    >
      <div className={styles.spacer} style={{ height: totalHeight }}>
        <div
          className={styles.content}
          style={{
            transform: `translateY(${startIndex * rowHeight}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} className={styles.row} style={{ height: rowHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

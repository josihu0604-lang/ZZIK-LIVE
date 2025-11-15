'use client';

import { useState, useRef } from 'react';

interface ReelItem {
  id: string;
  src: string;
  poster?: string;
  title?: string;
  description?: string;
  location?: string;
  verified?: boolean;
}

interface ReelsCarouselProps {
  items: ReelItem[];
  onItemClick?: (item: ReelItem) => void;
}

export default function ReelsCarousel({ items, onItemClick }: ReelsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handlePlayPause = (itemId: string) => {
    const video = videoRefs.current[itemId];
    if (!video) return;

    if (isPlaying[itemId]) {
      video.pause();
      setIsPlaying((prev) => ({ ...prev, [itemId]: false }));
    } else {
      // Pause all other videos
      Object.keys(videoRefs.current).forEach((id) => {
        if (id !== itemId && videoRefs.current[id]) {
          videoRefs.current[id]?.pause();
        }
      });
      setIsPlaying({ [itemId]: true });
      video.play();
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (direction === 'right' && currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid" style={{ gap: '12px' }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            paddingBottom: '8px',
          }}
          className="reels-container"
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                flex: '0 0 auto',
                width: '280px',
                scrollSnapAlign: 'center',
              }}
              className="reel-item"
            >
              <div
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => onItemClick?.(item)}
              >
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current[item.id] = el;
                    }
                  }}
                  controls={false}
                  playsInline
                  muted
                  loop
                  preload="metadata"
                  poster={item.poster}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                  }}
                  onPlay={() => setIsPlaying((prev) => ({ ...prev, [item.id]: true }))}
                  onPause={() => setIsPlaying((prev) => ({ ...prev, [item.id]: false }))}
                >
                  <source src={item.src} type="video/mp4" />
                </video>

                {/* Play/Pause overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause(item.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isPlaying[item.id] ? 0 : 1,
                    transition: 'opacity 200ms',
                  }}
                  aria-label={isPlaying[item.id] ? '일시정지' : '재생'}
                >
                  <span style={{ fontSize: '24px' }}>{isPlaying[item.id] ? '⏸️' : '▶️'}</span>
                </button>

                {/* Info overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    color: 'white',
                  }}
                >
                  {item.title && (
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      {item.title}
                    </h4>
                  )}
                  {item.location && (
                    <p className="typo-caption" style={{ opacity: 0.9, marginBottom: '4px' }}>
                      📍 {item.location}
                    </p>
                  )}
                  {item.verified && (
                    <span
                      className="typo-caption"
                      style={{
                        background: 'var(--success)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                      }}
                    >
                      ✓ 검증됨
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => handleScroll('left')}
              disabled={currentIndex === 0}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                color: 'white',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.3 : 1,
                zIndex: 1,
              }}
              aria-label="이전 릴스"
            >
              ←
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={currentIndex === items.length - 1}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                color: 'white',
                cursor: currentIndex === items.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === items.length - 1 ? 0.3 : 1,
                zIndex: 1,
              }}
              aria-label="다음 릴스"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Scroll indicators */}
      {items.length > 1 && (
        <div className="row" style={{ justifyContent: 'center', gap: '4px' }}>
          {items.map((_, index) => (
            <div
              key={index}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: index === currentIndex ? 'var(--primary)' : 'var(--border)',
                transition: 'background 200ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

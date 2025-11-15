'use client';

import { Reel } from '@/types';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface ReelsCarouselProps {
  items: Reel[];
  onOpen: (reelId: string) => void;
}

export default function ReelsCarousel({ items, onOpen }: ReelsCarouselProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 px-4">
        LIVE 릴스
      </h2>

      <div className="flex gap-[var(--sp-3)] overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
        {items.map((reel, index) => (
          <button
            key={reel.id}
            onClick={() => onOpen(reel.id)}
            className="relative flex-shrink-0 w-[160px] h-[280px] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-subtle)] shadow-[var(--elev-1)] transition-transform duration-[var(--dur-md)] hover:scale-98 active:scale-[0.96] snap-start group"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Thumbnail */}
            <Image
              src={reel.coverUrl}
              alt={`릴스 ${reel.id}`}
              fill
              className="object-cover"
              sizes="160px"
              loading={index === 0 ? "eager" : "lazy"}
              priority={index === 0}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white/90 p-3 transition-transform duration-[var(--dur-md)] group-hover:scale-110">
                <Play
                  size={24}
                  className="text-[var(--brand)] fill-[var(--brand)]"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
              {Math.floor(reel.duration / 60)}:
              {String(reel.duration % 60).padStart(2, '0')}
            </div>

            {/* View count */}
            {reel.viewCount && (
              <div className="absolute bottom-3 left-3 text-white text-xs font-medium">
                {reel.viewCount >= 1000
                  ? `${(reel.viewCount / 1000).toFixed(1)}K`
                  : reel.viewCount}{' '}
                views
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

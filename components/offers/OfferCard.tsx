'use client';

import Image from 'next/image';
import { Gift, MapPin, ChevronRight } from 'lucide-react';
import { getButtonClasses } from '@/lib/button-presets';
import type { Offer } from '@/types';

interface OfferCardProps {
  offer: Offer;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export default function OfferCard({
  offer,
  onAccept,
  onDismiss,
  onOpenDetail,
}: OfferCardProps) {
  const validUntil =
    typeof offer.validUntil === 'string'
      ? new Date(offer.validUntil)
      : offer.validUntil;

  const daysLeft = Math.max(
    0,
    Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <article
      className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-base)] shadow-[var(--elev-1)] overflow-hidden"
      aria-label={`${offer.brandName} - ${offer.title}`}
    >
      <div className="relative w-full aspect-[16/9] bg-[var(--bg-subtle)]">
        <Image
          src={offer.coverUrl || offer.brandLogo}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover"
          priority={false}
        />
        {offer.isNew && (
          <span className="absolute left-3 top-3 text-xs px-2 py-1 rounded-full bg-[var(--brand)] text-white">
            NEW
          </span>
        )}
      </div>

      <div className="p-4 grid gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[var(--bg-subtle)] flex items-center justify-center">
            <Gift size={18} className="text-[var(--brand)]" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-[var(--text-primary)] font-semibold truncate">
              {offer.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {offer.brandName}{offer.benefit ? ` · ${offer.benefit}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
            <MapPin size={14} aria-hidden />
            {typeof offer.distance === 'number'
              ? `${offer.distance.toFixed(1)}km`
              : '거리 정보 없음'}
          </span>
          <span className="text-[var(--text-secondary)]">
            {daysLeft > 0 ? `D-${daysLeft}` : '오늘 마감'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAccept(offer.id)}
            className={getButtonClasses('primary', 'md', 'flex-1')}
          >
            받기
          </button>
          <button
            onClick={() => onOpenDetail(offer.id)}
            className={getButtonClasses('secondary', 'md', 'flex-1')}
          >
            상세보기 <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onDismiss(offer.id)}
            className={getButtonClasses('ghost', 'md')}
            aria-label="오퍼 숨기기"
            title="숨기기"
          >
            숨김
          </button>
        </div>
      </div>
    </article>
  );
}
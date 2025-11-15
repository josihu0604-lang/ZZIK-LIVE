'use client';

import { useState } from 'react';
import { Voucher } from '@/types';
import { QrCode, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { getButtonClasses } from '@/lib/button-presets';
import FilterChips from '@/components/pass/FilterChips';
import { Filter } from '@/types';
import { analytics } from '@/lib/analytics';
import EmptyState from '@/components/states/EmptyState';

const filterOptions: Filter[] = [
  { id: 'active', label: '사용가능', selected: true },
  { id: 'reserved', label: '예약', selected: false },
  { id: 'expiring', label: '만료임박', selected: false },
  { id: 'expired', label: '만료', selected: false },
];

// Mock voucher data
const mockVouchers: Voucher[] = [
  {
    id: 'v1',
    passId: 'p1',
    pass: {
      id: 'p1',
      placeId: 'place1',
      title: '스타벅스 아메리카노',
      benefit: '아메리카노 1잔 무료',
      price: 4500,
      originalPrice: 5000,
      coverUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      mediaUrls: [],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remainingCount: 10,
      category: 'cafe',
      terms: [],
    },
    status: 'active',
    purchasedAt: new Date('2024-01-15'),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'v2',
    passId: 'p2',
    pass: {
      id: 'p2',
      placeId: 'place2',
      title: '피트니스 1일 이용권',
      benefit: '1일 무료 이용',
      price: 15000,
      coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      mediaUrls: [],
      validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      remainingCount: 5,
      category: 'activity',
      terms: [],
    },
    status: 'expiring_soon',
    purchasedAt: new Date('2024-01-10'),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
];

export default function WalletPassesPage() {
  const [filters, setFilters] = useState<Filter[]>(filterOptions);
  const [vouchers] = useState<Voucher[]>(mockVouchers);

  const activeFilter = filters.find((f) => f.selected)?.id || 'active';

  const filteredVouchers = vouchers.filter((v) => {
    if (activeFilter === 'active') return v.status === 'active';
    if (activeFilter === 'reserved') return v.status === 'reserved';
    if (activeFilter === 'expiring') return v.status === 'expiring_soon';
    if (activeFilter === 'expired') return v.status === 'expired';
    return true;
  });

  const handleFilterToggle = (id: string) => {
    setFilters((prev) =>
      prev.map((f) => ({
        ...f,
        selected: f.id === id,
      }))
    );
  };

  const handleShowQR = (voucherId: string) => {
    analytics.voucherOpen(voucherId);
    console.log('Show QR for voucher:', voucherId);
    // In production, open QR modal
  };

  const handleUseVoucher = (voucherId: string) => {
    analytics.voucherUse(voucherId);
    console.log('Use voucher:', voucherId);
  };

  const daysUntilExpiry = (date: Date | string) => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 space-y-[var(--sp-4)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          보유 체험권
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          구매한 체험권을 확인하고 사용하세요
        </p>
      </div>

      {/* Filters */}
      <FilterChips filters={filters} onToggle={handleFilterToggle} />

      {/* Vouchers List */}
      {filteredVouchers.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="체험권이 없습니다"
          description="새로운 체험권을 구매해 보세요."
        />
      ) : (
        <div className="space-y-[var(--sp-3)]">
          {filteredVouchers.map((voucher) => {
            const days = daysUntilExpiry(voucher.expiresAt);
            const isExpiring = days <= 3;

            return (
              <div
                key={voucher.id}
                className="relative bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--elev-1)]"
              >
                {/* Status bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    voucher.status === 'active'
                      ? 'bg-[var(--brand)]'
                      : voucher.status === 'expiring_soon'
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--border-strong)]'
                  }`}
                />

                <div className="p-[var(--sp-4)] pl-[var(--sp-5)]">
                  {/* Title and expiry */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {voucher.pass.title}
                      </h3>
                      {isExpiring && (
                        <span className="px-2 py-0.5 bg-[var(--warning)]/12 text-[var(--warning)] text-xs font-medium rounded-full">
                          D-{days}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {voucher.pass.benefit}
                    </p>
                  </div>

                  {/* Expiry date */}
                  <div className="flex items-center gap-[var(--sp-1)] text-xs text-[var(--text-tertiary)] mb-4">
                    <Calendar size={14} strokeWidth={2} />
                    <span>
                      {(typeof voucher.expiresAt === 'string' 
                        ? new Date(voucher.expiresAt) 
                        : voucher.expiresAt
                      ).toLocaleDateString('ko-KR')} 까지
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-[var(--sp-2)]">
                    <button
                      onClick={() => handleShowQR(voucher.id)}
                      className={`${getButtonClasses('primary', 'sm')} flex-1`}
                    >
                      <QrCode size={16} strokeWidth={2} />
                      QR 띄우기
                    </button>
                    <button
                      onClick={() => handleUseVoucher(voucher.id)}
                      className={getButtonClasses('outline', 'sm')}
                    >
                      상세
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

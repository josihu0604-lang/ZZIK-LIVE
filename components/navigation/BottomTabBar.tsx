'use client';

import { TabName } from '@/types';
import { Map, Gift, QrCode, Wallet } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BottomTabBarProps {
  active?: TabName;
  badges?: Partial<Record<'offers' | 'wallet', number>>;
  onTabChange?: (tab: TabName) => void;
}

const tabs: Array<{
  id: TabName;
  label: string;
  icon: typeof Map;
  path: string;
}> = [
  { id: 'pass', label: '탐색', icon: Map, path: '/pass' },
  { id: 'offers', label: '오퍼', icon: Gift, path: '/offers' },
  { id: 'scan', label: '스캔', icon: QrCode, path: '/scan' },
  { id: 'wallet', label: '지갑', icon: Wallet, path: '/wallet' },
];

export default function BottomTabBar({
  active,
  badges,
  onTabChange,
}: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using pathname after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active tab from pathname if not provided
  const activeTab = mounted
    ? active ||
      tabs.find((tab) => pathname?.startsWith(tab.path))?.id ||
      'pass'
    : 'pass';

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <nav
        role="tablist"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-[2px] pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around" style={{ opacity: 0 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className="relative flex min-w-[72px] flex-col items-center gap-[var(--sp-1)] px-3 py-2"
              >
                <div className="relative">
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span className="text-xs font-medium">{tab.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  const handleTabClick = (tab: TabName, path: string) => {
    onTabChange?.(tab);
    router.push(path);
  };

  return (
    <nav
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-[2px] pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge = badges?.[tab.id as 'offers' | 'wallet'];

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              onClick={() => handleTabClick(tab.id, tab.path)}
              className="relative flex min-w-[72px] flex-col items-center gap-[var(--sp-1)] px-3 py-2 transition-colors duration-[var(--dur-md)]"
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 right-0 top-0 h-0.5 bg-[var(--brand)] transition-opacity duration-[var(--dur-md)]"
                  aria-hidden="true"
                />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <Icon
                  size={24}
                  className={
                    isActive
                      ? 'text-[var(--brand)]'
                      : 'text-[var(--text-tertiary)]'
                  }
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                {badge && badge > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-medium text-white animate-badge-pop"
                    aria-label={`${badge} notifications`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-[var(--brand)]'
                    : 'text-[var(--text-tertiary)]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Gift, QrCode, Wallet } from 'lucide-react';

const TABS = [
  {
    key: 'explore',
    href: '/(tabs)/explore',
    label: '탐색',
    icon: MapPin,
    ariaLabel: '지도 탐색',
  },
  {
    key: 'offers',
    href: '/(tabs)/offers',
    label: '오퍼',
    icon: Gift,
    ariaLabel: '받은 오퍼 목록',
  },
  {
    key: 'scan',
    href: '/(tabs)/scan',
    label: '스캔',
    icon: QrCode,
    ariaLabel: 'QR 코드 스캔',
  },
  {
    key: 'wallet',
    href: '/(tabs)/wallet',
    label: '지갑',
    icon: Wallet,
    ariaLabel: '나의 지갑',
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav 
      className="zzik-tabbar" 
      role="navigation" 
      aria-label="Bottom tabs"
    >
      <ul 
        role="tablist" 
        style={{ 
          display: 'flex', 
          listStyle: 'none', 
          margin: 0, 
          padding: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname?.includes(tab.key) || (pathname === '/' && tab.key === 'explore');
          const IconComponent = tab.icon;

          return (
            <li key={tab.key} role="presentation" style={{ flex: 1 }}>
              <Link
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.ariaLabel}
                className={`zzik-tab touch-target-48 ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '48px',
                  minWidth: '48px',
                  padding: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <IconComponent 
                  size={20} 
                  aria-hidden="true"
                  strokeWidth={2}
                />
                <span className="typo-label" style={{ marginTop: '4px' }}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

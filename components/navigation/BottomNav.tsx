// components/navigation/BottomNav.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { triggerHaptic } from '@/lib/utils/touch';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'feed',
    label: '피드',
    href: '/feed',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mobile-nav-icon">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    id: 'search',
    label: '검색',
    href: '/search',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mobile-nav-icon">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: 'create',
    label: '만들기',
    href: '/create',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mobile-nav-icon">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'activity',
    label: '활동',
    href: '/activity',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mobile-nav-icon">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    badge: 3,
  },
  {
    id: 'profile',
    label: '프로필',
    href: '/profile',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mobile-nav-icon">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Trigger haptic feedback on navigation
    triggerHaptic('light');

    // If already on the page, scroll to top
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-nav" role="navigation" aria-label="메인 네비게이션">
      <div className="mobile-nav-content">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="mobile-nav-badge" aria-label={`${item.badge}개의 새 알림`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingState } from '../states/LoadingState';

interface AuthGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Client-side authentication gate
 * Complements middleware.ts server-side checks for double protection
 */
export default function AuthGate({ children, redirectTo = '/splash' }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Check multiple auth methods (cookies are preferred, localStorage is fallback)
        const hasCookie =
          typeof document !== 'undefined' &&
          (document.cookie.includes('zl_auth=') ||
            document.cookie.includes('zzik_session=') ||
            document.cookie.includes('zzik_token='));

        const hasLocalStorage = typeof window !== 'undefined' && localStorage.getItem('zzik_token');

        const isAuthenticated = hasCookie || hasLocalStorage;

        // Check if current route is protected
        const protectedRoutes = ['/(tabs)', '/offers', '/scan', '/wallet', '/explore'];
        const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route));

        if (isProtectedRoute && !isAuthenticated) {
          // Store intended destination
          const nextUrl = encodeURIComponent(pathname || '/(tabs)/explore');
          router.replace(`${redirectTo}?next=${nextUrl}`);
        } else {
          setReady(true);
        }
      } catch (error) {
        console.error('AuthGate error:', error);
        // On error, redirect to splash as safe fallback
        router.replace(redirectTo);
      }
    })();
  }, [pathname, router, redirectTo]);

  // Show loading while checking auth
  if (!ready) {
    return (
      <div
        className="grid"
        style={{ placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}
        role="status"
        aria-live="polite"
        aria-label="인증 확인 중"
      >
        <LoadingState label="인증 확인 중..." />
      </div>
    );
  }

  // Authenticated and ready, render children
  return <>{children}</>;
}

'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get('guest') === '1' || document.cookie.includes('zzik_guest=1');
    const authed = document.cookie.includes('zzik_session=');

    const protectedPath = pathname?.startsWith('/wallet') || pathname?.startsWith('/scan');
    if (protectedPath && !authed) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }

    // 둘러보기 진입 시 쿠키 설정 (1일)
    if (!authed && guest) {
      document.cookie = `zzik_guest=1; path=/; max-age=${60*60*24}`;
    }
    
    // Use setTimeout to defer state update
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  if (!ready) return null; // 혹은 스켈레톤

  return <>{children}</>;
}

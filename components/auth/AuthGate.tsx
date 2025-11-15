// components/auth/AuthGate.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cookies = document.cookie;
    const authed = cookies.includes('zzik_session=');
    const guest = location.search.includes('guest=1') || cookies.includes('zzik_guest=1');

    // 민감 경로 보호
    const protectedPath =
      pathname?.startsWith('/wallet') || pathname?.startsWith('/scan') || pathname?.startsWith('/offers/accept');

    if (protectedPath && !authed) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }

    // 둘러보기 진입 시 쿠키(1일) 설정 - 보안 플래그 강화
    if (!authed && guest) {
      const attrs = `path=/; max-age=${60*60*24}; samesite=lax${location.protocol==='https:' ? '; secure' : ''}`;
      document.cookie = `zzik_guest=1; ${attrs}`;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
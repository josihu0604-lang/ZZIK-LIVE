'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check for session or guest cookie
    const hasSession =
      document.cookie.includes('zzik_session=') ||
      document.cookie.includes('zzik_token=') ||
      document.cookie.includes('zl_auth=');
    const isGuest = document.cookie.includes('zzik_guest=1');

    // Route based on authentication state
    if (hasSession || isGuest) {
      router.replace('/content');
    } else {
      router.replace('/splash');
    }
  }, [router]);

  return null;
}

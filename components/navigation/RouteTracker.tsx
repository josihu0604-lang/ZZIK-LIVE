'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function RouteTrackerInner() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    // 여기에 분석/로그 전송 등 연결 (예: window.gtag?.('event', 'page_view', {...}))
    // console.debug('[route]', pathname + (search?.toString() ? `?${search}` : ''));
  }, [pathname, search]);

  return null;
}

export default function RouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
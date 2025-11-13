'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics';

export default function RouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track route views
    analytics.routeView(pathname);
  }, [pathname]);

  return null; // This component doesn't render anything
}

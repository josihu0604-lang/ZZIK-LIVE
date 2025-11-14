'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './splash.module.css';

export default function SplashPage() {
  const router = useRouter();
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Announce loading state to screen readers
    if (liveRef.current) {
      liveRef.current.textContent = '로딩 중… 곧 이동합니다.';
    }

    const timer = setTimeout(() => {
      // Check for session or guest cookie
      const hasSession = document.cookie.includes('zzik_session=');
      const isGuest = document.cookie.includes('zzik_guest=1');
      
      // Route based on authentication state
      if (hasSession || isGuest) {
        router.replace('/feed');
      } else {
        router.replace('/auth/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className={styles.wrap} aria-labelledby="brand">
      <h1 id="brand" className="h1">ZZIK LIVE</h1>
      <p className="sub">지도 기반 LIVE 체험</p>
      <div className={styles.progress} aria-hidden="true" />
      <div 
        ref={liveRef} 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
    </main>
  );
}
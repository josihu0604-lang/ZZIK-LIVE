// app/splash/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './splash.module.css';

export default function Splash() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      const cookies = document.cookie;
      const hasSession = cookies.includes('zzik_session=');
      const firstVisit = !cookies.includes('zzik_seen=1');

      if (firstVisit) {
        document.cookie = `zzik_seen=1; path=/; max-age=${60 * 60 * 24 * 365}`;
        router.replace('/onboarding');
        return;
      }
      if (hasSession) router.replace('/pass');
      else router.replace('/auth/login');
    }, 1200);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className={styles.container} id="main-content" role="main" aria-label="스플래시 화면">
      <div className={styles.content}>
        <div className={styles.brandMark}>
          <h1 className={styles.title}>ZZIK LIVE</h1>
          <div className={styles.brandIndicator} aria-hidden="true" />
        </div>
        <p className={styles.tagline}>지도로 증명되는 LIVE 체험</p>

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.loadingDots} role="status" aria-live="polite">
            <span className="sr-only">로딩 중...</span>
            <span className={styles.dot} aria-hidden="true"></span>
            <span className={styles.dot} aria-hidden="true"></span>
            <span className={styles.dot} aria-hidden="true"></span>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    // Check for session or guest cookie
    const hasSession = document.cookie.includes('zzik_session=');
    const isGuest = document.cookie.includes('zzik_guest=1');

    // Redirect after 1.4 seconds
    const timer = setTimeout(() => {
      if (hasSession) {
        router.replace('/pass');
      } else if (isGuest) {
        router.replace('/pass?guest=1');
      } else {
        router.replace('/auth/login');
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main style={{display:'grid',placeItems:'center',height:'100dvh',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <h1 className="text-h1" style={{color:'var(--text)'}}>ZZIK LIVE</h1>
        <p className="text-body" style={{color:'var(--text-muted)', marginTop: '8px'}}>
          지도로 증명되는 LIVE 체험
        </p>
      </div>
    </main>
  );
}

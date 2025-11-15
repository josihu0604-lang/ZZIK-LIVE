// app/splash/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
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
    <>
      <main className="splash-container">
        <div className="splash-content">
          <div className="brand-mark">
            <h1 className="text-h1">ZZIK LIVE</h1>
            <div className="brand-indicator" />
          </div>
          <p className="text-body text-muted splash-tagline">지도로 증명되는 LIVE 체험</p>
        </div>
      </main>
      <style jsx>{`
        .splash-container {
          display: grid;
          place-items: center;
          min-height: 100dvh;
          background: linear-gradient(180deg, var(--bg) 0%, var(--bg-subtle) 100%);
          padding: var(--sp-4);
        }
        .splash-content {
          text-align: center;
          animation: fadeInUp 0.6s var(--ease-out);
        }
        .brand-mark {
          position: relative;
          display: inline-block;
        }
        .text-h1 {
          color: var(--text);
          margin: 0;
        }
        .brand-indicator {
          width: 32px;
          height: 3px;
          background: var(--brand);
          margin: var(--sp-3) auto 0;
          border-radius: var(--radius-full);
          animation: expandWidth 0.4s var(--ease-out) 0.3s both;
        }
        .splash-tagline {
          margin-top: var(--sp-4);
          opacity: 0;
          animation: fadeIn 0.4s var(--ease-out) 0.5s both;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes expandWidth {
          from {
            width: 0;
          }
          to {
            width: 32px;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

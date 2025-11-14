'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

type Provider = 'instagram' | 'tiktok' | 'google';

interface SocialButtonProps {
  brand: Provider;
  onClick: () => void;
}

function SocialButton({ brand, onClick }: SocialButtonProps) {
  const labels = {
    instagram: 'Instagram으로 계속',
    tiktok: 'TikTok으로 계속',
    google: 'Google로 계속'
  };
  
  const label = labels[brand];
  
  return (
    <button 
      className={`${styles.social} ${styles[brand]}`} 
      onClick={onClick} 
      aria-label={label}
    >
      {/* Placeholder SVG - replace with actual brand logos */}
      {brand === 'instagram' && (
        <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
          <path fill="currentColor" d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/>
          <circle fill="currentColor" cx="18.406" cy="5.594" r="1.44"/>
        </svg>
      )}
      {brand === 'tiktok' && (
        <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )}
      {brand === 'google' && (
        <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/pass';
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn = async (provider: Provider) => {
    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'auth_social_click', { provider });
    }
    
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${provider}?next=${encodeURIComponent(next)}`;
  };

  const skipAsGuest = () => {
    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'auth_skip_guest', { 
        entry: 'top', 
        next: '/feed' 
      });
    }
    
    // Set guest cookie
    document.cookie = `zzik_guest=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    router.replace('/feed');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // API call for magic link would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('로그인 링크를 이메일로 보내드렸습니다.');
    } catch (error) {
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      {/* Skip button at top right */}
      <button 
        className={styles.skipTop} 
        onClick={skipAsGuest}
        aria-label="로그인 없이 둘러보기"
      >
        둘러보기
      </button>

      {/* Header */}
      <header className={styles.header}>
        <h1 className="h1">ZZIK LIVE 로그인</h1>
        <p className="sub">나노 크리에이터와 로컬 비즈니스를 연결합니다.</p>
      </header>

      {/* Social login buttons */}
      <section className={styles.actions} aria-label="소셜 로그인">
        <SocialButton brand="instagram" onClick={() => signIn('instagram')} />
        <SocialButton brand="tiktok" onClick={() => signIn('tiktok')} />
        <SocialButton brand="google" onClick={() => signIn('google')} />
      </section>

      {/* Other methods (collapsible) */}
      <details className={styles.more}>
        <summary 
          className={styles.moreSummary}
          onClick={() => {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'auth_more_methods_open', {});
            }
          }}
        >
          기타 방법
        </summary>
        <div className={styles.moreBody}>
          <form className={styles.form} onSubmit={handleEmailSubmit}>
            <label htmlFor="email" className={styles.label}>
              이메일 주소
            </label>
            <input 
              id="email" 
              type="email" 
              className={styles.input} 
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              className={styles.primary}
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '로그인 링크 받기'}
            </button>
          </form>
        </div>
      </details>

      {/* Footer */}
      <footer className={styles.footer}>
        <button 
          className={styles.skipBottom} 
          onClick={skipAsGuest}
        >
          둘러보기
        </button>
        <p className="small">
          📍 위치 정보는 geohash5 수준으로 보호됩니다.
        </p>
      </footer>
    </main>
  );
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters?: Record<string, any>
    ) => void;
  }
}
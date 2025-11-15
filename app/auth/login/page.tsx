// app/auth/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

type Mode = 'social' | 'email' | 'phone';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('social');

  return (
    <>
      <main className="login-container page-full">
        <div className="login-content container container-narrow mx-auto">
          <header className="login-header mb-8">
            <h1 className="text-h2 mb-3">로그인</h1>
            <p className="text-body text-secondary">
              나노 크리에이터 × 로컬 비즈니스. 신뢰는 검증으로부터.
            </p>
          </header>

          {/* ARIA-compliant tabs */}
          <nav
            className="tab-nav mb-6"
            role="tablist"
            aria-label="로그인 방식"
            aria-orientation="horizontal"
          >
            <TabButton
              id="social"
              label="소셜"
              active={mode === 'social'}
              onClick={() => setMode('social')}
            />
            <TabButton
              id="email"
              label="이메일"
              active={mode === 'email'}
              onClick={() => setMode('email')}
            />
            <TabButton
              id="phone"
              label="휴대폰"
              active={mode === 'phone'}
              onClick={() => setMode('phone')}
            />
          </nav>

          {/* Tab panels */}
          <div className="tab-panels mb-8">
            <TabPanel id="social" active={mode === 'social'}>
              <SocialButtons />
            </TabPanel>
            <TabPanel id="email" active={mode === 'email'}>
              <EmailForm />
            </TabPanel>
            <TabPanel id="phone" active={mode === 'phone'}>
              <PhoneForm />
            </TabPanel>
          </div>

          {/* Trust messaging */}
          <div className="trust-message flex items-center gap-3 p-4 rounded-lg bg-subtle mb-8">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1l2.5 5 5.5.8-4 3.9 1 5.8L8 13.5 2.5 16.5l1-5.8-4-3.9 5.5-.8L8 1z"
                fill="var(--brand)"
              />
            </svg>
            <p className="text-small text-muted">
              위치는 geohash5 수준으로 보호되며, GPS·QR·영수증 삼중 검증으로 신뢰를 보장합니다.
            </p>
          </div>

          {/* Footer links */}
          <footer className="login-footer flex justify-between items-center pt-6 border-t border-default">
            <div className="legal-links flex items-center gap-2">
              <Link href="/legal/privacy" className="text-small text-muted">
                개인정보
              </Link>
              <span className="text-muted">·</span>
              <Link href="/legal/terms" className="text-small text-muted">
                약관
              </Link>
            </div>
            <Link
              href="/pass?guest=1"
              className="guest-link text-small"
              aria-label="로그인 없이 둘러보기"
            >
              둘러보기 →
            </Link>
          </footer>
        </div>
      </main>

      <style jsx>{`
        .login-container {
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--sp-4);
        }
        .login-content {
          width: 100%;
          max-width: 420px;
        }
        .login-header {
          margin-bottom: var(--sp-8);
        }
        .login-header h1 {
          color: var(--text);
          margin: 0 0 var(--sp-2) 0;
        }
        .login-header p {
          margin: 0;
        }
        .tab-nav {
          display: flex;
          gap: var(--sp-2);
          padding: var(--sp-1);
          background: var(--bg-subtle);
          border-radius: var(--radius-lg);
          margin-bottom: var(--sp-6);
        }
        .tab-panels {
          margin-bottom: var(--sp-6);
        }
        .trust-message {
          display: flex;
          align-items: flex-start;
          gap: var(--sp-2);
          padding: var(--sp-4);
          background: var(--bg-subtle);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          margin-bottom: var(--sp-6);
        }
        .trust-message p {
          margin: 0;
          line-height: 1.5;
        }
        .login-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--sp-4);
          border-top: 1px solid var(--border);
        }
        .legal-links {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }
        .legal-links a:hover {
          color: var(--text);
        }
        .guest-link {
          color: var(--brand);
          text-decoration: none;
          font-weight: var(--font-medium);
          transition: all var(--duration-fast);
        }
        .guest-link:hover {
          color: var(--brand-hover);
          transform: translateX(2px);
        }
      `}</style>
    </>
  );
}

function TabButton({
  id,
  label,
  active,
  onClick,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <button
        type="button"
        role="tab"
        id={`tab-${id}`}
        aria-selected={active}
        aria-controls={`panel-${id}`}
        tabIndex={active ? 0 : -1}
        onClick={onClick}
        className="btn btn-tab"
      >
        {label}
      </button>
      <style jsx>{`
        .btn-tab {
          flex: 1;
        }
      `}</style>
    </>
  );
}

function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={!active}>
      {active ? children : null}
    </section>
  );
}

function SocialButtons() {
  return (
    <>
      <div className="social-buttons">
        <OAuthButton provider="instagram" label="Instagram로 계속" href="/api/auth/instagram" />
        <OAuthButton provider="tiktok" label="TikTok으로 계속" href="/api/auth/tiktok" />
        <OAuthButton provider="google" label="Google로 계속" href="/api/auth/google" />
      </div>
      <style jsx>{`
        .social-buttons {
          display: grid;
          gap: var(--sp-3);
        }
      `}</style>
    </>
  );
}

function OAuthButton({
  provider,
  label,
  href,
}: {
  provider: 'instagram' | 'tiktok' | 'google';
  label: string;
  href: string;
}) {
  return (
    <>
      <a href={href} className="btn btn-social btn-social-${provider} btn-block">
        <BrandIcon provider={provider} />
        <span>{label}</span>
      </a>
    </>
  );
}

function BrandIcon({ provider }: { provider: 'instagram' | 'tiktok' | 'google' }) {
  const common = { width: 20, height: 20, 'aria-hidden': true as const };

  if (provider === 'google') {
    return (
      <svg {...common} viewBox="0 0 24 24" role="img" aria-label="Google">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.1 3.6-8.7z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.3 0 6-1.1 7.9-3l-3.9-3c-1 .7-2.4 1.2-4 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.3 21.4 7.3 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.5 14.4A7.9 7.9 0 0 1 4.9 12c0-.8.1-1.6.3-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.7 1.4 5.3l4.1-2.9z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c1.8 0 3.4.6 4.7 1.8l3.5-3.5A12 12 0 0 0 12 0 12 12 0 0 0 1.4 6.5l4.1 3C6.3 6.7 8.9 4.7 12 4.7z"
        />
      </svg>
    );
  }

  if (provider === 'instagram') {
    return (
      <svg {...common} viewBox="0 0 24 24" role="img" aria-label="Instagram">
        <defs>
          <radialGradient id="ig-gradient" cx="30%" cy="110%">
            <stop offset="0%" stopColor="#FFDD55" />
            <stop offset="25%" stopColor="#FF543E" />
            <stop offset="50%" stopColor="#C837AB" />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-gradient)" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 24 24" role="img" aria-label="TikTok">
      <path
        fill="#000"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      />
    </svg>
  );
}

function EmailForm() {
  return (
    <>
      <form className="form" action="/api/auth/magic-link" method="post">
        <label className="form-label">
          <span className="text-small">이메일</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="your@email.com"
            aria-label="이메일 주소"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block">
          로그인 링크 받기
        </button>
      </form>
      <style jsx>{`
        .form {
          display: grid;
          gap: var(--sp-4);
        }
        .form-label {
          display: block;
        }
        .form-label span {
          display: block;
          margin-bottom: var(--sp-2);
          color: var(--text);
          font-weight: var(--font-medium);
        }
      `}</style>
    </>
  );
}

function PhoneForm() {
  return (
    <>
      <form className="form" action="/api/auth/otp/send" method="post">
        <label className="form-label">
          <span className="text-small">휴대폰 번호</span>
          <input
            required
            name="phone"
            type="tel"
            inputMode="numeric"
            className="input"
            placeholder="010-0000-0000"
            aria-label="휴대폰 번호"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block">
          인증 코드 받기
        </button>
      </form>
      <style jsx>{`
        .form {
          display: grid;
          gap: var(--sp-4);
        }
        .form-label {
          display: block;
        }
        .form-label span {
          display: block;
          margin-bottom: var(--sp-2);
          color: var(--text);
          font-weight: var(--font-medium);
        }
      `}</style>
    </>
  );
}

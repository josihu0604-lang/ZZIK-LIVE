'use client';

import Link from 'next/link';
import { useState } from 'react';

type Mode = 'social' | 'email' | 'phone';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('social');

  return (
    <main style={{minHeight:'100dvh', background:'var(--bg)'}}>
      <div style={{maxWidth:480, margin:'0 auto', padding:'56px 20px 24px'}}>
        <header>
          <h1 className="text-h2" style={{color:'var(--text)'}}>ZZIK LIVE 로그인</h1>
          <p className="text-body" style={{color:'var(--text-muted)', marginTop: 6}}>
            나노 크리에이터와 로컬 비즈니스를 연결합니다.
          </p>
        </header>

        {/* 탭 */}
        <nav aria-label="로그인 방식" style={{display:'flex', gap:16, marginTop:24}}>
          <button
            onClick={() => setMode('social')}
            aria-current={mode==='social'}
            className="text-body"
            style={tabStyle(mode==='social')}
          >소셜</button>
          <button
            onClick={() => setMode('email')}
            aria-current={mode==='email'}
            className="text-body"
            style={tabStyle(mode==='email')}
          >이메일</button>
          <button
            onClick={() => setMode('phone')}
            aria-current={mode==='phone'}
            className="text-body"
            style={tabStyle(mode==='phone')}
          >휴대폰</button>
        </nav>

        {/* 본문 */}
        <section style={{marginTop:16}}>
          {mode === 'social' ? <SocialButtons/> : null}
          {mode === 'email' ? <EmailForm/> : null}
          {mode === 'phone' ? <PhoneForm/> : null}
        </section>

        {/* 신뢰 카피 */}
        <p className="text-body" style={{color:'var(--text-muted)', marginTop:16}}>
          위치는 geohash5 수준으로 보호되며, GPS·QR·영수증의 삼중 검증으로 신뢰를 보장합니다.
        </p>

        {/* 하단 바 */}
        <footer style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24}}>
          <small className="text-body" style={{color:'var(--text-muted)'}}>
            <Link href="/legal/privacy">개인정보</Link> · <Link href="/legal/terms">약관</Link>
          </small>
          <Link
            href="/pass?guest=1"
            aria-label="로그인 없이 둘러보기"
            className="text-body"
            style={{color:'var(--text-muted)', textDecoration:'underline'}}
          >
            둘러보기
          </Link>
        </footer>
      </div>
    </main>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 999,
    border: active ? '1px solid var(--brand)' : '1px solid var(--border)',
    background: active ? 'color-mix(in lab, var(--brand) 8%, white)' : '#fff',
    color: active ? 'var(--text)' : 'var(--text-muted)'
  };
}

function SocialButtons() {
  return (
    <div style={{display:'grid', gap:12}}>
      <OAuthButton provider="instagram" label="Instagram로 계속하기" href="/api/auth/instagram" />
      <OAuthButton provider="tiktok"    label="TikTok으로 계속하기"   href="/api/auth/tiktok" />
      <OAuthButton provider="google"    label="Google로 계속하기"     href="/api/auth/google" />
    </div>
  );
}

function OAuthButton({ provider, label, href }:{
  provider: 'instagram' | 'tiktok' | 'google',
  label: string; href: string;
}) {
  return (
    <a
      href={href}
      className="text-body"
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
        border:'1px solid var(--border)', borderRadius:'var(--radius)',
        boxShadow:'var(--shadow-sm)', color:'var(--text)'
      }}
    >
      <BrandIcon provider={provider}/>
      <span>{label}</span>
    </a>
  );
}

/* 심플 SVG. 브랜드 가이드가 있으면 교체 */
function BrandIcon({provider}:{provider:'instagram'|'tiktok'|'google'}) {
  const common = {width:24, height:24, 'aria-hidden':true};
  if (provider==='google') {
    return (<svg {...common} viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.1 3.6-8.7z"/><path fill="#34A853" d="M12 24c3.3 0 6-1.1 7.9-3l-3.9-3c-1 .7-2.4 1.2-4 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.3 21.4 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.5 14.4A7.9 7.9 0 0 1 4.9 12c0-.8.1-1.6.3-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.7 1.4 5.3l4.1-2.9z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3.4.6 4.7 1.8l3.5-3.5A12 12 0 0 0 12 0 12 12 0 0 0 1.4 6.5l4.1 3C6.3 6.7 8.9 4.7 12 4.7z"/></svg>);
  }
  if (provider==='instagram') {
    return (<svg {...common} viewBox="0 0 24 24"><path fill="#E1306C" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"/><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="18" cy="6" r="1.5" fill="#fff"/></svg>);
  }
  // tiktok
  return (<svg {...common} viewBox="0 0 24 24"><path fill="#000" d="M13 3h3a6 6 0 0 0 4 4v3a8.9 8.9 0 0 1-4-1.3V16a6 6 0 1 1-6-6h1v3h-1a3 3 0 1 0 3 3V3z"/></svg>);
}

function EmailForm() {
  return (
    <form style={{display:'grid', gap:10}} action="/api/auth/magic-link" method="post">
      <label className="text-body" style={{color:'var(--text)'}}>
        이메일
        <input
          required name="email" type="email" autoComplete="email"
          style={inputStyle}
          aria-label="이메일 주소"
        />
      </label>
      <button type="submit" style={primaryButton}>로그인 링크 받기</button>
    </form>
  );
}

function PhoneForm() {
  return (
    <form style={{display:'grid', gap:10}} action="/api/auth/otp/send" method="post">
      <label className="text-body" style={{color:'var(--text)'}}>
        휴대폰 번호
        <input required name="phone" type="tel" inputMode="numeric" style={inputStyle} aria-label="휴대폰 번호" />
      </label>
      <button type="submit" style={primaryButton}>인증 코드 받기</button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  display:'block', width:'100%', marginTop:8, padding:'12px 14px',
  border:'1px solid var(--border)', borderRadius:'10px'
};
const primaryButton: React.CSSProperties = {
  padding:'12px 14px', borderRadius:'10px',
  background:'var(--brand)', color:'#fff', border:'none'
};

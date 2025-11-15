// app/onboarding/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

const slides = [
  { h: '지도 중심 LIVE', p: '가까운 곳에서 지금 벌어지는 리얼한 경험을 탐색합니다.' },
  { h: '삼중 검증', p: 'GPS·QR·영수증으로 실제 방문을 증명합니다.' },
  { h: '프라이버시 우선', p: '원시 좌표는 저장하지 않고 geohash5만 사용합니다.' },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const next = () => setI((v) => Math.min(v + 1, slides.length - 1));
  const prev = () => setI((v) => Math.max(v - 1, 0));

  const s = slides[i];

  return (
    <main
      id="main-content"
      style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}
      role="main"
    >
      <div style={{ maxWidth: 520 }}>
        <h1 className="text-h2" style={{ color: 'var(--text)' }}>
          {s.h}
        </h1>
        <p className="text-body" style={{ color: 'var(--text-muted)', marginTop: 10 }}>
          {s.p}
        </p>
        <div role="status" aria-live="polite" className="sr-only">
          슬라이드 {i + 1} / {slides.length}
        </div>

        <nav
          role="navigation"
          aria-label="온보딩 네비게이션"
          style={{ display: 'flex', gap: 8, marginTop: 16 }}
        >
          <button
            type="button"
            onClick={prev}
            disabled={i === 0}
            className="text-body"
            style={pill(i !== 0)}
            aria-label="이전 슬라이드"
          >
            이전
          </button>
          {i < slides.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="text-body"
              style={primary()}
              aria-label="다음 슬라이드"
            >
              다음
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="text-body"
              style={primary()}
              aria-label="ZZIK LIVE 시작하기"
            >
              시작하기
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}

const pill = (enabled: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid var(--border)`,
  color: enabled ? 'var(--text)' : 'var(--text-muted)',
  background: '#fff',
});
const primary = (): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 999,
  background: 'var(--brand)',
  color: '#fff',
  border: 'none',
  display: 'inline-block',
  textDecoration: 'none',
  textAlign: 'center',
});

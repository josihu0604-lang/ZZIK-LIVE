'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    title: '현장 체험을 증명',
    description: 'GPS+QR+영수증 삼중 검증으로 신뢰 확보',
    icon: '✅',
  },
  {
    title: '내 주변 오퍼 발견',
    description: '지도에서 즉시 확인하고 LIVE 릴스로 미리보기',
    icon: '🗺️',
  },
  {
    title: 'LIVE 릴스로 공유',
    description: '짧은 영상/사진으로 나노 크리에이터가 되어보세요',
    icon: '🎥',
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('zzik_onboarded', '1');
    router.push('/auth/login');
  };

  const handleComplete = () => {
    localStorage.setItem('zzik_onboarded', '1');
    router.push('/auth/login');
  };

  const slide = SLIDES[currentSlide];

  return (
    <section className="grid" style={{ minHeight: '100vh', padding: '24px', gap: '32px' }}>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div
          className="card animate-fade-up"
          style={{ padding: '48px 32px', textAlign: 'center', maxWidth: '400px', width: '100%' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>{slide.icon}</div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>{slide.title}</h2>
          <p className="muted typo-body">{slide.description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Progress indicators */}
        <div className="row" style={{ justifyContent: 'center', gap: '8px' }}>
          {SLIDES.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === currentSlide ? 'var(--primary)' : 'var(--border)',
                transition: 'background 200ms ease',
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn ghost" onClick={handleSkip}>
            건너뛰기
          </button>
          {currentSlide < SLIDES.length - 1 ? (
            <button className="btn" onClick={handleNext}>
              다음
            </button>
          ) : (
            <button className="btn" onClick={handleComplete}>
              시작하기
            </button>
          )}
        </div>

        {/* Status for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="muted"
          style={{ textAlign: 'center', fontSize: '14px' }}
        >
          {currentSlide + 1} / {SLIDES.length}
        </div>
      </div>
    </section>
  );
}

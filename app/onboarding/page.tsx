// app/onboarding/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import styles from './onboarding.module.css';

const slides = [
  {
    h: '지도 중심 LIVE',
    p: '가까운 곳에서 지금 벌어지는 리얼한 경험을 탐색합니다.',
    icon: '🗺️',
  },
  {
    h: '삼중 검증',
    p: 'GPS·QR·영수증으로 실제 방문을 증명합니다.',
    icon: '✓',
  },
  {
    h: '프라이버시 우선',
    p: '원시 좌표는 저장하지 않고 geohash5만 사용합니다.',
    icon: '🔒',
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setDirection('forward');
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('backward');
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setDirection(index > currentIndex ? 'forward' : 'backward');
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/Swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      if (touchStartX - touchEndX > swipeThreshold) {
        goToNext();
      }
      if (touchEndX - touchStartX > swipeThreshold) {
        goToPrev();
      }
    };

    const element = document.getElementById('onboarding-container');
    if (element) {
      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [goToNext, goToPrev]);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  const isFirstSlide = currentIndex === 0;

  return (
    <main id="onboarding-container" className={styles.container} role="main" aria-label="온보딩">
      {/* Skip button */}
      <Link href="/auth/login" className={styles.skipButton} aria-label="온보딩 건너뛰기">
        건너뛰기
      </Link>

      {/* Slide content */}
      <div className={styles.content}>
        <div
          className={`${styles.slideWrapper} ${
            direction === 'forward'
              ? styles.slideForward
              : direction === 'backward'
                ? styles.slideBackward
                : ''
          }`}
          key={currentIndex}
        >
          <div className={styles.iconWrapper} aria-hidden="true">
            <span className={styles.icon}>{currentSlide.icon}</span>
          </div>

          <h1 className={styles.title}>{currentSlide.h}</h1>

          <p className={styles.description}>{currentSlide.p}</p>
        </div>

        {/* Progress indicators */}
        <div className={styles.indicators} role="tablist" aria-label="슬라이드 진행 상황">
          {slides.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`슬라이드 ${index + 1}`}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.indicatorActive : ''
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        {/* Screen reader announcement */}
        <div role="status" aria-live="polite" className="sr-only">
          슬라이드 {currentIndex + 1} / {slides.length}: {currentSlide.h}
        </div>

        {/* Navigation */}
        <nav className={styles.navigation} role="navigation" aria-label="온보딩 네비게이션">
          <button
            type="button"
            onClick={goToPrev}
            disabled={isFirstSlide}
            className={`${styles.button} ${styles.buttonSecondary}`}
            aria-label="이전 슬라이드"
            aria-disabled={isFirstSlide}
          >
            이전
          </button>

          {isLastSlide ? (
            <Link
              href="/auth/login"
              className={`${styles.button} ${styles.buttonPrimary}`}
              aria-label="ZZIK LIVE 시작하기"
            >
              시작하기
            </Link>
          ) : (
            <button
              type="button"
              onClick={goToNext}
              className={`${styles.button} ${styles.buttonPrimary}`}
              aria-label="다음 슬라이드"
            >
              다음
            </button>
          )}
        </nav>
      </div>
    </main>
  );
}

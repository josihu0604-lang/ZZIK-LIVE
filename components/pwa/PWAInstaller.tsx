// components/pwa/PWAInstaller.tsx
'use client';

import { useEffect, useState } from 'react';
import { isIOS } from '@/lib/utils/touch';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isPWAInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isPWAInstalled) {
      return;
    }

    // Check if user has dismissed the prompt
    const dismissedTime = localStorage.getItem('pwa-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        // Don't show again for 7 days
        return;
      }
    }

    // Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay
      setTimeout(() => {
        if (!dismissed) {
          setShowAndroidPrompt(true);
        }
      }, 5000); // Show after 5 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari
    if (isIOS() && !isPWAInstalled) {
      setTimeout(() => {
        if (!dismissed) {
          setShowIOSPrompt(true);
        }
      }, 10000); // Show after 10 seconds on iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [dismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // PWA installed successfully
    }

    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!showAndroidPrompt && !showIOSPrompt) {
    return null;
  }

  return (
    <>
      {/* Android/Chrome Install Prompt */}
      {showAndroidPrompt && (
        <div
          className="fixed bottom-20 left-4 right-4 p-4 bg-surface rounded-lg shadow-lg z-50 animate-slide-up"
          role="dialog"
          aria-labelledby="pwa-install-title"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-12 h-12 flex-shrink-0 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>

            <div className="flex-1">
              <h3 id="pwa-install-title" className="font-semibold text-base mb-1">
                앱으로 설치하기
              </h3>
              <p className="text-sm text-secondary mb-3">
                홈 화면에 추가하여 더 빠르고 편리하게 사용하세요!
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary btn-small flex-1"
                  aria-label="앱 설치하기"
                >
                  설치하기
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn btn-ghost btn-small"
                  aria-label="닫기"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {showIOSPrompt && (
        <div
          className="fixed bottom-20 left-4 right-4 p-4 bg-surface rounded-lg shadow-lg z-50 animate-slide-up"
          role="dialog"
          aria-labelledby="pwa-ios-title"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-12 h-12 flex-shrink-0 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>

            <div className="flex-1">
              <h3 id="pwa-ios-title" className="font-semibold text-base mb-1">
                홈 화면에 추가
              </h3>
              <p className="text-sm text-secondary mb-2">
                Safari에서 공유 버튼을 눌러 "홈 화면에 추가"를 선택하세요.
              </p>

              <div className="flex items-center gap-2 p-2 bg-subtle rounded text-xs mb-3">
                <svg
                  className="w-5 h-5 text-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>하단 중앙의 공유 버튼 → "홈 화면에 추가"</span>
              </div>

              <button
                onClick={handleDismiss}
                className="btn btn-ghost btn-small w-full"
                aria-label="닫기"
              >
                알겠습니다
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}

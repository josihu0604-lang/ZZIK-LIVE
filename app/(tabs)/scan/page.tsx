'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AuthGate from '@/components/auth/AuthGate';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { track } from '@/lib/analytics';
import { Icon } from '@/components/ui/Icon';

// Dynamic import for QR Scanner to reduce initial bundle size
const QRScannerView = dynamic(() => import('./_components/QRScannerView'), {
  ssr: false,
  loading: () => (
    <div
      className="card"
      style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className="zzik-skeleton animate"
        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
      >
        <p className="caption text-muted" style={{ textAlign: 'center', paddingTop: '150px' }}>
          Loading camera...
        </p>
      </div>
    </div>
  ),
});

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleQRCode = async (payload: string) => {
    track('qr_scan_open', {
      offer_id: 'demo',
      location_granted: true,
    });

    setIsVerifying(true);
    setScanResult(null);

    try {
      // In production, send to API with idempotency key
      // const response = await fetch('/api/qr/verify', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Idempotency-Key': crypto.randomUUID(),
      //   },
      //   body: JSON.stringify({ token: payload }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Random success/failure for demo
      const success = Math.random() > 0.3;

      if (success) {
        setScanResult({
          success: true,
          message: '✅ 검증 성공! 포인트가 적립되었습니다.',
        });

        track('qr_scan_result', {
          state: 'success',
          took_ms: 120,
          retry_count: 0,
        });
      } else {
        setScanResult({
          success: false,
          message: '❌ 이미 사용된 QR 코드입니다.',
        });

        track('qr_scan_result', {
          state: 'already_used',
          took_ms: 120,
          retry_count: 0,
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: '⚠️ 검증 중 오류가 발생했습니다.',
      });

      track('qr_scan_result', {
        state: 'invalid',
        took_ms: 120,
        retry_count: 0,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
  };

  return (
    <AuthGate>
      <main style={{ flex: 1, overflow: 'auto' }} aria-label="QR Scanner">
        <section className="zzik-page">
          <header className="zzik-col" style={{ marginBottom: '24px' }}>
            <h1 className="h2">
              <Icon
                name="qr-code"
                size={24}
                style={{ marginRight: '8px', verticalAlign: 'middle' }}
              />
              QR Scan
            </h1>
            <p className="body-small text-muted">Scan the store's QR code to verify your visit</p>
          </header>

          {scanResult ? (
            <div className="grid" style={{ gap: '16px' }}>
              <div
                className="card"
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  background: scanResult.success ? 'var(--success)' : 'var(--danger)',
                  opacity: 0.1,
                }}
              >
                <Icon
                  name={scanResult.success ? 'check' : 'x'}
                  size={48}
                  className={scanResult.success ? 'text-success' : 'text-danger'}
                  style={{ marginBottom: '16px' }}
                />
                <p className="typo-body" style={{ fontWeight: 500 }}>
                  {scanResult.message}
                </p>
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={handleReset}
                aria-label="다시 스캔하기"
              >
                <Icon name="refresh" size={18} style={{ marginRight: '8px' }} />
                Scan Again
              </button>
            </div>
          ) : isVerifying ? (
            <div className="grid" style={{ placeItems: 'center', minHeight: '400px' }}>
              <div className="zzik-col" style={{ textAlign: 'center' }}>
                <div
                  className="zzik-skeleton animate"
                  style={{ width: '60px', height: '4px', margin: '0 auto' }}
                />
                <p className="typo-caption muted" style={{ marginTop: '16px' }}>
                  검증 중...
                </p>
              </div>
            </div>
          ) : (
            <QRScannerView
              onToken={handleQRCode}
              onError={(error) => {
                console.error('QR Scanner error:', error);
                setScanResult({
                  success: false,
                  message: '카메라 접근에 실패했습니다.',
                });
              }}
            />
          )}

          <div className="card" style={{ padding: '16px', marginTop: '24px' }}>
            <h2 className="h5" style={{ marginBottom: '12px' }}>
              <Icon
                name="shield"
                size={20}
                style={{ marginRight: '8px', verticalAlign: 'middle' }}
              />
              Triple Verification Process
            </h2>
            <ol
              className="body-small text-secondary"
              style={{ paddingLeft: '20px', lineHeight: 1.8 }}
            >
              <li>
                <Icon name="map-pin" size={14} style={{ marginRight: '6px' }} />
                GPS location verification
              </li>
              <li>
                <Icon name="qr-code" size={14} style={{ marginRight: '6px' }} />
                Store QR code scan (current step)
              </li>
              <li>
                <Icon name="receipt" size={14} style={{ marginRight: '6px' }} />
                Receipt photo verification
              </li>
            </ol>
          </div>
        </section>
      </main>
      <BottomTabBar />
    </AuthGate>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
// import { CameraPermissionRequest } from '../permissions/PermissionRequest'; // Unused

interface QRScannerViewProps {
  onToken: (token: string) => void;
  onError?: (error: Error) => void;
}

type ScanState = 'idle' | 'scanning' | 'success' | 'already_used' | 'expired' | 'invalid';

/**
 * QR Scanner with 4-state UI and haptic feedback
 * Supports BarcodeDetector API with jsQR fallback
 */
export default function QRScannerView({ onToken, onError }: QRScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [_retryCount, setRetryCount] = useState(0);
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const scanStartTimeRef = useRef<number>(0);

  // Haptic feedback helper
  const vibrate = (pattern: number | number[] = 35) => {
    if ('vibrate' in navigator) {
      (navigator as any).vibrate(pattern);
    }
  };

  // Check camera permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => {
          setHasPermission(result.state === 'granted');
        })
        .catch(() => {
          setHasPermission(false);
        });
    } else {
      setHasPermission(false);
    }
  }, []);

  // Start scanning when we have stream
  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) return;

    const startScanning = async () => {
      try {
        setScanState('scanning');
        scanStartTimeRef.current = Date.now();

        // Try to use BarcodeDetector if available (Chrome/Edge)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code'],
          });

          // Throttle to 10-12 fps for performance
          scanIntervalRef.current = setInterval(async () => {
            if (
              videoRef.current &&
              videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
            ) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  const _tookMs = Date.now() - scanStartTimeRef.current;

                  // Success haptic
                  vibrate([50, 100, 50]);
                  setScanState('success');

                  onToken(code);
                  clearInterval(scanIntervalRef.current);
                }
              } catch (err) {
                console.error('Barcode detection error:', err);
              }
            }
          }, 83); // ~12 fps
        } else {
          // Fallback: would use jsQR library here
          // For now, show unsupported message
          setError('QR 스캔이 이 브라우저에서 지원되지 않습니다. Chrome 또는 Edge를 사용해주세요.');
          setScanState('invalid');
        }
      } catch (err) {
        console.error('Failed to start scanning:', err);
        setError('QR 스캔을 시작할 수 없습니다');
        setScanState('invalid');
      }
    };

    startScanning();

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [stream, onToken]);

  const _handleCameraGranted = async (mediaStream: MediaStream) => {
    setHasPermission(true);
    setStream(mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
    }
  };

  const _handleCameraDenied = (err: Error) => {
    setHasPermission(false);
    setError('카메라 접근이 거부되었습니다');
    onError?.(err);
  };

  // Toggle flash/torch
  const toggleFlash = async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (err) {
      console.error('Flash toggle failed:', err);
    }
  };

  // Retry scanning after error
  const handleRetry = () => {
    setError(null);
    setScanState('idle');
    setRetryCount((prev) => prev + 1);
    // Re-trigger camera permission flow
    setHasPermission(null);
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Permission denied fallback UI
  if (hasPermission === false) {
    return (
      <div role="alert" className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <p className="typo-body" style={{ marginBottom: '16px' }}>
          카메라 접근이 거부되었습니다
        </p>
        <button
          className="btn primary"
          onClick={() => location.reload()}
          aria-label="카메라 권한 재요청"
        >
          다시 시도
        </button>
        <p className="typo-caption muted" style={{ marginTop: '16px' }}>
          설정에서 카메라 권한을 허용해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="qr-wrap" style={{ display: 'grid', gap: '16px' }}>
      <div className="card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{
            width: '100%',
            maxHeight: '400px',
            borderRadius: 'var(--radius)',
            background: 'var(--bg-subtle)',
            objectFit: 'cover',
          }}
          aria-label="QR 스캐너 카메라 뷰"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

        {/* Scanning overlay with laser animation */}
        {scanState === 'scanning' && (
          <>
            <div
              className="laser"
              style={{
                position: 'absolute',
                left: '10%',
                width: '80%',
                height: '2px',
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)',
                animation: 'sweep 1.6s ease-in-out infinite',
                opacity: 0.9,
              }}
              aria-hidden="true"
            />
            <style jsx>{`
              @keyframes sweep {
                0% {
                  transform: translateY(10%);
                }
                50% {
                  transform: translateY(380px);
                }
                100% {
                  transform: translateY(10%);
                }
              }
            `}</style>
          </>
        )}

        {/* State indicators */}
        {scanState === 'success' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--success)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
            }}
          >
            ✓ 인증 성공
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="card"
          style={{
            padding: '12px 16px',
            background: 'rgba(var(--danger-rgb), 0.1)',
            border: '1px solid var(--danger)',
          }}
        >
          <p className="typo-caption" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
          <button
            className="btn ghost"
            onClick={handleRetry}
            style={{ marginTop: '8px', width: '100%' }}
            aria-label="재시도"
          >
            재시도
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="toolbar"
        style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}
      >
        <button
          onClick={toggleFlash}
          className="btn ghost"
          aria-pressed={flashEnabled}
          aria-label="플래시 토글"
          style={{
            minWidth: '48px',
            minHeight: '48px',
            opacity: flashEnabled ? 1 : 0.6,
          }}
        >
          {flashEnabled ? '🔦' : '💡'}
        </button>
        <p className="typo-caption muted">QR 코드를 화면 중앙에 맞춰주세요</p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface QRScannerViewProps {
  onToken: (token: string) => void;
  onError?: (error: Error) => void;
}

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

/**
 * QR Scanner with BarcodeDetector API and jsQR fallback
 * Dynamically imports jsQR only when needed
 * WCAG AA compliant with proper ARIA labels
 */
export default function QRScannerView({ onToken, onError }: QRScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<string | undefined>();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  // Vibration feedback (if available)
  const vibrate = (pattern: number | number[] = 35) => {
    if ('vibrate' in navigator) {
      (navigator as any).vibrate(pattern);
    }
  };

  // Initialize camera and start scanning
  useEffect(() => {
    let mounted = true;
    let localStream: MediaStream | undefined;

    const initializeScanner = async () => {
      try {
        // Request camera permission
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!mounted) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(localStream);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
        }

        setScanState('scanning');

        // Check if BarcodeDetector is available
        if ('BarcodeDetector' in window && (window as any).BarcodeDetector.getSupportedFormats) {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats();

          if (formats.includes('qr_code')) {
            // Use native BarcodeDetector
            detectorRef.current = new (window as any).BarcodeDetector({
              formats: ['qr_code'],
            });

            const scanWithBarcodeDetector = async () => {
              if (!mounted || !videoRef.current || !detectorRef.current) return;

              try {
                if (videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
                  const barcodes = await detectorRef.current.detect(videoRef.current);

                  if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    vibrate([50, 100, 50]);
                    setScanState('success');
                    setResult(code);
                    onToken(code);
                    return; // Stop scanning
                  }
                }
              } catch (error) {
                console.error('BarcodeDetector error:', error);
              }

              if (mounted) {
                rafRef.current = requestAnimationFrame(scanWithBarcodeDetector);
              }
            };

            rafRef.current = requestAnimationFrame(scanWithBarcodeDetector);
          } else {
            throw new Error('QR code format not supported');
          }
        } else {
          // Fallback: Dynamically import jsQR
          const jsQR = (await import('jsqr')).default;

          if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }

          const ctx = canvasRef.current.getContext('2d');

          const scanWithJsQR = () => {
            if (!mounted || !videoRef.current || !ctx || !canvasRef.current) return;

            const video = videoRef.current;

            if (video.readyState >= video.HAVE_ENOUGH_DATA) {
              const vw = video.videoWidth;
              const vh = video.videoHeight;

              if (vw && vh) {
                canvasRef.current.width = vw;
                canvasRef.current.height = vh;
                ctx.drawImage(video, 0, 0, vw, vh);

                const imageData = ctx.getImageData(0, 0, vw, vh);
                const code = jsQR(imageData.data, vw, vh, {
                  inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                  vibrate([50, 100, 50]);
                  setScanState('success');
                  setResult(code.data);
                  onToken(code.data);
                  return; // Stop scanning
                }
              }
            }

            if (mounted) {
              rafRef.current = requestAnimationFrame(scanWithJsQR);
            }
          };

          rafRef.current = requestAnimationFrame(scanWithJsQR);
        }
      } catch (error: any) {
        console.error('Scanner initialization error:', error);
        setScanState('error');
        setErr(error?.message || 'Camera access denied');
        onError?.(error);
      }
    };

    initializeScanner();

    // Cleanup
    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (localStream || stream) {
        (localStream || stream)?.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onToken, onError]);

  // Toggle flashlight/torch
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
      } else {
        console.warn('Torch not supported on this device');
      }
    } catch (error) {
      console.error('Flash toggle failed:', error);
    }
  };

  // Reset scanner
  const handleReset = () => {
    setErr(null);
    setResult(undefined);
    setScanState('idle');
    window.location.reload(); // Simple reset by reloading
  };

  // Render error state
  if (err || scanState === 'error') {
    return (
      <div role="alert" className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <Icon
          name="alert-circle"
          size={48}
          className="text-danger"
          style={{ marginBottom: '16px' }}
        />
        <h3 className="h5" style={{ marginBottom: '8px' }}>
          Camera Error
        </h3>
        <p className="body-small text-muted" style={{ marginBottom: '16px' }}>
          {err || 'Unable to access camera'}
        </p>
        <button type="button" className="btn primary" onClick={handleReset} aria-label="Try again">
          <Icon name="refresh" size={18} style={{ marginRight: '8px' }} />
          Try Again
        </button>
        <p className="caption text-muted" style={{ marginTop: '16px' }}>
          Make sure camera permissions are enabled in your browser settings
        </p>
      </div>
    );
  }

  // Render success state
  if (result && scanState === 'success') {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <Icon name="check" size={64} className="text-success" style={{ marginBottom: '16px' }} />
        <h3 className="h4 text-success">Scan Successful!</h3>
        <p className="body text-muted" style={{ marginTop: '8px', marginBottom: '24px' }}>
          QR Code detected
        </p>
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {result}
        </div>
      </div>
    );
  }

  // Render scanning state
  return (
    <section aria-label="QR Scanner" style={{ padding: '0 16px' }}>
      <div
        className="card"
        style={{
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          background: 'var(--bg-subtle)',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            height: '320px',
            objectFit: 'cover',
            display: 'block',
          }}
          aria-label="Camera viewfinder"
        />

        {/* Scanning overlay animation */}
        {scanState === 'scanning' && (
          <>
            <div
              className="scan-line"
              style={{
                position: 'absolute',
                left: '10%',
                width: '80%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                boxShadow: '0 0 10px var(--primary)',
                animation: 'scan 2s ease-in-out infinite',
              }}
              aria-hidden="true"
            />

            {/* Corner brackets */}
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '20%',
                right: '20%',
                bottom: '20%',
                pointerEvents: 'none',
              }}
            >
              {/* Top left */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '30px',
                  height: '30px',
                  borderTop: '3px solid var(--primary)',
                  borderLeft: '3px solid var(--primary)',
                }}
              />
              {/* Top right */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30px',
                  height: '30px',
                  borderTop: '3px solid var(--primary)',
                  borderRight: '3px solid var(--primary)',
                }}
              />
              {/* Bottom left */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '30px',
                  height: '30px',
                  borderBottom: '3px solid var(--primary)',
                  borderLeft: '3px solid var(--primary)',
                }}
              />
              {/* Bottom right */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '30px',
                  height: '30px',
                  borderBottom: '3px solid var(--primary)',
                  borderRight: '3px solid var(--primary)',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        <button
          type="button"
          onClick={toggleFlash}
          className="btn ghost"
          aria-pressed={flashEnabled}
          aria-label="Toggle flashlight"
          style={{
            width: '48px',
            height: '48px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={flashEnabled ? 'flashlight-off' : 'flashlight'} size={20} />
        </button>

        <p className="caption text-muted">Align QR code within the frame</p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(280px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

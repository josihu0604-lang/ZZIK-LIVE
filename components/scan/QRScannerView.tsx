'use client';

import { useState, useEffect } from 'react';
import { Flashlight, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { getButtonClasses } from '@/lib/button-presets';
import { ScanError } from '@/types';

interface QRScannerViewProps {
  onResult: (payload: string) => void;
  onError: (code: ScanError) => void;
  onClose?: () => void;
}

export default function QRScannerView({
  onResult,
  onError,
  onClose,
}: QRScannerViewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Request camera permission
    requestCameraPermission();

    return () => {
      // Cleanup: stop camera
      stopCamera();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setHasPermission(true);
      setIsScanning(true);
      // In production, initialize QR scanner library here (e.g., zxing-wasm)
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      onError({ code: 'denied', message: 'Camera permission denied' });
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    // Stop camera stream
  };

  const handleFlashToggle = () => {
    setFlashEnabled((prev) => !prev);
    // In production, control camera flash
  };

  const handleGalleryPick = () => {
    // In production, open gallery and scan from image
    console.log('Open gallery');
  };

  const handleManualEntry = () => {
    // In production, show manual QR code input
    const mockQRData = 'VOUCHER:abc123';
    onResult(mockQRData);
  };

  if (hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>카메라 권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-base)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="rounded-full bg-[var(--danger)]/10 p-6 mx-auto mb-4 w-fit">
            <AlertCircle size={48} className="text-[var(--danger)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            카메라 권한이 필요합니다
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            QR 코드를 스캔하려면 카메라 접근 권한을 허용해 주세요.
          </p>
          <button
            onClick={requestCameraPermission}
            className={getButtonClasses('primary', 'md')}
          >
            권한 허용하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Camera Preview Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/60 text-center">
          <p className="text-sm">카메라 프리뷰</p>
          <p className="text-xs mt-2">(실제 구현 시 카메라 스트림 표시)</p>
        </div>
      </div>

      {/* Viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64 border-2 border-white/85 rounded-[var(--radius-lg)]">
          {/* Scan line animation */}
          <div
            className="absolute inset-x-0 h-0.5 bg-[var(--brand)]/80 animate-scan-line"
            style={{
              animation: 'scanLine 2s linear infinite',
            }}
          />
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-[var(--bg-elev-1)] flex items-center justify-center text-white"
          aria-label="닫기"
        >
          <X size={24} strokeWidth={2} />
        </button>
        <p className="text-white text-sm font-medium">
          QR 코드를 프레임에 맞춰 주세요
        </p>
        <div className="w-10" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(24px+env(safe-area-inset-bottom))] flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[2px]">
        <button
          onClick={handleFlashToggle}
          className={`h-14 w-14 rounded-full flex items-center justify-center ${
            flashEnabled
              ? 'bg-[var(--brand)] text-white'
              : 'bg-[var(--bg-elev-1)] text-white/80'
          } transition-colors`}
          aria-label="플래시"
          aria-pressed={flashEnabled}
        >
          <Flashlight size={24} strokeWidth={2} />
        </button>

        <button
          onClick={handleGalleryPick}
          className="h-14 w-14 rounded-full bg-[var(--bg-elev-1)] text-white/80 flex items-center justify-center"
          aria-label="갤러리에서 선택"
        >
          <ImageIcon size={24} strokeWidth={2} />
        </button>

        <button
          onClick={handleManualEntry}
          className="px-4 h-10 rounded-full bg-[var(--bg-elev-1)] text-white text-sm font-medium"
        >
          수동 입력
        </button>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
}

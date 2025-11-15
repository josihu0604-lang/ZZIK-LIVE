'use client';

import { useState } from 'react';

export function LocationPermissionRequest({
  onGranted,
  onDenied,
}: {
  onGranted: (position: GeolocationPosition) => void;
  onDenied?: (error: GeolocationPositionError) => void;
}) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onGranted(position);
          setIsRequesting(false);
        },
        (error) => {
          const errorMessage =
            error.code === error.PERMISSION_DENIED
              ? '위치 권한이 거부되었습니다'
              : error.code === error.POSITION_UNAVAILABLE
                ? '위치 정보를 사용할 수 없습니다'
                : error.code === error.TIMEOUT
                  ? '위치 확인 시간이 초과되었습니다'
                  : '위치 권한 요청에 실패했습니다';

          setError(errorMessage);
          setIsRequesting(false);
          onDenied?.(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (_error) {
      setError('브라우저가 위치 서비스를 지원하지 않습니다');
      setIsRequesting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
      <div className="grid" style={{ gap: '16px' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>위치 권한이 필요합니다</h3>
          <p className="typo-caption muted">
            주변 오퍼를 찾고 삼중 검증을 위해 위치 정보가 필요합니다
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleRequest}
          disabled={isRequesting}
          aria-label="위치 권한 허용하기"
        >
          {isRequesting ? '요청 중...' : '위치 권한 허용'}
        </button>

        {error && (
          <div role="alert" className="typo-caption" style={{ color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export function CameraPermissionRequest({
  onGranted,
  onDenied,
}: {
  onGranted: (stream: MediaStream) => void;
  onDenied?: (error: Error) => void;
}) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      onGranted(stream);
      setIsRequesting(false);
    } catch (err: any) {
      const errorMessage =
        err.name === 'NotAllowedError'
          ? '카메라 권한이 거부되었습니다'
          : err.name === 'NotFoundError'
            ? '카메라를 찾을 수 없습니다'
            : err.name === 'NotReadableError'
              ? '카메라가 이미 사용 중입니다'
              : '카메라 권한 요청에 실패했습니다';

      setError(errorMessage);
      setIsRequesting(false);
      onDenied?.(err);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
      <div className="grid" style={{ gap: '16px' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>카메라 권한이 필요합니다</h3>
          <p className="typo-caption muted">QR 코드 스캔을 위해 카메라 접근이 필요합니다</p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleRequest}
          disabled={isRequesting}
          aria-label="카메라 권한 허용하기"
        >
          {isRequesting ? '요청 중...' : '카메라 권한 허용'}
        </button>

        {error && (
          <div role="alert" className="typo-caption" style={{ color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

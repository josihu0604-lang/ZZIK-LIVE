'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/client';

type PermissionStatus = 'pending' | 'granted' | 'denied';

interface Permissions {
  location: PermissionStatus;
  camera: PermissionStatus;
}

export default function PermissionsPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permissions>({
    location: 'pending',
    camera: 'pending',
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const requestLocationPermission = async () => {
    setIsRequesting(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      // Success
      setPermissions((prev) => ({ ...prev, location: 'granted' }));

      // Track permission grant (with geohash5 only, no raw coordinates)
      trackEvent('permission_location_granted', JSON.stringify({
        geohash5: 'xxxxx', // Would use actual geohash5 from position
        accuracy_m: Math.round(position.coords.accuracy),
      }));

      return true;
    } catch (error) {
      // Denied or error
      setPermissions((prev) => ({ ...prev, location: 'denied' }));

      trackEvent('permission_location_denied', JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown',
      }));

      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const requestCameraPermission = async () => {
    setIsRequesting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      // Stop stream immediately, we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      setPermissions((prev) => ({ ...prev, camera: 'granted' }));

      trackEvent('permission_camera_granted', '{}');

      return true;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, camera: 'denied' }));

      trackEvent('permission_camera_denied', JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown',
      }));

      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestAll = async () => {
    await requestLocationPermission();
    await requestCameraPermission();
  };

  const handleContinue = () => {
    if (permissions.location === 'denied') {
      // Store simulation mode flag
      if (typeof window !== 'undefined') {
        localStorage.setItem('zzik_simulation_mode', 'true');
      }
    }

    router.push('/auth/login');
  };

  const allGranted = permissions.location === 'granted' && permissions.camera === 'granted';
  const anyDenied = permissions.location === 'denied' || permissions.camera === 'denied';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      {/* Header */}
      <div className="mb-8 mt-8">
        <h1 className="mb-2 text-3xl font-bold">권한 요청</h1>
        <p className="text-slate-400">최상의 경험을 위해 다음 권한이 필요해요</p>
      </div>

      {/* Permission Cards */}
      <div className="space-y-4">
        {/* Location Permission */}
        <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur">
          <div className="mb-4 flex items-start">
            <div className="mr-4 rounded-full bg-cyan-500/20 p-3">
              <svg
                className="h-6 w-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold">위치</h3>
              <p className="text-sm text-slate-400">
                내 주변 오퍼를 찾고, 방문을 증명하는 데 필요해요
              </p>
            </div>
            {permissions.location === 'granted' && (
              <div className="ml-2 text-green-500" aria-label="허용됨">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
          {permissions.location === 'denied' && (
            <div className="mt-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
              ⚠️ 위치 권한이 거부되었습니다. 시뮬레이션 모드로 체험할 수 있어요.
            </div>
          )}
        </div>

        {/* Camera Permission */}
        <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur">
          <div className="mb-4 flex items-start">
            <div className="mr-4 rounded-full bg-cyan-500/20 p-3">
              <svg
                className="h-6 w-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold">카메라</h3>
              <p className="text-sm text-slate-400">
                QR 코드를 스캔하고, 영수증을 인증하는 데 필요해요
              </p>
            </div>
            {permissions.camera === 'granted' && (
              <div className="ml-2 text-green-500" aria-label="허용됨">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
          {permissions.camera === 'denied' && (
            <div className="mt-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
              ⚠️ 카메라 권한이 거부되었습니다. 일부 기능이 제한될 수 있어요.
            </div>
          )}
        </div>
      </div>

      {/* Simulation Mode Notice */}
      {anyDenied && (
        <div className="mt-6 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-400">
          <p className="font-semibold">🎭 시뮬레이션 모드</p>
          <p className="mt-1 text-xs">
            권한 없이도 앱을 체험할 수 있어요. 하지만 일부 기능이 제한되며, 실제 보상을 받을 수
            없습니다.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto space-y-3 pt-8">
        {!allGranted && permissions.location === 'pending' && (
          <button
            onClick={handleRequestAll}
            disabled={isRequesting}
            className="w-full rounded-xl bg-cyan-500 py-4 text-lg font-semibold text-white transition-colors hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2 disabled:bg-slate-700"
          >
            {isRequesting ? '요청 중...' : '권한 허용하기'}
          </button>
        )}

        <button
          onClick={handleContinue}
          className="w-full rounded-xl border border-slate-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          {allGranted ? '계속하기' : anyDenied ? '시뮬레이션 모드로 계속' : '나중에 하기'}
        </button>
      </div>

      {/* Privacy Notice */}
      <p className="mt-4 text-center text-xs text-slate-500">
        위치 정보는 geohash5 형태로만 저장되며, 미션 완료 후 즉시 파기됩니다.
      </p>
    </div>
  );
}

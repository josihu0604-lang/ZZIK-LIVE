'use client';

import { useState } from 'react';
import QRScannerView from '@/components/scan/QRScannerView';
import { ScanResult, ScanError } from '@/types';
import { analytics } from '@/lib/analytics';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getButtonClasses } from '@/lib/button-presets';

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showScanner, setShowScanner] = useState(true);

  const handleScanResult = (result: { text: string; ts: number; source: string }) => {
    const payload = result.text;
    console.log('Scan result:', payload);

    // Parse QR code payload
    let scanResult: ScanResult;

    if (payload.startsWith('VOUCHER:')) {
      const voucherId = payload.replace('VOUCHER:', '');
      scanResult = {
        kind: 'voucher',
        payload,
        voucherId,
        timestamp: new Date(),
      };
      analytics.qrScanResult('voucher');
    } else if (payload.startsWith('CHECKIN:')) {
      const placeId = payload.replace('CHECKIN:', '');
      scanResult = {
        kind: 'checkin',
        payload,
        placeId,
        timestamp: new Date(),
      };
      analytics.qrScanResult('checkin');
    } else if (payload.startsWith('MEMBER:')) {
      scanResult = {
        kind: 'membership',
        payload,
        timestamp: new Date(),
      };
      analytics.qrScanResult('membership');
    } else {
      scanResult = {
        kind: 'unknown',
        payload,
        timestamp: new Date(),
      };
      analytics.qrScanResult('unknown');
    }

    setScanResult(scanResult);
    setShowScanner(false);
  };

  const handleScanError = (error: ScanError) => {
    console.error('Scan error:', error);
    analytics.qrError((error.code || 'unknown') as 'not_found' | 'timeout' | 'denied' | 'unavailable' | 'unknown');
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  const handleReset = () => {
    setScanResult(null);
    setShowScanner(true);
    analytics.qrScanStart();
  };

  const handleConfirmUse = () => {
    if (scanResult?.voucherId) {
      console.log('Use voucher:', scanResult.voucherId);
      // In production, call API to use voucher
      alert('체험권이 사용되었습니다!');
      setScanResult(null);
      setShowScanner(true);
    }
  };

  if (showScanner) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <QRScannerView
          onResult={handleScanResult}
          continuous={false}
        />
      </div>
    );
  }

  // Result sheet
  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-[var(--elev-2)]">
        {/* Icon based on result kind */}
        <div className="flex justify-center mb-4">
          {scanResult?.kind === 'voucher' && (
            <div className="rounded-full bg-[var(--success)]/10 p-6">
              <CheckCircle size={48} className="text-[var(--success)]" />
            </div>
          )}
          {scanResult?.kind === 'checkin' && (
            <div className="rounded-full bg-[var(--info)]/10 p-6">
              <CheckCircle size={48} className="text-[var(--info)]" />
            </div>
          )}
          {scanResult?.kind === 'membership' && (
            <div className="rounded-full bg-[var(--brand)]/10 p-6">
              <CheckCircle size={48} className="text-[var(--brand)]" />
            </div>
          )}
          {scanResult?.kind === 'unknown' && (
            <div className="rounded-full bg-[var(--warning)]/10 p-6">
              <AlertTriangle size={48} className="text-[var(--warning)]" />
            </div>
          )}
        </div>

        {/* Result info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {scanResult?.kind === 'voucher' && '체험권 확인됨'}
            {scanResult?.kind === 'checkin' && '체크인 완료'}
            {scanResult?.kind === 'membership' && '멤버십 확인됨'}
            {scanResult?.kind === 'unknown' && '알 수 없는 QR 코드'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {scanResult?.kind === 'voucher' &&
              '체험권을 사용하시겠습니까?'}
            {scanResult?.kind === 'checkin' &&
              '장소에 체크인되었습니다.'}
            {scanResult?.kind === 'membership' &&
              '멤버십이 확인되었습니다.'}
            {scanResult?.kind === 'unknown' &&
              '이 QR 코드는 ZZIK LIVE에서 지원하지 않습니다.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-[var(--sp-2)]">
          {scanResult?.kind === 'voucher' && (
            <button
              onClick={handleConfirmUse}
              className={getButtonClasses('primary', 'md') + ' w-full'}
            >
              체험권 사용하기
            </button>
          )}

          <button
            onClick={handleReset}
            className={getButtonClasses('ghost', 'md') + ' w-full'}
          >
            다시 스캔하기
          </button>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] text-xs font-mono text-[var(--text-tertiary)]">
            <p>Kind: {scanResult?.kind}</p>
            <p className="truncate">Payload: {scanResult?.payload}</p>
          </div>
        )}
      </div>
    </div>
  );
}

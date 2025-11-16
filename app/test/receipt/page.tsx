'use client';

import { useState } from 'react';
import ReceiptUploader from '@/components/scan/ReceiptUploader';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { ReceiptData } from '@/lib/receipt-ocr';

/**
 * Receipt OCR Test Page
 * Tests Tesseract.js integration with Korean+English support
 */
export default function ReceiptTestPage() {
  const [verifiedReceipts, setVerifiedReceipts] = useState<ReceiptData[]>([]);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  const handleReceiptVerified = (receipt: ReceiptData) => {
    console.log('✅ Receipt verified:', receipt);
    setLastReceipt(receipt);
    setVerifiedReceipts((prev) => [receipt, ...prev].slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <FileText className="text-blue-600" size={28} />
            Receipt OCR Test - Tesseract.js
          </h1>
          <p className="text-gray-600 text-sm">
            영수증 이미지 업로드 후 OCR로 자동 인식 (한국어 + 영어 지원)
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">ㄱ4: Receipt OCR</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Tesseract.js 6.0.1
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
              Worker 기반 비동기 처리
            </span>
          </div>
        </div>

        {/* Upload Component */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">영수증 업로드</h2>
          <ReceiptUploader
            onReceiptVerified={handleReceiptVerified}
            requirements={{
              minConfidence: 60, // 60% 이상
              minAmount: 0,
            }}
          />
        </div>

        {/* Last Receipt Detail */}
        {lastReceipt && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              최근 인식 결과
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">가게 이름</p>
                <p className="font-medium">
                  {lastReceipt.storeName || '미인식'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">날짜</p>
                <p className="font-medium">{lastReceipt.date || '미인식'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">시간</p>
                <p className="font-medium">{lastReceipt.time || '미인식'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">금액</p>
                <p className="font-medium text-lg text-green-600">
                  {lastReceipt.totalAmount !== undefined
                    ? `${lastReceipt.totalAmount.toLocaleString()}원`
                    : '미인식'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">결제 방법</p>
                <p className="font-medium">
                  {lastReceipt.paymentMethod || '미인식'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">OCR 정확도</p>
                <p className="font-medium">
                  {lastReceipt.confidence.toFixed(1)}%
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      lastReceipt.confidence >= 80
                        ? 'bg-green-500'
                        : lastReceipt.confidence >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${lastReceipt.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Raw Text */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                원본 텍스트 (Raw OCR Output)
              </p>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                {lastReceipt.rawText}
              </pre>
            </div>
          </div>
        )}

        {/* History */}
        {verifiedReceipts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              인식 히스토리 (최근 5개)
            </h2>
            <div className="space-y-3">
              {verifiedReceipts.map((receipt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {receipt.storeName || '가게명 미인식'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {receipt.date || '날짜 미인식'} •{' '}
                      {receipt.totalAmount !== undefined
                        ? `${receipt.totalAmount.toLocaleString()}원`
                        : '금액 미인식'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        receipt.confidence >= 80
                          ? 'text-green-600'
                          : receipt.confidence >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {receipt.confidence.toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testing Instructions */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">테스트 가이드</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• 영수증 이미지 업로드 (JPG, PNG, WEBP)</li>
            <li>• OCR 진행률 확인 (0-100%)</li>
            <li>• 인식 결과 확인 (가게명, 날짜, 금액)</li>
            <li>• 정확도 확인 (60% 이상 권장)</li>
            <li>• 원본 텍스트 확인 가능</li>
            <li>• 한국어 + 영어 동시 지원</li>
          </ul>
        </div>

        {/* Expected Results */}
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ 기대 결과 (ㄱ4)
          </h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>✓ Tesseract.js Worker 정상 초기화</li>
            <li>✓ 한국어 + 영어 동시 인식</li>
            <li>✓ 비동기 처리 (메인 스레드 블로킹 없음)</li>
            <li>✓ 실시간 진행률 표시 (0-100%)</li>
            <li>✓ 가게명, 날짜, 금액 자동 추출</li>
            <li>✓ 정확도 측정 (60-100%)</li>
            <li>✓ Triple verification 완성 (GPS + QR + Receipt)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

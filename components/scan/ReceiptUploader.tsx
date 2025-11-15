'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { parseReceiptData, validateReceiptData, type ReceiptData } from '@/lib/receipt-ocr';

interface ReceiptUploaderProps {
  onReceiptVerified: (receipt: ReceiptData) => void;
  requirements?: {
    minAmount?: number;
    maxAmount?: number;
    requiredDate?: string;
    requiredStoreName?: string;
    minConfidence?: number;
  };
}

/**
 * Receipt Upload and OCR Component
 * Triple verification의 마지막 단계 (GPS + QR + Receipt)
 */
export default function ReceiptUploader({
  onReceiptVerified,
  requirements = {},
}: ReceiptUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Initialize OCR Worker
  const initWorker = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(new URL('../../workers/ocr-worker.ts', import.meta.url));

      worker.onmessage = (e) => {
        const msg = e.data;

        if (msg.type === 'ready') {
          console.log('✅ OCR Worker ready');
        }

        if (msg.type === 'progress') {
          setProgress(msg.progress);
        }

        if (msg.type === 'result') {
          const receipt = parseReceiptData(msg.text, msg.confidence);
          setReceiptData(receipt);

          // Validate against requirements
          const validation = validateReceiptData(receipt, requirements);
          setValidationResult(validation);

          if (validation.isValid) {
            onReceiptVerified(receipt);
          }

          setIsProcessing(false);
        }

        if (msg.type === 'error') {
          setError(msg.error);
          setIsProcessing(false);
        }
      };

      worker.onerror = (err) => {
        console.error('OCR Worker error:', err);
        setError('OCR Worker initialization failed');
      };

      workerRef.current = worker;

      // Initialize worker
      worker.postMessage({ type: 'init' });
    } catch (err: any) {
      setError(`Failed to initialize OCR: ${err.message}`);
    }
  }, [requirements, onReceiptVerified]);

  // Initialize worker on mount
  useState(() => {
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  });

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setPreviewUrl(imageUrl);

      // Start OCR processing
      setIsProcessing(true);
      setProgress(0);
      setError('');
      setReceiptData(null);
      setValidationResult(null);

      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'recognize',
          imageUrl,
          jobId: `receipt-${Date.now()}`,
        });
      }
    };

    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!previewUrl ? (
          <div className="space-y-3">
            <Upload className="mx-auto text-gray-400" size={48} />
            <div>
              <p className="text-lg font-medium text-gray-700">영수증 이미지 업로드</p>
              <p className="text-sm text-gray-500 mt-1">
                클릭하거나 드래그 앤 드롭으로 업로드
              </p>
            </div>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP 지원</p>
          </div>
        ) : (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewUrl('');
                setReceiptData(null);
                setValidationResult(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              다른 이미지 선택
            </button>
          </div>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <span className="font-medium text-blue-900">OCR 처리 중...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 mt-2">{progress}% 완료</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-red-900">오류 발생</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Receipt Data Display */}
      {receiptData && validationResult && (
        <div
          className={`rounded-lg p-4 ${
            validationResult.isValid ? 'bg-green-50' : 'bg-yellow-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            {validationResult.isValid ? (
              <Check className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600" size={20} />
            )}
            <h3
              className={`font-semibold ${
                validationResult.isValid ? 'text-green-900' : 'text-yellow-900'
              }`}
            >
              {validationResult.isValid ? '영수증 검증 성공' : '영수증 검증 필요'}
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            {receiptData.storeName && (
              <div className="flex justify-between">
                <span className="text-gray-600">가게 이름:</span>
                <span className="font-medium">{receiptData.storeName}</span>
              </div>
            )}
            {receiptData.date && (
              <div className="flex justify-between">
                <span className="text-gray-600">날짜:</span>
                <span className="font-medium">{receiptData.date}</span>
              </div>
            )}
            {receiptData.totalAmount !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">금액:</span>
                <span className="font-medium">
                  {receiptData.totalAmount.toLocaleString()}원
                </span>
              </div>
            )}
            {receiptData.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">결제 방법:</span>
                <span className="font-medium">{receiptData.paymentMethod}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">정확도:</span>
              <span className="font-medium">{receiptData.confidence.toFixed(1)}%</span>
            </div>
          </div>

          {/* Validation Errors/Warnings */}
          {validationResult.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {validationResult.errors.map((err: string, idx: number) => (
                <p key={idx} className="text-xs text-red-700 flex items-start gap-1">
                  <X size={14} className="flex-shrink-0 mt-0.5" />
                  {err}
                </p>
              ))}
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {validationResult.warnings.map((warn: string, idx: number) => (
                <p key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {warn}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for image preprocessing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

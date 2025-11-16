'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCw, Cpu } from 'lucide-react';

interface QRScannerViewProps {
  onResult: (result: { text: string; ts: number; source: string; confidence?: number }) => void;
  continuous?: boolean;
  decoder?: 'native' | 'jsQR' | 'ZXing';
  preferredCamera?: 'user' | 'environment';
  drawCorners?: boolean;
  telemetry?: { postEvery?: number };
  consensusThreshold?: number; // Number of consecutive matches required (default: 3)
}

interface WorkerResultMessage {
  type: 'result' | 'error' | 'ready';
  text?: string;
  format?: string;
  frameId?: number;
  error?: string;
  fps?: number;
  decodeTime?: number;
  corners?: Array<{ x: number; y: number }>;
}

/**
 * 실제 카메라 + QR 디코딩 스캐너 (Worker 기반)
 * ZXing Worker로 메인 스레드 블로킹 방지, 60 FPS 유지
 */
export default function QRScannerView({
  onResult,
  continuous = true,
  decoder = 'ZXing',
  preferredCamera = 'environment',
  drawCorners = true,
  telemetry,
  consensusThreshold = 3,
}: QRScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const lastScanRef = useRef<number>(0);
  const frameIdRef = useRef<number>(0);
  const pendingFramesRef = useRef<Set<number>>(new Set());
  
  // Consensus tracking
  const consensusBufferRef = useRef<Array<{ text: string; ts: number; source: string }>>([]); 
  const lastConsensusTextRef = useRef<string>('');

  const [hasCamera, setHasCamera] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(preferredCamera);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [workerReady, setWorkerReady] = useState(false);
  const [fps, setFps] = useState<number>(0);
  const [decodeTime, setDecodeTime] = useState<number>(0);
  const [consensusProgress, setConsensusProgress] = useState<number>(0); // 0-100%
  const [detectedCorners, setDetectedCorners] = useState<Array<{ x: number; y: number }>>([]);

  // Consensus validation
  const validateConsensus = useCallback((newText: string, source: string): boolean => {
    const now = Date.now();
    const buffer = consensusBufferRef.current;

    // Add to buffer
    buffer.push({ text: newText, ts: now, source });

    // Keep only last 10 reads (sliding window)
    if (buffer.length > 10) {
      buffer.shift();
    }

    // Filter recent reads (within last 1 second)
    const recentReads = buffer.filter((r) => now - r.ts < 1000);

    // Count consecutive matches at the end
    let consecutiveMatches = 0;
    for (let i = recentReads.length - 1; i >= 0; i--) {
      if (recentReads[i].text === newText) {
        consecutiveMatches++;
      } else {
        break; // Stop on first mismatch
      }
    }

    // Update consensus progress
    const progress = Math.min(100, (consecutiveMatches / consensusThreshold) * 100);
    setConsensusProgress(progress);

    // Check if threshold met
    if (consecutiveMatches >= consensusThreshold) {
      // Clear buffer after successful consensus
      consensusBufferRef.current = [];
      lastConsensusTextRef.current = newText;
      setConsensusProgress(0);
      return true;
    }

    return false;
  }, [consensusThreshold]);

  // Worker 초기화
  const initWorker = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Web Worker 생성
      const worker = new Worker(new URL('../../workers/zxing-worker.ts', import.meta.url));

      worker.onmessage = (e: MessageEvent<WorkerResultMessage>) => {
        const msg = e.data;

        if (msg.type === 'ready') {
          setWorkerReady(true);
          console.log('✅ ZXing Worker ready');
          return;
        }

        if (msg.type === 'error') {
          console.error('Worker decode error:', msg.error);
          pendingFramesRef.current.delete(msg.frameId || 0);
          return;
        }

        if (msg.type === 'result') {
          // Remove from pending frames
          pendingFramesRef.current.delete(msg.frameId || 0);

          // Update telemetry
          if (msg.fps !== undefined) setFps(msg.fps);
          if (msg.decodeTime !== undefined) setDecodeTime(msg.decodeTime);

          // Update detected corners for visualization
          if (msg.corners && msg.corners.length > 0) {
            setDetectedCorners(msg.corners);
          } else {
            setDetectedCorners([]);
          }

          // Handle successful decode
          if (msg.text) {
            const now = Date.now();

            // Validate with consensus algorithm
            const consensusValid = validateConsensus(msg.text, msg.format || 'ZXing');

            if (!consensusValid) {
              // Not enough consecutive matches yet
              return;
            }

            // Prevent duplicate scans
            if (!continuous && now - lastScanRef.current < 2000) {
              return;
            }

            lastScanRef.current = now;
            onResult({
              text: msg.text,
              ts: now,
              source: msg.format || 'ZXing',
              confidence: 100, // Consensus validated
            });
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setWorkerReady(false);
      };

      workerRef.current = worker;

      // Initialize worker
      worker.postMessage({ type: 'init' });
    } catch (err) {
      console.error('Worker initialization failed:', err);
      setError('Failed to initialize QR decoder');
    }
  }, [continuous, onResult, validateConsensus]);

  // 카메라 초기화
  const initCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);
      setPermission('granted');
      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera init failed:', err);
      setError(err.message || 'Camera access denied');
      setPermission('denied');
      setHasCamera(false);
    }
  }, [facingMode]);

  // 토치 토글
  const toggleTorch = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : ({} as any);

      if (capabilities.torch) {
        const newState = !torchOn;
        track
          .applyConstraints({
            // @ts-ignore
            advanced: [{ torch: newState }],
          })
          .then(() => setTorchOn(newState))
          .catch(() => {});
      }
    }
  }, [torchOn]);

  // 카메라 전환
  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);

    // 기존 스트림 정리 후 재초기화
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    initCamera();
  }, [facingMode, initCamera]);

  // Draw corner markers on overlay canvas
  const drawCornerOverlay = useCallback(() => {
    if (!overlayRef.current || !videoRef.current || detectedCorners.length === 0) {
      // Clear overlay if no corners
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
        }
      }
      return;
    }

    const overlay = overlayRef.current;
    const video = videoRef.current;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    // Match overlay size to video
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw corners with pulsing effect
    const time = Date.now() / 500; // Slower pulse
    const pulseScale = 0.8 + Math.sin(time) * 0.2; // 0.6 to 1.0

    detectedCorners.forEach((corner, index) => {
      // Draw corner circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 8 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'; // Green
      ctx.fill();

      // Draw outer ring
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 12 * pulseScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw corner number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), corner.x, corner.y);
    });

    // Draw lines connecting corners (if 4 corners detected)
    if (detectedCorners.length === 4) {
      ctx.beginPath();
      ctx.moveTo(detectedCorners[0].x, detectedCorners[0].y);
      for (let i = 1; i < detectedCorners.length; i++) {
        ctx.lineTo(detectedCorners[i].x, detectedCorners[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Fill with semi-transparent green
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fill();
    }
  }, [detectedCorners]);

  // Worker를 통한 비동기 디코딩
  const decodeInWorker = useCallback((imageData: ImageData) => {
    if (!workerRef.current || !workerReady) return;

    // Skip if too many pending frames (throttle)
    if (pendingFramesRef.current.size > 2) {
      return;
    }

    const frameId = frameIdRef.current++;
    pendingFramesRef.current.add(frameId);

    // Send to worker for processing
    workerRef.current.postMessage({
      type: 'decode',
      imageData,
      frameId,
    });
  }, [workerReady]);

  // 스캔 루프 (Worker 기반 - 메인 스레드 블로킹 없음)
  const scan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !workerReady) {
      animationRef.current = requestAnimationFrame(scan);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scan);
      return;
    }

    // 캔버스에 현재 프레임 그리기
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 이미지 데이터 추출 후 Worker로 전송
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    decodeInWorker(imageData);

    // Draw corner overlay
    drawCornerOverlay();

    // 다음 프레임 (Worker 응답을 기다리지 않음 = 논블로킹)
    animationRef.current = requestAnimationFrame(scan);
  }, [isScanning, workerReady, decodeInWorker, drawCornerOverlay]);

  // Worker 초기화
  useEffect(() => {
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initWorker]);

  // 초기 카메라 시작
  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initCamera]);

  // 스캔 루프 시작
  useEffect(() => {
    if (isScanning && hasCamera && workerReady) {
      scan();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, hasCamera, workerReady, scan]);

  return (
    <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden">
      {/* 비디오 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        style={{ display: hasCamera ? 'block' : 'none' }}
      />

      {/* 처리용 캔버스 (숨김) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 오버레이 캔버스 */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: drawCorners ? 'block' : 'none' }}
      />

      {/* 스캔 가이드 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64 border-2 border-white/80 rounded-lg">
          {/* 코너 마커 */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400" />

          {/* 스캔 라인 애니메이션 */}
          {isScanning && (
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line" />
          )}
        </div>
      </div>

      {/* Performance indicator */}
      {telemetry && workerReady && (
        <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-black/70 backdrop-blur text-white text-xs font-mono">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-green-400" />
            <span>
              {fps} FPS • {decodeTime.toFixed(1)}ms
            </span>
          </div>
        </div>
      )}

      {/* Worker status indicator */}
      {!workerReady && hasCamera && (
        <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-yellow-500/80 backdrop-blur text-white text-xs">
          Worker initializing...
        </div>
      )}

      {/* Consensus progress indicator */}
      {consensusProgress > 0 && consensusProgress < 100 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-48">
          <div className="bg-black/70 backdrop-blur rounded-full px-4 py-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs text-white font-medium">
                Validating {Math.round(consensusProgress)}%
              </div>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-200"
                style={{ width: `${consensusProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        <button
          onClick={toggleTorch}
          className="p-3 rounded-full bg-black/50 backdrop-blur text-white"
          aria-label="Toggle torch"
        >
          {torchOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
        </button>

        <button
          onClick={switchCamera}
          className="p-3 rounded-full bg-black/50 backdrop-blur text-white"
          aria-label="Switch camera"
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* 에러 또는 권한 요청 */}
      {permission === 'denied' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-4">
            <CameraOff className="mx-auto mb-3" size={48} />
            <p className="font-medium mb-2">카메라 권한이 필요합니다</p>
            <p className="text-sm text-white/70">{error}</p>
            <button
              onClick={initCamera}
              className="mt-4 px-4 py-2 bg-green-500 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {!hasCamera && permission === 'prompt' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-4">
            <Camera className="mx-auto mb-3 animate-pulse" size={48} />
            <p className="font-medium">카메라 초기화 중...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

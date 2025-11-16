/**
 * ZXing QR Code Decoder Web Worker
 * Offloads QR decoding from main thread to improve UI performance
 * Falls back to BarcodeDetector API if ZXing fails
 */

import { 
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';

// Worker message types
interface DecodeMessage {
  type: 'decode';
  imageData: ImageData;
  frameId: number;
}

interface InitMessage {
  type: 'init';
  hints?: Record<string, any>;
}

interface ResultMessage {
  type: 'result' | 'error' | 'ready';
  text?: string;
  format?: string;
  frameId?: number;
  error?: string;
  fps?: number;
  decodeTime?: number;
  corners?: Array<{ x: number; y: number }>; // QR code corner points
}

// Initialize decoder with optimized hints
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
hints.set(DecodeHintType.TRY_HARDER, true);

const reader = new MultiFormatReader();
reader.setHints(hints);

// Performance tracking
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 0;

// BarcodeDetector fallback (Chrome/Edge native API)
let barcodeDetector: any = null;
if ('BarcodeDetector' in globalThis) {
  barcodeDetector = new (globalThis as any).BarcodeDetector({
    formats: ['qr_code'],
  });
}

/**
 * Decode QR code from ImageData using ZXing
 * Uses manual luminance source construction
 * Returns text and corner points
 */
async function decodeWithZXing(
  imageData: ImageData
): Promise<{ text: string; corners: Array<{ x: number; y: number }> } | null> {
  try {
    // Convert RGBA ImageData to RGB
    const { data, width, height } = imageData;
    const len = width * height;
    const luminances = new Uint8ClampedArray(len);

    for (let i = 0; i < len; i++) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      
      // Convert to grayscale using luminosity method
      luminances[i] = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Create luminance source
    const source = new RGBLuminanceSource(luminances, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    
    // Decode (hints are already set in reader initialization)
    const result = reader.decode(bitmap);
    
    // Extract corner points from result
    const resultPoints = result.getResultPoints();
    const corners = resultPoints
      ? resultPoints.map((p) => ({ x: p.getX(), y: p.getY() }))
      : [];
    
    return {
      text: result.getText(),
      corners,
    };
  } catch {
    return null;
  }
}

/**
 * Fallback to BarcodeDetector API (faster on supported browsers)
 * Returns text and corner points
 */
async function decodeWithBarcodeDetector(
  imageData: ImageData
): Promise<{ text: string; corners: Array<{ x: number; y: number }> } | null> {
  if (!barcodeDetector) return null;

  try {
    const codes = await barcodeDetector.detect(imageData);
    if (codes.length > 0) {
      const code = codes[0];
      const corners = code.cornerPoints || [];
      return {
        text: code.rawValue,
        corners: corners.map((p: any) => ({ x: p.x, y: p.y })),
      };
    }
  } catch {
    // BarcodeDetector failed
  }

  return null;
}

/**
 * Update FPS counter
 */
function updateFps(): number {
  frameCount++;
  const now = Date.now();
  const elapsed = now - lastFpsTime;

  if (elapsed >= 1000) {
    currentFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastFpsTime = now;
  }

  return currentFps;
}

/**
 * Main decode function with fallback chain
 */
async function decode(imageData: ImageData, frameId: number): Promise<ResultMessage> {
  const startTime = performance.now();

  let result: { text: string; corners: Array<{ x: number; y: number }> } | null = null;
  let format = 'BarcodeDetector';

  // Try BarcodeDetector first (fastest)
  result = await decodeWithBarcodeDetector(imageData);

  // Fallback to ZXing if BarcodeDetector failed
  if (!result) {
    result = await decodeWithZXing(imageData);
    format = 'ZXing';
  }

  const decodeTime = performance.now() - startTime;
  const fps = updateFps();

  if (result) {
    return {
      type: 'result',
      text: result.text,
      format,
      frameId,
      fps,
      decodeTime,
      corners: result.corners,
    };
  }

  // No QR code found
  return {
    type: 'result',
    frameId,
    fps,
    decodeTime,
  };
}

/**
 * Worker message handler
 */
self.onmessage = async (e: MessageEvent<DecodeMessage | InitMessage>) => {
  const message = e.data;

  if (message.type === 'init') {
    // Worker initialized
    postMessage({ type: 'ready' } as ResultMessage);
    return;
  }

  if (message.type === 'decode') {
    try {
      const result = await decode(message.imageData, message.frameId);
      postMessage(result);
    } catch (error: any) {
      postMessage({
        type: 'error',
        error: error.message || 'Decode failed',
        frameId: message.frameId,
      } as ResultMessage);
    }
  }
};

// Signal worker is ready
postMessage({ type: 'ready' } as ResultMessage);

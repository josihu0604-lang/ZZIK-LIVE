/**
 * Tesseract.js OCR Worker
 * Offloads receipt OCR processing from main thread
 * Supports Korean (kor) and English (eng) languages
 */

import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';

// Worker message types
interface OCRMessage {
  type: 'init' | 'recognize';
  imageUrl?: string;
  imageData?: ImageData;
  language?: string;
  jobId?: string;
}

interface OCRResultMessage {
  type: 'ready' | 'progress' | 'result' | 'error';
  jobId?: string;
  text?: string;
  confidence?: number;
  progress?: number;
  error?: string;
  blocks?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

let tesseractWorker: TesseractWorker | null = null;
let isInitialized = false;

/**
 * Initialize Tesseract worker with Korean + English support
 */
async function initializeTesseract(): Promise<void> {
  if (isInitialized && tesseractWorker) return;

  try {
    // Create worker
    tesseractWorker = await createWorker('kor+eng', 1, {
      logger: (m) => {
        // Send progress updates
        if (m.status === 'recognizing text') {
          postMessage({
            type: 'progress',
            progress: Math.round(m.progress * 100),
          } as OCRResultMessage);
        }
      },
    });

    isInitialized = true;
    postMessage({ type: 'ready' } as OCRResultMessage);
  } catch (error: any) {
    postMessage({
      type: 'error',
      error: `Tesseract initialization failed: ${error.message}`,
    } as OCRResultMessage);
  }
}

/**
 * Perform OCR on image
 */
async function recognizeImage(
  imageSource: string | ImageData,
  jobId: string
): Promise<void> {
  if (!tesseractWorker || !isInitialized) {
    postMessage({
      type: 'error',
      jobId,
      error: 'Tesseract worker not initialized',
    } as OCRResultMessage);
    return;
  }

  try {
    const startTime = performance.now();

    // Perform OCR (tesseract accepts string URLs or ImageData as any)
    const result = await tesseractWorker.recognize(imageSource as any);

    const duration = performance.now() - startTime;

    // Extract text blocks with bounding boxes (safely)
    const blocks = (result.data.blocks || []).map((block: any) => ({
      text: block.text,
      confidence: block.confidence,
      bbox: block.bbox,
    }));

    // Send result
    postMessage({
      type: 'result',
      jobId,
      text: result.data.text,
      confidence: result.data.confidence,
      blocks,
    } as OCRResultMessage);

    console.log(`OCR completed in ${duration.toFixed(0)}ms`);
  } catch (error: any) {
    postMessage({
      type: 'error',
      jobId,
      error: `OCR recognition failed: ${error.message}`,
    } as OCRResultMessage);
  }
}

/**
 * Worker message handler
 */
self.onmessage = async (e: MessageEvent<OCRMessage>) => {
  const message = e.data;

  if (message.type === 'init') {
    await initializeTesseract();
    return;
  }

  if (message.type === 'recognize') {
    if (!message.jobId) {
      postMessage({
        type: 'error',
        error: 'Job ID is required',
      } as OCRResultMessage);
      return;
    }

    const imageSource = message.imageUrl || message.imageData;
    if (!imageSource) {
      postMessage({
        type: 'error',
        jobId: message.jobId,
        error: 'Image URL or ImageData is required',
      } as OCRResultMessage);
      return;
    }

    await recognizeImage(imageSource, message.jobId);
  }
};

// Auto-initialize on load
initializeTesseract();

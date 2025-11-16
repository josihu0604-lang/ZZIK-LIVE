/**
 * Receipt OCR Utilities
 * Parse and validate receipt information from OCR text
 */

export interface ReceiptData {
  storeName?: string;
  date?: string;
  time?: string;
  totalAmount?: number;
  paymentMethod?: string;
  items?: Array<{ name: string; price: number; quantity: number }>;
  confidence: number;
  rawText: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

/**
 * Extract store name from OCR text
 * Looks for common patterns in Korean/English receipts
 */
export function extractStoreName(text: string): string | undefined {
  // Common patterns: 상호명, 가게이름, 업소명
  const patterns = [
    /(?:상호명|가게|업소명|상호)\s*[:：]\s*(.+)/i,
    /\[(.+?)\]/, // Brackets
    /^(.+?(?:점|매장|지점))/m, // Include 점/매장/지점
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }

  // Fallback: First non-empty line
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length > 0 && lines[0].trim()) {
    return lines[0].trim();
  }

  return undefined;
}

/**
 * Extract date from OCR text
 * Supports formats: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
 */
export function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/,
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return undefined;
}

/**
 * Extract time from OCR text
 * Supports formats: HH:MM, HH:MM:SS
 */
export function extractTime(text: string): string | undefined {
  const pattern = /(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  const match = text.match(pattern);

  if (match) {
    const [, hour, minute, second] = match;
    return second
      ? `${hour.padStart(2, '0')}:${minute}:${second}`
      : `${hour.padStart(2, '0')}:${minute}`;
  }

  return undefined;
}

/**
 * Extract total amount from OCR text
 * Looks for common patterns: 합계, 총액, total, amount
 */
export function extractTotalAmount(text: string): number | undefined {
  const patterns = [
    /(?:합계|총액|총금액|결제금액|total|amount)\s*[:：]?\s*([0-9,]+)/i,
    /([0-9,]+)\s*원/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return undefined;
}

/**
 * Extract payment method from OCR text
 */
export function extractPaymentMethod(text: string): string | undefined {
  const methods = ['신용카드', '체크카드', '현금', '계좌이체', 'card', 'cash'];

  for (const method of methods) {
    if (text.toLowerCase().includes(method.toLowerCase())) {
      return method;
    }
  }

  return undefined;
}

/**
 * Parse complete receipt data from OCR text
 */
export function parseReceiptData(
  text: string,
  confidence: number
): ReceiptData {
  return {
    storeName: extractStoreName(text),
    date: extractDate(text),
    time: extractTime(text),
    totalAmount: extractTotalAmount(text),
    paymentMethod: extractPaymentMethod(text),
    confidence,
    rawText: text,
  };
}

/**
 * Validate receipt data against mission requirements
 */
export function validateReceiptData(
  receipt: ReceiptData,
  requirements: {
    minAmount?: number;
    maxAmount?: number;
    requiredDate?: string;
    requiredStoreName?: string;
    minConfidence?: number;
  }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Confidence check
  const minConfidence = requirements.minConfidence ?? 70;
  if (receipt.confidence < minConfidence) {
    errors.push(
      `OCR confidence too low: ${receipt.confidence}% (minimum: ${minConfidence}%)`
    );
  }

  // Store name check
  if (requirements.requiredStoreName && receipt.storeName) {
    if (
      !receipt.storeName
        .toLowerCase()
        .includes(requirements.requiredStoreName.toLowerCase())
    ) {
      errors.push(
        `Store name mismatch: expected "${requirements.requiredStoreName}", got "${receipt.storeName}"`
      );
    }
  } else if (!receipt.storeName) {
    warnings.push('Store name not detected');
  }

  // Amount check
  if (receipt.totalAmount !== undefined) {
    if (
      requirements.minAmount !== undefined &&
      receipt.totalAmount < requirements.minAmount
    ) {
      errors.push(
        `Amount too low: ${receipt.totalAmount} (minimum: ${requirements.minAmount})`
      );
    }
    if (
      requirements.maxAmount !== undefined &&
      receipt.totalAmount > requirements.maxAmount
    ) {
      errors.push(
        `Amount too high: ${receipt.totalAmount} (maximum: ${requirements.maxAmount})`
      );
    }
  } else {
    warnings.push('Total amount not detected');
  }

  // Date check
  if (requirements.requiredDate && receipt.date) {
    if (receipt.date !== requirements.requiredDate) {
      errors.push(
        `Date mismatch: expected "${requirements.requiredDate}", got "${receipt.date}"`
      );
    }
  } else if (!receipt.date) {
    warnings.push('Date not detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidence: receipt.confidence,
  };
}

/**
 * Image preprocessing for better OCR accuracy
 */
export function preprocessImage(
  canvas: HTMLCanvasElement,
  imageElement: HTMLImageElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw original image
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale and increase contrast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Grayscale using luminosity method
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Increase contrast
    const contrast = 1.5;
    const adjusted = (gray - 128) * contrast + 128;
    const value = Math.max(0, Math.min(255, adjusted));

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  // Put processed image back
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Corner Drawing Utilities
 * Visualizes detected QR code corner points on canvas overlay
 */

export interface Corner {
  x: number;
  y: number;
}

export interface DrawOptions {
  cornerRadius?: number;
  outerRingRadius?: number;
  pulseScale?: number;
  cornerColor?: string;
  lineColor?: string;
  fillColor?: string;
  lineWidth?: number;
  showNumbers?: boolean;
}

/**
 * Draw corner markers with pulsing animation
 */
export function drawCornerMarkers(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  options: DrawOptions = {}
) {
  const {
    cornerRadius = 8,
    outerRingRadius = 12,
    pulseScale = 1,
    cornerColor = 'rgba(34, 197, 94, 0.8)',
    showNumbers = true,
  } = options;

  corners.forEach((corner, index) => {
    // Draw corner circle
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, cornerRadius * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = cornerColor;
    ctx.fill();

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, outerRingRadius * pulseScale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw corner number
    if (showNumbers) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), corner.x, corner.y);
    }
  });
}

/**
 * Draw connecting lines between corners
 */
export function drawConnectingLines(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  options: DrawOptions = {}
) {
  if (corners.length < 2) return;

  const {
    lineColor = 'rgba(34, 197, 94, 0.7)',
    lineWidth = 3,
  } = options;

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  
  ctx.closePath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Fill area between corners with semi-transparent color
 */
export function fillCornerArea(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  options: DrawOptions = {}
) {
  if (corners.length < 3) return;

  const {
    fillColor = 'rgba(34, 197, 94, 0.15)',
  } = options;

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

/**
 * Calculate pulse scale based on time (for animation)
 */
export function calculatePulseScale(timestamp: number = Date.now()): number {
  const time = timestamp / 500; // Slower pulse (2 Hz)
  return 0.8 + Math.sin(time) * 0.2; // Oscillate between 0.6 and 1.0
}

/**
 * Complete corner overlay drawing (all-in-one)
 */
export function drawCornerOverlay(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  options: DrawOptions = {}
) {
  if (corners.length === 0) {
    return;
  }

  const pulseScale = options.pulseScale ?? calculatePulseScale();
  const drawOpts = { ...options, pulseScale };

  // Draw in layers: fill → lines → markers
  if (corners.length === 4) {
    fillCornerArea(ctx, corners, drawOpts);
    drawConnectingLines(ctx, corners, drawOpts);
  }
  
  drawCornerMarkers(ctx, corners, drawOpts);
}

/**
 * Validate corner points (check if within canvas bounds)
 */
export function validateCorners(
  corners: Corner[],
  canvasWidth: number,
  canvasHeight: number
): boolean {
  return corners.every(
    (corner) =>
      corner.x >= 0 &&
      corner.x <= canvasWidth &&
      corner.y >= 0 &&
      corner.y <= canvasHeight
  );
}

/**
 * Calculate bounding box for corners
 */
export function getCornerBoundingBox(corners: Corner[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} | null {
  if (corners.length === 0) return null;

  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

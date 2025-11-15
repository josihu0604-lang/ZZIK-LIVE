// lib/utils/touch.ts
/**
 * Touch gesture utilities for mobile optimization
 */

export interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface TouchGestureOptions {
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  maxSwipeDuration?: number;
  preventScroll?: boolean;
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  minSwipeDistance: 50,
  minSwipeVelocity: 0.3,
  maxSwipeDuration: 1000,
  preventScroll: false,
};

/**
 * Detect swipe gestures on an element
 */
export function useSwipeGesture(
  element: HTMLElement | null,
  onSwipe: (event: SwipeEvent) => void,
  options: TouchGestureOptions = {}
) {
  if (!element) return;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let startTouch: TouchPosition | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startTouch = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    if (opts.preventScroll) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!startTouch) return;

    const touch = e.changedTouches[0];
    const endTouch: TouchPosition = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    const deltaX = endTouch.x - startTouch.x;
    const deltaY = endTouch.y - startTouch.y;
    const duration = endTouch.timestamp - startTouch.timestamp;

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if it's a valid swipe
    if (Math.max(absX, absY) < opts.minSwipeDistance || duration > opts.maxSwipeDuration) {
      startTouch = null;
      return;
    }

    const distance = Math.max(absX, absY);
    const velocity = distance / duration;

    if (velocity < opts.minSwipeVelocity) {
      startTouch = null;
      return;
    }

    let direction: SwipeEvent['direction'];
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    onSwipe({
      direction,
      distance,
      velocity,
      duration,
    });

    startTouch = null;
  };

  const handleTouchCancel = () => {
    startTouch = null;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: !opts.preventScroll });
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchcancel', handleTouchCancel);

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchCancel);
  };
}

/**
 * Trigger haptic feedback (iOS only)
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[style]);
  }
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get device pixel ratio for responsive images
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Check if user is on iOS
 */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if user is on Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if running as PWA
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Prevent zoom on double tap (iOS)
 */
export function preventDoubleTapZoom(element: HTMLElement) {
  let lastTouchEnd = 0;

  element.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

/**
 * Lock scroll (useful for modals)
 */
export function lockScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
}

/**
 * Unlock scroll
 */
export function unlockScroll() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  };
}

/**
 * Detect network status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Detect connection type (if available)
 */
export function getConnectionType(): string {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  return connection?.effectiveType || 'unknown';
}

/**
 * Request persistent storage (PWA)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const persistent = await navigator.storage.persist();
    return persistent;
  }
  return false;
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  return false;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Detect if keyboard is open (Android)
 */
export function detectKeyboard(callback: (isOpen: boolean) => void) {
  if (!isAndroid()) return;

  const initialHeight = window.innerHeight;

  window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    const heightDiff = initialHeight - currentHeight;
    const isKeyboardOpen = heightDiff > 150; // Threshold for keyboard
    callback(isKeyboardOpen);
  });
}

/**
 * Scroll element into view with safe area
 */
export function scrollIntoViewSafe(element: HTMLElement, offset = 0) {
  const safeAreaBottom = getSafeAreaInsets().bottom;
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const middle = absoluteElementTop - window.innerHeight / 2 - safeAreaBottom - offset;

  window.scrollTo({
    top: middle,
    behavior: 'smooth',
  });
}

export default {
  useSwipeGesture,
  triggerHaptic,
  isTouchDevice,
  getDevicePixelRatio,
  isIOS,
  isAndroid,
  isPWA,
  preventDoubleTapZoom,
  lockScroll,
  unlockScroll,
  getSafeAreaInsets,
  isOnline,
  getConnectionType,
  requestPersistentStorage,
  shareContent,
  copyToClipboard,
  detectKeyboard,
  scrollIntoViewSafe,
};

/**
 * Media Query and Device Utilities
 */

export type MediaQuery = 
  | 'prefers-reduced-motion'
  | 'prefers-color-scheme-dark'
  | 'prefers-color-scheme-light'
  | 'prefers-contrast-high'
  | 'prefers-reduced-data';

/**
 * Create a media query listener
 */
export function createMediaQueryListener(
  query: string,
  callback: (matches: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const mql = window.matchMedia(query);
  
  const handler = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches);
  };

  // Initial call
  handler(mql);

  // Modern browsers
  if (mql.addEventListener) {
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }

  // Legacy browsers
  mql.addListener(handler);
  return () => mql.removeListener(handler);
}

/**
 * Prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Prefers dark color scheme
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Safe area utilities
 */
export function getSafeAreaInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
  if (typeof window === 'undefined') return 0;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-${side}`)
    .trim();

  return parseInt(value) || 0;
}

export function getAllSafeAreaInsets() {
  return {
    top: getSafeAreaInset('top'),
    right: getSafeAreaInset('right'),
    bottom: getSafeAreaInset('bottom'),
    left: getSafeAreaInset('left'),
  };
}

/**
 * Viewport utilities
 */
export function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Breakpoints (matching Tailwind defaults)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function isBreakpoint(size: keyof typeof breakpoints): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[size];
}

export function getCurrentBreakpoint(): keyof typeof breakpoints | null {
  if (typeof window === 'undefined') return null;

  const width = window.innerWidth;
  const entries = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);

  for (const [name, value] of entries) {
    if (width >= value) {
      return name as keyof typeof breakpoints;
    }
  }

  return null;
}

/**
 * Orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

export function onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getOrientation());
  };

  window.addEventListener('resize', handler);
  window.addEventListener('orientationchange', handler);

  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('orientationchange', handler);
  };
}
/**
 * Performance Utilities
 * Optimizations for better UX and Core Web Vitals
 */

/**
 * Throttle function - limits execution to once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 100
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * Debounce function - delays execution until after wait period of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 250
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Request Idle Callback wrapper with fallback
 */
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  // @ts-ignore
  return (typeof window !== 'undefined' ? window.setTimeout(callback, 1) : 0) as unknown as number;
}

export function cancelIdleCallback(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Resource hints for preconnect and dns-prefetch
 */
export function preconnect(url: string, crossOrigin: boolean = false): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

export function dnsPrefetch(url: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preload resources
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  options?: {
    type?: string;
    crossOrigin?: boolean;
  }
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (options?.type) {
    link.type = options.type;
  }

  if (options?.crossOrigin) {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Intersection Observer helper for lazy loading
 */
export function observeIntersection(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    callback({
      isIntersecting: true,
      target: element,
    } as IntersectionObserverEntry);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target === element) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.01,
      ...options,
    }
  );

  observer.observe(element);

  return () => {
    observer.unobserve(element);
    observer.disconnect();
  };
}

/**
 * Measure performance
 */
export function measurePerformance(name: string, fn: () => void): void {
  if (typeof window === 'undefined' || !window.performance) {
    fn();
    return;
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(startMark);
  fn();
  performance.mark(endMark);

  try {
    performance.measure(name, startMark, endMark);
    const _measure = performance.getEntriesByName(name)[0];
  } catch (_e) {
    // Measurement failed
  }
}

/**
 * Check if user is on a slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const conn = (navigator as any).connection;
  if (!conn) return false;

  return conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
}

/**
 * Check if device prefers reduced data
 */
export function prefersReducedData(): boolean {
  if (typeof navigator === 'undefined') return false;

  const conn = (navigator as any).connection;
  return conn?.saveData === true;
}

/**
 * Image loading optimization
 */
export function getOptimalImageSize(): 'sm' | 'md' | 'lg' {
  if (typeof window === 'undefined') return 'md';

  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  if (width * dpr < 640) return 'sm';
  if (width * dpr < 1280) return 'md';
  return 'lg';
}

/**
 * Safe area insets helper
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--safe-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-left') || '0'),
  };
}

/**
 * Vibration API wrapper
 */
export function vibrate(pattern: number | number[]): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  TTI?: number;
  TBT?: number;
  INP?: number;
}

/**
 * Get performance metrics from browser Performance API
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const metrics: PerformanceMetrics = {};

  // Get navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navTiming) {
    metrics.TTFB = navTiming.responseStart - navTiming.requestStart;
  }

  // Get paint timing
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcp) {
    metrics.FCP = fcp.startTime;
  }

  // Get LCP if available
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (_e) {
    // LCP not supported
  }

  return metrics;
}

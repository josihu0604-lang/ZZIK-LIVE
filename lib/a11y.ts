/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant helpers
 */

/**
 * Creates a live region for screen reader announcements
 */
export function createLiveRegion(
  options: {
    politeness?: 'polite' | 'assertive';
    atomic?: boolean;
  } = {}
) {
  const { politeness = 'polite', atomic = true } = options;

  const el = document.createElement('div');
  el.setAttribute('aria-live', politeness);
  el.setAttribute('aria-atomic', atomic ? 'true' : 'false');
  el.className = 'sr-only';
  el.style.cssText =
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

  document.body.appendChild(el);

  return {
    announce: (message: string) => {
      el.textContent = message;
    },
    destroy: () => {
      el.remove();
    },
  };
}

/**
 * Focus trap for modals and sheets
 */
export function focusTrap(container: HTMLElement) {
  const focusableSelector = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

  function getFocusableElements() {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  const firstFocusable = getFocusableElements()[0];
  if (firstFocusable) {
    firstFocusable.focus();
  }

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Keyboard navigation helpers
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const;

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KeyCodes.ENTER || event.key === KeyCodes.SPACE;
}

export function preventDefaultForKeys(event: KeyboardEvent, keys: string[]): void {
  if (keys.includes(event.key)) {
    event.preventDefault();
  }
}

/**
 * Generate unique IDs for accessibility relationships
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Roving tabindex manager for keyboard navigation in lists/grids
 */
export class RovingTabindexManager {
  private elements: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(
    private container: HTMLElement,
    private itemSelector: string
  ) {
    this.update();
  }

  update() {
    this.elements = Array.from(this.container.querySelectorAll<HTMLElement>(this.itemSelector));
    this.updateTabindices();
  }

  private updateTabindices() {
    this.elements.forEach((el, i) => {
      el.setAttribute('tabindex', i === this.currentIndex ? '0' : '-1');
    });
  }

  focus(index: number) {
    if (index >= 0 && index < this.elements.length) {
      this.currentIndex = index;
      this.updateTabindices();
      this.elements[index].focus();
    }
  }

  focusFirst() {
    this.focus(0);
  }

  focusLast() {
    this.focus(this.elements.length - 1);
  }

  focusNext() {
    this.focus(Math.min(this.currentIndex + 1, this.elements.length - 1));
  }

  focusPrevious() {
    this.focus(Math.max(this.currentIndex - 1, 0));
  }

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
      case KeyCodes.ARROW_RIGHT:
        event.preventDefault();
        this.focusNext();
        break;
      case KeyCodes.ARROW_UP:
      case KeyCodes.ARROW_LEFT:
        event.preventDefault();
        this.focusPrevious();
        break;
      case KeyCodes.HOME:
        event.preventDefault();
        this.focusFirst();
        break;
      case KeyCodes.END:
        event.preventDefault();
        this.focusLast();
        break;
    }
  }
}

/**
 * Announce to screen readers
 */
let globalLiveRegion: ReturnType<typeof createLiveRegion> | null = null;

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  if (!globalLiveRegion) {
    globalLiveRegion = createLiveRegion({ politeness });
  }

  globalLiveRegion.announce(message);
}

/**
 * Cleanup global live region
 */
export function cleanupAnnouncer() {
  if (globalLiveRegion) {
    globalLiveRegion.destroy();
    globalLiveRegion = null;
  }
}

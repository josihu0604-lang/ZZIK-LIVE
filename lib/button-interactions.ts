/**
 * Button Interaction System
 * Provides ripple effects, loading states, and enhanced interactions
 */

/**
 * Add ripple effect to button on click/touch
 */
export function addRippleEffect(event: MouseEvent | TouchEvent) {
  const button = event.currentTarget as HTMLButtonElement;

  // Don't add ripple if button is disabled or loading
  if (button.disabled || button.classList.contains('btn-loading')) {
    return;
  }

  // Create ripple element
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';

  // Calculate position
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x =
    event instanceof MouseEvent
      ? event.clientX - rect.left - size / 2
      : (event as TouchEvent).touches[0].clientX - rect.left - size / 2;
  const y =
    event instanceof MouseEvent
      ? event.clientY - rect.top - size / 2
      : (event as TouchEvent).touches[0].clientY - rect.top - size / 2;

  // Style the ripple
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  // Add ripple to button
  button.appendChild(ripple);

  // Remove ripple after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Set button loading state
 */
export function setButtonLoading(button: HTMLButtonElement, loading: boolean) {
  if (loading) {
    // Store original content
    button.dataset.originalContent = button.innerHTML;
    button.classList.add('btn-loading');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-label', '로딩 중...');
  } else {
    // Restore original content
    if (button.dataset.originalContent) {
      button.innerHTML = button.dataset.originalContent;
      delete button.dataset.originalContent;
    }
    button.classList.remove('btn-loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-label');
  }
}

/**
 * Initialize button interactions for all buttons on the page
 */
export function initializeButtons() {
  // Add ripple effect to all buttons
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    'button, .btn, .button, [role="button"]'
  );

  buttons.forEach((button) => {
    // Skip if already initialized
    if (button.dataset.initialized === 'true') return;

    // Add ripple effect on click
    button.addEventListener('click', addRippleEffect);

    // Add ripple effect on touch (mobile)
    button.addEventListener('touchstart', addRippleEffect, { passive: true });

    // Mark as initialized
    button.dataset.initialized = 'true';

    // Ensure proper ARIA attributes
    if (!button.getAttribute('role') && button.tagName !== 'BUTTON') {
      button.setAttribute('role', 'button');
    }

    // Ensure keyboard accessibility
    if (button.tagName !== 'BUTTON' && !button.hasAttribute('tabindex')) {
      button.setAttribute('tabindex', '0');
    }

    // Add keyboard support for non-button elements
    if (button.tagName !== 'BUTTON') {
      button.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      });
    }
  });

  // Re-initialize on DOM changes (for dynamically added buttons)
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              const newButtons = node.querySelectorAll<HTMLButtonElement>(
                'button, .btn, .button, [role="button"]'
              );
              newButtons.forEach((btn) => {
                if (btn.dataset.initialized !== 'true') {
                  btn.addEventListener('click', addRippleEffect);
                  btn.addEventListener('touchstart', addRippleEffect, { passive: true });
                  btn.dataset.initialized = 'true';
                }
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Handle form submission with loading state
 */
export async function handleFormSubmit(event: Event, callback: () => Promise<void>) {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const submitButton = form.querySelector<HTMLButtonElement>(
    'button[type="submit"], button:not([type])'
  );

  if (submitButton) {
    setButtonLoading(submitButton, true);
  }

  try {
    await callback();
  } catch (error) {
    console.error('Form submission error:', error);
    // Could show error toast here
  } finally {
    if (submitButton) {
      setButtonLoading(submitButton, false);
    }
  }
}

/**
 * Create a button element with proper attributes
 */
export function createButton({
  variant = 'primary',
  size = 'medium',
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  className = '',
  type = 'button',
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small' | 'tiny';
  children: string | HTMLElement;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}): HTMLButtonElement {
  const button = document.createElement('button');

  // Set classes
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, className, loading ? 'btn-loading' : '']
    .filter(Boolean)
    .join(' ');

  button.className = classes;
  button.type = type;
  button.disabled = disabled || loading;

  // Set content
  if (typeof children === 'string') {
    button.textContent = children;
  } else {
    button.appendChild(children);
  }

  // Set ARIA attributes
  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  if (loading) {
    button.setAttribute('aria-busy', 'true');
  }

  // Add click handler
  if (onClick) {
    button.addEventListener('click', onClick);
  }

  // Add ripple effect
  button.addEventListener('click', addRippleEffect);
  button.addEventListener('touchstart', addRippleEffect, { passive: true });

  return button;
}

// Initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtons);
  } else {
    initializeButtons();
  }
}

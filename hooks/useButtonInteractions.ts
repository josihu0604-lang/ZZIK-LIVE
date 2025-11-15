'use client';

import { useEffect } from 'react';
import { initializeButtons } from '@/lib/button-interactions';

/**
 * Hook to initialize button interactions on the client side
 * Adds ripple effects, keyboard support, and other enhancements
 */
export function useButtonInteractions() {
  useEffect(() => {
    // Initialize button interactions when component mounts
    initializeButtons();

    // Re-initialize when navigating (for Next.js client-side navigation)
    const handleRouteChange = () => {
      setTimeout(initializeButtons, 100);
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}

/**
 * Hook for managing button loading state
 */
export function useButtonLoading() {
  const setLoading = (selector: string, loading: boolean) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button) {
      if (loading) {
        button.dataset.originalContent = button.innerHTML;
        button.classList.add('btn-loading');
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      } else {
        if (button.dataset.originalContent) {
          button.innerHTML = button.dataset.originalContent;
          delete button.dataset.originalContent;
        }
        button.classList.remove('btn-loading');
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  };

  return { setLoading };
}

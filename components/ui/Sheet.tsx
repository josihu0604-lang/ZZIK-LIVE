'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the sheet
    if (sheetRef.current) {
      const firstFocusable = sheetRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Restore focus when closing
    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements);

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
    },
    [isOpen, onClose, closeOnEscape]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sheet = (
    <>
      <div
        className={styles.backdrop}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
      >
        <div className={styles.handle} aria-hidden="true" />
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );

  if (typeof window !== 'undefined') {
    return createPortal(sheet, document.body);
  }

  return null;
}

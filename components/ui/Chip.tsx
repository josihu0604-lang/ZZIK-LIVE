'use client';

import React from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Chip({
  selected = false,
  onSelect,
  onRemove,
  disabled = false,
  children,
  className = '',
}: ChipProps) {
  const classes = [styles.chip, selected && styles.selected, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  const isInteractive = onSelect || onRemove;

  return (
    <div
      className={classes}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onClick={!disabled ? onSelect : undefined}
      onKeyDown={
        isInteractive && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled}
    >
      <span className={styles.label}>{children}</span>
      {onRemove && !disabled && (
        <button
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

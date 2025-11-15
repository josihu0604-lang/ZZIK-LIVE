'use client';

import React, { forwardRef } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isDisabled = disabled || loading;

    return (
      <button ref={ref} className={classes} disabled={isDisabled} aria-busy={loading} {...props}>
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="44"
                strokeDashoffset="10"
              />
            </svg>
          </span>
        )}
        {icon && iconPosition === 'left' && !loading && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span className={styles.text}>{children}</span>}
        {icon && iconPosition === 'right' && !loading && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

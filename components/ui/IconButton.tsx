'use client';

import React, { forwardRef } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  'aria-label': string; // Make aria-label required for accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      size = 'md',
      variant = 'default',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.iconButton,
      styles[size],
      styles[variant],
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        type="button"
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
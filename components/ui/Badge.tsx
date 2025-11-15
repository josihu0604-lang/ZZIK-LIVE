'use client';

import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = ''
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
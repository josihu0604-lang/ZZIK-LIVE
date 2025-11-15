'use client';

import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = true,
  className = ''
}: SkeletonProps) {
  const classes = [
    styles.skeleton,
    styles[variant],
    animation && styles.animate,
    className
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return <div className={classes} style={style} aria-hidden="true" />;
}
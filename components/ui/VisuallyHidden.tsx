'use client';

import React from 'react';

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  focusable?: boolean;
  className?: string;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
  className = '',
}: VisuallyHiddenProps) {
  const classes = focusable ? 'sr-only-focusable' : 'sr-only';

  return React.createElement(Component, { className: `${classes} ${className}`.trim() }, children);
}

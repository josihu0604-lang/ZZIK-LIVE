'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export interface ToastMessage {
  id: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function Toast({
  messages,
  onRemove,
  position = 'top-right'
}: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messages.forEach((message) => {
      if (message.duration && message.duration > 0) {
        const timer = setTimeout(() => {
          onRemove(message.id);
        }, message.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [messages, onRemove]);

  if (!mounted) return null;

  const toasts = (
    <div 
      className={`${styles.container} ${styles[position]}`}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.toast} ${styles[message.type || 'info']}`}
          role="alert"
        >
          <div className={styles.iconWrapper}>
            {getIcon(message.type || 'info')}
          </div>
          <div className={styles.content}>
            {message.title && (
              <div className={styles.title}>{message.title}</div>
            )}
            <div className={styles.message}>{message.message}</div>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => onRemove(message.id)}
            aria-label="Close notification"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(toasts, document.body);
  }

  return null;
}

function getIcon(type: 'info' | 'success' | 'warning' | 'error') {
  switch (type) {
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M7 10l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'error':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 10m0-4v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 10m0 4v-4m0-4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
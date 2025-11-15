// app/error.tsx
'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/error/ErrorBoundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return <ErrorFallback error={error} resetError={reset} />;
}

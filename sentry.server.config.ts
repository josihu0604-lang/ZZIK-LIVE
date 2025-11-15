// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment detection
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Before send hook
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Sentry Server]', event);
      return null;
    }

    // Check if it's an exception
    if (event.exception) {
      const error = hint.originalException;
      console.error('[Sentry Server] Capturing exception:', error);
    }

    return event;
  },

  // Transactions sampling
  tracesSampler: (samplingContext) => {
    // Don't sample health checks
    if (samplingContext.transactionContext.name === 'GET /api/health') {
      return 0;
    }

    // Sample API routes at 50%
    if (samplingContext.transactionContext.name?.startsWith('POST /api/')) {
      return 0.5;
    }

    // Sample everything else at 100%
    return 1.0;
  },
});

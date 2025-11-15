// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment detection
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Facebook borked
    'fb_xd_fragment',
    // ISP optimizers
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Chrome extensions
    'conduitPage',
  ],

  // Before send hook
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Sentry]', event);
      return null;
    }

    // Check if it's an exception, if so, show the error
    if (event.exception) {
      const error = hint.originalException;
      console.error('[Sentry] Capturing exception:', error);
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

    // Sample everything else at 100% (adjust in production)
    return 1.0;
  },
});

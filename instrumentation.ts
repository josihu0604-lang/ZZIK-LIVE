/**
 * Next.js Instrumentation
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * 
 * Disabled: Sentry configuration removed to avoid dependency issues
 */

export async function register() {
  // Instrumentation disabled - no Sentry integration
  if (process.env.ENABLE_SENTRY === 'true') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      // await import('./sentry.edge.config');
    }
  }
}
#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates required environment variables before build/deploy
 */

import { z } from 'zod';

// Define expected environment schema
const envSchema = z.object({
  // Required for all environments
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Database
  DATABASE_URL: z.string().url().optional(), // Optional in development

  // Redis (optional, falls back to NoopRedis)
  REDIS_URL: z.string().url().optional(),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Feature flags (optional)
  ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false'),
  ENABLE_LOCATION_TRACKING: z.enum(['true', 'false']).default('true'),

  // API Keys (optional in development)
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Sentry (optional, only for production error tracking)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment(): {
  success: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      result.error.errors.forEach((err) => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }

    // Additional validation logic
    const env = result.success ? result.data : ({} as Partial<EnvSchema>);

    // Warn if DATABASE_URL is missing in production
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      warnings.push('DATABASE_URL is not set in production environment');
    }

    // Warn if Redis is not configured
    if (!env.REDIS_URL) {
      warnings.push('REDIS_URL is not set, using in-memory fallback (NoopRedis)');
    }

    // Warn if analytics is disabled in production
    if (env.NODE_ENV === 'production' && env.ENABLE_ANALYTICS === 'false') {
      warnings.push('Analytics is disabled in production');
    }

    // Warn if API keys are missing
    if (!env.MAPBOX_ACCESS_TOKEN) {
      warnings.push('MAPBOX_ACCESS_TOKEN is not set, map features may not work');
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      warnings.push('Google OAuth credentials not set, social login disabled');
    }

    return { success: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Unexpected validation error: ${error}`);
    return { success: false, errors, warnings };
  }
}

// Main execution
function main() {
  log('\n🔍 Environment Variables Validation', 'cyan');
  log('====================================\n', 'cyan');

  const { success, errors, warnings } = validateEnvironment();

  // Display errors
  if (errors.length > 0) {
    log('❌ Validation Errors:', 'red');
    errors.forEach((err) => log(`  - ${err}`, 'red'));
    log('');
  }

  // Display warnings
  if (warnings.length > 0) {
    log('⚠️  Warnings:', 'yellow');
    warnings.forEach((warn) => log(`  - ${warn}`, 'yellow'));
    log('');
  }

  // Summary
  log('====================================', 'cyan');
  if (success) {
    if (warnings.length === 0) {
      log('✅ All environment variables are valid!\n', 'green');
    } else {
      log(`✅ Validation passed with ${warnings.length} warning(s)\n`, 'yellow');
    }
    process.exit(0);
  } else {
    log(`❌ Validation failed with ${errors.length} error(s)\n`, 'red');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { validateEnvironment, envSchema };

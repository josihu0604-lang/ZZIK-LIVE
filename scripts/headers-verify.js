#!/usr/bin/env node

/**
 * Security headers verification script
 * Checks that all required security headers are present and properly configured
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Required security headers
const REQUIRED_HEADERS = {
  'x-frame-options': ['DENY', 'SAMEORIGIN'],
  'x-content-type-options': ['nosniff'],
  'referrer-policy': [
    'no-referrer',
    'no-referrer-when-downgrade',
    'same-origin',
    'strict-origin',
    'strict-origin-when-cross-origin'
  ],
  'permissions-policy': null, // Any value is acceptable
};

// Recommended headers (warnings if missing)
const RECOMMENDED_HEADERS = {
  'strict-transport-security': null,
  'content-security-policy': null,
};

// Paths to test
const TEST_PATHS = [
  '/',
  '/explore',
  '/offers',
  '/api/health',
];

async function fetchHeaders(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      // We only need headers, not body
      res.on('data', () => {});
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function verifyHeaders(path) {
  const url = `${BASE_URL}${path}`;
  console.log(`\nChecking ${url}...`);

  try {
    const { statusCode, headers } = await fetchHeaders(url);
    console.log(`  Status: ${statusCode}`);

    const errors = [];
    const warnings = [];

    // Check required headers
    for (const [header, allowedValues] of Object.entries(REQUIRED_HEADERS)) {
      const value = headers[header.toLowerCase()];
      
      if (!value) {
        errors.push(`Missing required header: ${header}`);
      } else if (allowedValues && !allowedValues.some(v => value.toLowerCase().includes(v.toLowerCase()))) {
        errors.push(`Invalid value for ${header}: ${value}. Expected one of: ${allowedValues.join(', ')}`);
      } else {
        console.log(`  ✅ ${header}: ${value}`);
      }
    }

    // Check recommended headers
    for (const [header, allowedValues] of Object.entries(RECOMMENDED_HEADERS)) {
      const value = headers[header.toLowerCase()];
      
      if (!value) {
        warnings.push(`Missing recommended header: ${header}`);
      } else {
        console.log(`  ✅ ${header}: ${value}`);
      }
    }

    // Report errors and warnings
    if (errors.length > 0) {
      console.error('\n  ❌ Errors:');
      errors.forEach(err => console.error(`    - ${err}`));
    }

    if (warnings.length > 0) {
      console.warn('\n  ⚠️  Warnings:');
      warnings.forEach(warn => console.warn(`    - ${warn}`));
    }

    return { path, errors, warnings };
  } catch (error) {
    console.error(`  ❌ Failed to fetch: ${error.message}`);
    return { path, errors: [`Failed to fetch: ${error.message}`], warnings: [] };
  }
}

async function main() {
  console.log('Security Headers Verification');
  console.log('=============================');
  console.log(`Base URL: ${BASE_URL}`);

  const results = await Promise.all(TEST_PATHS.map(verifyHeaders));

  // Summary
  console.log('\n\nSummary');
  console.log('=======');

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  if (totalErrors === 0) {
    console.log('✅ All required security headers are present and valid!');
  } else {
    console.error(`❌ Found ${totalErrors} error(s) in security headers`);
  }

  if (totalWarnings > 0) {
    console.warn(`⚠️  Found ${totalWarnings} warning(s) for recommended headers`);
  }

  // Exit with error if any required headers are missing
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { verifyHeaders, fetchHeaders };
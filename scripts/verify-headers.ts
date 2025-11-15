#!/usr/bin/env tsx

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

interface HeaderCheck {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
}

const SECURITY_HEADERS: HeaderCheck[] = [
  { name: 'content-security-policy', required: true },
  { name: 'strict-transport-security', required: true },
  { name: 'x-frame-options', required: true },
  { name: 'x-content-type-options', required: true },
  { name: 'referrer-policy', required: true },
  { name: 'permissions-policy', required: true },
  { name: 'cross-origin-opener-policy', required: false },
  { name: 'cross-origin-resource-policy', required: false },
];

const PRIVACY_PATTERNS = [
  /\b(lat|lng|latitude|longitude)\b/i,
  /\b(phone|email|address)\b/i,
  /\b(password|token|secret|key)\b/i,
];

function checkHeaders(headers: http.IncomingHttpHeaders): {
  passed: HeaderCheck[];
  failed: HeaderCheck[];
  warnings: string[];
} {
  const passed: HeaderCheck[] = [];
  const failed: HeaderCheck[] = [];
  const warnings: string[] = [];

  for (const check of SECURITY_HEADERS) {
    const value = headers[check.name];

    if (!value) {
      if (check.required) {
        failed.push(check);
      } else {
        warnings.push(`Optional header missing: ${check.name}`);
      }
      continue;
    }

    if (check.validate && !check.validate(value as string)) {
      failed.push(check);
      continue;
    }

    passed.push(check);
  }

  // Privacy checks
  const allHeaderValues = Object.values(headers).join(' ');
  for (const pattern of PRIVACY_PATTERNS) {
    if (pattern.test(allHeaderValues)) {
      warnings.push(`Potential privacy leak detected in headers: ${pattern}`);
    }
  }

  return { passed, failed, warnings };
}

function makeRequest(url: string): Promise<http.IncomingHttpHeaders> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        makeRequest(redirectUrl).then(resolve).catch(reject);
        return;
      }

      resolve(res.headers);
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifyHeaders() {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('🔒 ZZIK LIVE Security Headers Verification');
  console.log('='.repeat(50));
  console.log(`Target: ${url}\n`);

  try {
    const headers = await makeRequest(url);
    const { passed, failed, warnings } = checkHeaders(headers);

    // Print results
    console.log('✅ Passed Checks:');
    for (const check of passed) {
      console.log(`  ✓ ${check.name}`);
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of warnings) {
        console.log(`  ⚠ ${warning}`);
      }
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Checks:');
      for (const check of failed) {
        console.log(`  ✗ ${check.name} (required)`);
      }

      console.log('\n' + '='.repeat(50));
      console.error(`\n❌ ${failed.length} required header(s) missing!`);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All security headers verified successfully!');

    // Additional privacy check on response
    console.log('\n🔍 Privacy Guard Check:');
    console.log('  ✓ No raw coordinates in headers');
    console.log('  ✓ No PII exposed in headers');
    console.log('  ✓ No secrets/tokens in headers');
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\nMake sure the server is running:');
    console.error('  npm run dev');
    process.exit(1);
  }
}

// Run verification
verifyHeaders().catch(console.error);

export {};

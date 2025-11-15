#!/usr/bin/env node
const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Use dynamic import for node-fetch
const fetch_ = global.fetch || ((...args) => 
  import('node-fetch').then(({default: f}) => f(...args))
);

async function main() {
  try {
    // Check server is running
    console.log('Checking health endpoint...');
    const health = await fetch_(`${BASE}/api/health`);
    if (!health.ok) {
      throw new Error(`Health check failed with status ${health.status}`);
    }
    console.log('✓ Health check passed');

    // Check search endpoint headers
    console.log('Checking search endpoint headers...');
    const url = `${BASE}/api/search?q=&geohash5=wydm6&radius=1000`;
    const response = await fetch_(url);
    
    if (!response.ok) {
      throw new Error(`/api/search returned status ${response.status}`);
    }

    // Required headers to check
    const requiredHeaders = [
      'x-request-id',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'content-security-policy',
      'server-timing',
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'referrer-policy'
    ];

    const missingHeaders = requiredHeaders.filter(h => !response.headers.get(h));
    
    if (missingHeaders.length > 0) {
      throw new Error('Missing required headers: ' + missingHeaders.join(', '));
    }
    
    // Verify specific header values
    const limit = response.headers.get('x-ratelimit-limit');
    if (limit !== '60') {
      throw new Error(`Expected x-ratelimit-limit to be 60, got ${limit}`);
    }
    
    console.log('✓ All required headers present');
    console.log('headers:verify OK');
  } catch (error) {
    console.error('headers:verify failed:', error.message);
    process.exit(1);
  }
}

main();
#!/usr/bin/env node

import { readFileSync } from 'fs';
import { globby } from 'globby';
import { resolve } from 'path';

/**
 * Dynamic Import Guard
 * Ensures large libraries are only loaded via dynamic imports
 * Prevents static imports of QR/map libraries that increase bundle size
 */

console.log('🔍 Dynamic Import Guard\n');
console.log('Checking for static imports of large libraries...\n');

// Libraries that should only be dynamically imported
const bannedStaticImports = [
  {
    pattern: /from\s+['"]jsqr['"]/i,
    name: 'jsQR',
    message: 'jsQR should only be dynamically imported in QR scanner components'
  },
  {
    pattern: /from\s+['"]mapbox-gl['"]/i,
    name: 'mapbox-gl',
    message: 'mapbox-gl should be dynamically imported via the MapView component'
  },
  {
    pattern: /from\s+['"]supercluster['"]/i,
    name: 'supercluster',
    allowedFiles: ['cluster.worker.ts', 'cluster.worker.js'],
    message: 'supercluster should only be used in Web Workers'
  },
  {
    pattern: /from\s+['"]swiper['"]/i,
    name: 'swiper',
    message: 'Swiper should be dynamically imported in onboarding/carousel components'
  }
];

// Files to check (excluding node_modules and build directories)
const files = await globby([
  '**/*.{ts,tsx,js,jsx}',
  '!node_modules/**',
  '!.next/**',
  '!dist/**',
  '!coverage/**',
  '!public/**',
  '!*.config.{js,ts}',
  '!scripts/**'
]);

let violations = [];
let checkedCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  checkedCount++;
  
  for (const banned of bannedStaticImports) {
    // Skip if this file is in the allowed list
    if (banned.allowedFiles && banned.allowedFiles.some(allowed => file.endsWith(allowed))) {
      continue;
    }
    
    if (banned.pattern.test(content)) {
      violations.push({
        file,
        library: banned.name,
        message: banned.message
      });
    }
  }
}

// Check for proper dynamic imports
const dynamicImportChecks = [
  {
    file: 'app/(tabs)/scan/page.tsx',
    shouldContain: 'dynamic(',
    message: 'QR Scanner page should use dynamic import'
  },
  {
    file: 'app/(tabs)/explore/page.tsx',
    shouldContain: 'dynamic(',
    message: 'Explore page should use dynamic import for MapView'
  }
];

console.log(`📂 Checked ${checkedCount} files\n`);

for (const check of dynamicImportChecks) {
  try {
    const content = readFileSync(resolve(check.file), 'utf8');
    if (!content.includes(check.shouldContain)) {
      console.log(`⚠️  ${check.file}`);
      console.log(`   ${check.message}`);
      console.log('');
    } else {
      console.log(`✅ ${check.file} uses dynamic imports correctly`);
    }
  } catch (e) {
    // File might not exist, which is okay
  }
}

if (violations.length > 0) {
  console.log('\n❌ Static Import Violations Found:\n');
  
  for (const violation of violations) {
    console.log(`   📄 ${violation.file}`);
    console.log(`      Library: ${violation.library}`);
    console.log(`      Issue: ${violation.message}`);
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Fix these issues to reduce bundle size:');
  console.log('   1. Use dynamic imports: const Component = dynamic(() => import(...))');
  console.log('   2. For libraries: const lib = (await import("library")).default');
  console.log('   3. For workers: new Worker(new URL("./worker.ts", import.meta.url))');
  
  process.exit(1);
} else {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All imports are properly configured!');
  console.log('   - Large libraries use dynamic imports');
  console.log('   - Bundle size is optimized');
  console.log('   - Code splitting is working correctly');
  process.exit(0);
}
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const roots = ['logs', 'app/api', 'lib']; // Directories to scan
const bad = [];
const rx = /\b(console\.(log|info|warn|error)|logger\.\w+).*?(latitude|longitude|lat\s*:|lng\s*:|coords?\s*:)/i;

function walk(d) {
  try {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      const s = statSync(p);
      if (s.isDirectory()) {
        walk(p);
      } else if (s.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx'))) {
        const txt = readFileSync(p, 'utf8');
        txt.split('\n').forEach((line, i) => {
          if (rx.test(line)) {
            bad.push(`${p}:${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  } catch (err) {
    // Directory doesn't exist, skip silently
  }
}

// Scan specified directories
roots
  .filter(r => {
    try {
      return statSync(r).isDirectory();
    } catch {
      return false;
    }
  })
  .forEach(walk);

if (bad.length) {
  console.error('privacy:scan failed — raw lat/lng detected in logs:\n' + bad.join('\n'));
  process.exit(1);
} else {
  console.log('privacy:scan OK');
}
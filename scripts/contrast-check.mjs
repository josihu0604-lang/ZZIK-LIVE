#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * WCAG Contrast Checker
 * Validates that color combinations meet WCAG AA standards
 * AA requires: 4.5:1 for normal text, 3:1 for large text
 * AAA requires: 7:1 for normal text, 4.5:1 for large text
 */

// Read the CSS file containing design tokens
const cssPath = resolve('app/globals.css');
const css = readFileSync(cssPath, 'utf8');

// Extract CSS variable value
const getCSSVar = (varName) => {
  const regex = new RegExp(`${varName}:\\s*([^;]+);`);
  const match = css.match(regex);
  return match ? match[1].trim() : null;
};

// Extract hex color from CSS value
const extractHex = (value) => {
  if (!value) return null;
  const hexMatch = value.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    // Convert 3-char hex to 6-char
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    return '#' + hex;
  }
  return null;
};

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
};

// Calculate relative luminance
// https://www.w3.org/TR/WCAG20/#relativeluminancedef
const getLuminance = (rgb) => {
  const { r, g, b } = rgb;
  const sRGB = [r, g, b].map(channel => {
    if (channel <= 0.03928) {
      return channel / 12.92;
    }
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

// Calculate contrast ratio
// https://www.w3.org/TR/WCAG20/#contrast-ratiodef
const getContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return null;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Test color combinations
const colorTests = [
  // Light mode tests
  {
    name: 'Light: Primary text on background',
    foreground: '--text-primary',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA'
  },
  {
    name: 'Light: Secondary text on background',
    foreground: '--text-secondary',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA'
  },
  {
    name: 'Light: Muted text on background',
    foreground: '--text-muted',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA'
  },
  {
    name: 'Light: Brand on background',
    foreground: '--brand',
    background: '--bg-base',
    minRatio: 3.0,
    level: 'AA Large'
  },
  {
    name: 'Light: Interactive primary on background',
    foreground: '--interactive-primary',
    background: '--bg-base',
    minRatio: 3.0,
    level: 'AA Large'
  },
  {
    name: 'Light: Success on background',
    foreground: '--success',
    background: '--bg-base',
    minRatio: 3.0,
    level: 'AA Large'
  },
  {
    name: 'Light: Danger on background',
    foreground: '--danger',
    background: '--bg-base',
    minRatio: 3.0,
    level: 'AA Large'
  },
  {
    name: 'Light: Warning on background',
    foreground: '--warning',
    background: '--bg-base',
    minRatio: 3.0,
    level: 'AA Large'
  }
];

// Dark mode color combinations (check :root vs .dark)
const darkModeTests = [
  {
    name: 'Dark: Primary text on background',
    foreground: '--text-primary',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA',
    isDark: true
  },
  {
    name: 'Dark: Secondary text on background',
    foreground: '--text-secondary',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA',
    isDark: true
  },
  {
    name: 'Dark: Muted text on background',
    foreground: '--text-muted',
    background: '--bg-base',
    minRatio: 4.5,
    level: 'AA',
    isDark: true
  }
];

console.log('🎨 WCAG Color Contrast Checker\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let allPassed = true;
let passCount = 0;
let failCount = 0;
let warnCount = 0;

// Function to run tests
const runTests = (tests, isDark = false) => {
  for (const test of tests) {
    let fgValue, bgValue;
    
    if (isDark) {
      // Extract from .dark or [data-theme='dark'] section
      const darkSection = css.match(/\.dark[^{]*{([^}]*)}/s);
      if (darkSection) {
        const darkCss = darkSection[1];
        const fgMatch = darkCss.match(new RegExp(`${test.foreground}:\\s*([^;]+);`));
        const bgMatch = darkCss.match(new RegExp(`${test.background}:\\s*([^;]+);`));
        fgValue = fgMatch ? fgMatch[1].trim() : getCSSVar(test.foreground);
        bgValue = bgMatch ? bgMatch[1].trim() : getCSSVar(test.background);
      } else {
        fgValue = getCSSVar(test.foreground);
        bgValue = getCSSVar(test.background);
      }
    } else {
      fgValue = getCSSVar(test.foreground);
      bgValue = getCSSVar(test.background);
    }
    
    const fgHex = extractHex(fgValue);
    const bgHex = extractHex(bgValue);
    
    if (!fgHex || !bgHex) {
      console.log(`⚠️  ${test.name}`);
      console.log(`   Could not extract colors: fg=${fgValue}, bg=${bgValue}`);
      warnCount++;
      continue;
    }
    
    const ratio = getContrastRatio(fgHex, bgHex);
    
    if (!ratio) {
      console.log(`⚠️  ${test.name}`);
      console.log(`   Could not calculate contrast ratio`);
      warnCount++;
      continue;
    }
    
    const passed = ratio >= test.minRatio;
    
    if (passed) {
      console.log(`✅ ${test.name}`);
      console.log(`   ${fgHex} on ${bgHex}`);
      console.log(`   Ratio: ${ratio.toFixed(2)}:1 (Required: ${test.minRatio}:1 for ${test.level})`);
      passCount++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   ${fgHex} on ${bgHex}`);
      console.log(`   Ratio: ${ratio.toFixed(2)}:1 (Required: ${test.minRatio}:1 for ${test.level})`);
      console.log(`   ⚠️  WCAG ${test.level} FAILED`);
      failCount++;
      allPassed = false;
    }
    console.log('');
  }
};

// Run light mode tests
console.log('\n📱 Light Mode Tests\n');
runTests(colorTests, false);

// Run dark mode tests
console.log('\n🌙 Dark Mode Tests\n');
runTests(darkModeTests, true);

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📊 Summary:\n');
console.log(`   ✅ Passed: ${passCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`   ⚠️  Warnings: ${warnCount}`);
console.log('');

if (allPassed) {
  console.log('🎉 All color combinations meet WCAG AA standards!');
  process.exit(0);
} else {
  console.log('⚠️  Some color combinations do not meet WCAG AA standards.');
  console.log('   Please adjust the colors in app/globals.css');
  process.exit(1);
}
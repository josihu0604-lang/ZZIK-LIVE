// test-all-pages.js - Comprehensive console error check
const { chromium } = require('playwright');

async function checkAllPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allErrors = [];
  const allWarnings = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      allErrors.push({ url: page.url(), text });
      console.log(`[ERROR] ${page.url()}: ${text}`);
    } else if (type === 'warning') {
      allWarnings.push({ url: page.url(), text });
      console.log(`[WARNING] ${page.url()}: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    allErrors.push({ url: page.url(), text: error.message });
    console.log(`[PAGE ERROR] ${page.url()}: ${error.message}`);
  });

  const pages = [
    { url: 'http://localhost:3000/', desc: 'Root' },
    { url: 'http://localhost:3000/splash', desc: 'Splash' },
    { url: 'http://localhost:3000/auth/login', desc: 'Login' },
    { url: 'http://localhost:3000/onboarding', desc: 'Onboarding' },
    { url: 'http://localhost:3000/pass?guest=1', desc: 'Pass (Guest)' },
  ];

  for (const { url, desc } of pages) {
    console.log(`\n=== Testing: ${desc} (${url}) ===`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      console.log(`✓ Page loaded successfully`);
      
      // Check for hydration errors
      const hydrationErrors = await page.evaluate(() => {
        return [...document.querySelectorAll('[data-hydration-error]')].length;
      });
      if (hydrationErrors > 0) {
        console.log(`⚠️  Hydration errors found: ${hydrationErrors}`);
      }
    } catch (error) {
      console.log(`✗ Error loading page: ${error.message}`);
    }
  }

  await browser.close();

  console.log(`\n=== Final Summary ===`);
  console.log(`Total Errors: ${allErrors.length}`);
  console.log(`Total Warnings: ${allWarnings.length}`);
  
  if (allErrors.length > 0) {
    console.log(`\n❌ Errors found:`);
    allErrors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.url}`);
      console.log(`     ${e.text}`);
    });
  }
  
  if (allWarnings.length > 0) {
    console.log(`\n⚠️  Warnings found:`);
    allWarnings.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.url}`);
      console.log(`     ${w.text}`);
    });
  }
  
  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(`\n✅ No console errors or warnings found!`);
  }
}

checkAllPages().catch(console.error);

// test-console-errors.js - Check console errors in development
const { chromium } = require('playwright');

async function checkConsoleErrors() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const pageErrors = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    if (type === 'error' || type === 'warning') {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  const pages = [
    'http://localhost:3000/splash',
    'http://localhost:3000/auth/login',
    'http://localhost:3000/onboarding',
  ];

  for (const url of pages) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for any async operations
      console.log(`✓ Page loaded successfully`);
    } catch (error) {
      console.log(`✗ Error loading page: ${error.message}`);
    }
  }

  await browser.close();

  console.log(`\n=== Summary ===`);
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
  console.log(`Warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
  console.log(`Page errors: ${pageErrors.length}`);
}

checkConsoleErrors().catch(console.error);

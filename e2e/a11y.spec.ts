import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Explore page has 0 accessibility violations', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .exclude('.mapboxgl-map') // Exclude third-party map component
      .analyze();
    
    // Log violations if any for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:', JSON.stringify(results.violations, null, 2));
    }
    
    expect(results.violations).toEqual([]);
  });

  test('Offers page has 0 accessibility violations', async ({ page }) => {
    await page.goto('/offers');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page }).analyze();
    
    // Log violations if any for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:', JSON.stringify(results.violations, null, 2));
    }
    
    expect(results.violations).toEqual([]);
  });

  test('Wallet page has 0 accessibility violations', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page }).analyze();
    
    // Log violations if any for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:', JSON.stringify(results.violations, null, 2));
    }
    
    expect(results.violations).toEqual([]);
  });

  test('Homepage has proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for h1 element
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
    
    // Check heading hierarchy
    const results = await new AxeBuilder({ page })
      .include('main') // Focus on main content
      .withRules(['heading-order'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Check that all buttons and links are accessible
    const results = await new AxeBuilder({ page })
      .withRules(['keyboard-access', 'focus-order-semantics'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Forms have proper labels', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });
});
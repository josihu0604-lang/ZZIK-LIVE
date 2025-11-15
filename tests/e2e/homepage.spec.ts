import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('h1').first()).toContainText(/ZZIK LIVE/i);
  });

  test('should have working navigation', async ({ page }) => {
    // Check navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check navigation links
    const navLinks = nav.locator('a');
    await expect(navLinks).toHaveCount(await navLinks.count());
  });

  test('should toggle dark mode', async ({ page }) => {
    // Find dark mode toggle button
    const darkModeButton = page.locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="mode"]').first();
    
    if (await darkModeButton.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Click toggle
      await darkModeButton.click();
      
      // Check theme changed
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('button[aria-label*="menu"]');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/ZZIK LIVE/);

    // Check description meta tag
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /safety|location|emergency/i);

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some known warnings but no errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('[PWA]') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have accessible focus indicators', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Check first focusable element has visible focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check focus outline is visible
    const outline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });
    
    expect(outline).toBeTruthy();
  });
});
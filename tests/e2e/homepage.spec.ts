import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/ZZIK LIVE/);

    // Check main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation items
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be usable
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await expect(body).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Check description meta tag
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
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

    // Filter out known acceptable errors (like missing env vars in dev)
    const criticalErrors = errors.filter(
      (error) => !error.includes('DATABASE_URL') && !error.includes('REDIS_URL')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have accessibility attributes', async ({ page }) => {
    await page.goto('/');

    // Check for proper HTML structure
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
  });
});

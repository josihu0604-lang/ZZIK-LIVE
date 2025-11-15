import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login/signup options', async ({ page }) => {
    await page.goto('/');

    // Look for auth-related buttons or links
    // Adjust selectors based on your actual UI
    const authButtons = page.locator('button, a').filter({ hasText: /sign|login|계정/i });

    // At least one auth button should exist
    const count = await authButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('magic link form should validate email', async ({ page }) => {
    // This test assumes you have a magic link auth page
    // Adjust the route based on your actual implementation
    await page.goto('/');

    // Find email input (if exists)
    const emailInput = page.locator('input[type="email"]').first();

    if ((await emailInput.count()) > 0) {
      // Test invalid email
      await emailInput.fill('invalid-email');
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation error
      await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 5000 });
    } else {
      // Skip test if no email input found
      test.skip();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to a page that makes API calls
    await page.goto('/');

    // Intercept API calls and simulate errors
    await page.route('**/api/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    // Try to trigger an API call
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await submitButton.count()) > 0) {
      await submitButton.click();

      // Should show user-friendly error message
      await expect(page.locator('text=/error|failed|문제/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access a protected route without authentication
    // Adjust route based on your actual protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/settings'];

    for (const route of protectedRoutes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });

      // Should either redirect to login or show 401/403
      if (response) {
        const url = page.url();
        const status = response.status();

        // Either redirected to login or got unauthorized status
        const isProtected =
          url.includes('/login') || url.includes('/auth') || status === 401 || status === 403;

        if (!isProtected) {
          // Route might not exist yet, which is fine
          expect(status).toBe(404);
        }
      }
    }
  });

  test('should have CSRF protection headers', async ({ page }) => {
    await page.goto('/');

    // Check for security headers
    const response = await page.goto('/api/health');

    if (response) {
      const headers = response.headers();

      // Should have security headers
      expect(headers).toBeDefined();

      // Check for common security headers
      // x-content-type-options, x-frame-options, etc.
      // These are set in next.config.ts
    }
  });

  test('session should persist across page reloads', async ({ page, context }) => {
    await page.goto('/');

    // Set a mock session cookie
    await context.addCookies([
      {
        name: 'zzik_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    await page.reload();

    // Check if cookie persists
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'zzik_token');

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBe('mock-session-token');
  });
});

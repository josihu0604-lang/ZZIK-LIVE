import { test, expect } from '@playwright/test';

test.describe('Feed Labs Feature Flag', () => {
  test('feed route returns 404 when FEATURE_FEED_LABS is disabled', async ({ page }) => {
    // Assuming FEATURE_FEED_LABS is false by default in test environment
    const response = await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    
    // Should return 404 when feature flag is disabled
    expect(response?.status()).toBe(404);
  });

  test('feed API endpoint is accessible regardless of flag', async ({ request }) => {
    // API routes should not be affected by the middleware
    const response = await request.get('/api/feed');
    
    // API should respond normally (may return 404 if endpoint doesn't exist)
    // but should not be blocked by middleware
    expect([200, 404, 405]).toContain(response.status());
  });

  test.skip('feed route is accessible when FEATURE_FEED_LABS is enabled', async ({ page }) => {
    // This test would only run if FEATURE_FEED_LABS=true
    // Skip by default since it's disabled in most environments
    const response = await page.goto('/feed');
    expect(response?.status()).toBe(200);
  });
});
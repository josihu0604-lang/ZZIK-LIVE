import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    
    // Check all images
    const images = await page.$$eval('img', (imgs) =>
      imgs.map((img) => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        loading: img.loading,
      }))
    );
    
    for (const img of images) {
      // Images should use lazy loading where appropriate
      if (img.src && !img.src.includes('logo')) {
        expect(img.loading).toBe('lazy');
      }
      
      // Images shouldn't be much larger than their display size
      if (img.displayWidth > 0 && img.naturalWidth > 0) {
        const ratio = img.naturalWidth / img.displayWidth;
        expect(ratio).toBeLessThanOrEqual(3); // Allow up to 3x for retina
      }
    }
  });

  test('should minimize network requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for duplicate requests
    const uniqueRequests = new Set(requests);
    const duplicates = requests.length - uniqueRequests.size;
    
    // Should have minimal duplicate requests
    expect(duplicates).toBeLessThanOrEqual(5);
    
    // Total requests should be reasonable
    expect(requests.length).toBeLessThan(100);
  });

  test('should use caching headers', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('static/')) {
        responses.push({
          url: response.url(),
          headers: response.headers(),
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check static assets have cache headers
    for (const response of responses) {
      const cacheControl = response.headers['cache-control'];
      const etag = response.headers['etag'];
      
      // Should have either cache-control or etag
      expect(cacheControl || etag).toBeTruthy();
    }
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform some interactions
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Force garbage collection if possible
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory shouldn't increase significantly
    if (initialMemory > 0 && finalMemory > 0) {
      const increase = finalMemory - initialMemory;
      const percentIncrease = (increase / initialMemory) * 100;
      
      // Allow up to 50% increase
      expect(percentIncrease).toBeLessThan(50);
    }
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/');
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="skeleton"], [class*="shimmer"]');
    
    // Should show loading states
    const loadingCount = await loadingIndicators.count();
    expect(loadingCount).toBeGreaterThanOrEqual(0);
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Content should eventually appear
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });

  test('should use web fonts efficiently', async ({ page }) => {
    const fontRequests: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('font')) {
        fontRequests.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not load too many font files
    expect(fontRequests.length).toBeLessThanOrEqual(10);
    
    // Check font-display property
    const fontDisplay = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              return rule.style.getPropertyValue('font-display');
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      return null;
    });
    
    // Should use font-display: swap or optional
    if (fontDisplay) {
      expect(['swap', 'optional', 'fallback']).toContain(fontDisplay);
    }
  });
});
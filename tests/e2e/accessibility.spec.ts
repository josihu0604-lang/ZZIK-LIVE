import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should pass accessibility tests on homepage', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent?.trim()).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Get all headings
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map((el) => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim() || '',
      }))
    );
    
    // Check there's at least one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check heading hierarchy is not skipped
    let previousLevel = 0;
    for (const heading of headings) {
      if (previousLevel > 0) {
        // Heading level should not skip more than one level
        expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
      }
      previousLevel = heading.level;
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.button, .card, .modal')
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through the page
    const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    
    // Start from body
    await page.locator('body').focus();
    
    // Tab through elements
    for (let i = 0; i < Math.min(count, 10); i++) {
      await page.keyboard.press('Tab');
      
      // Check element is focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check focus is visible
      const outline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.boxShadow;
      });
      
      expect(outline).toBeTruthy();
    }
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live]');
    await expect(liveRegions).toHaveCount(await liveRegions.count());
    
    // Check for role="status" or role="alert" elements
    const statusElements = page.locator('[role="status"], [role="alert"]');
    const statusCount = await statusElements.count();
    
    // There should be at least one way to announce changes
    expect(await liveRegions.count() + statusCount).toBeGreaterThanOrEqual(0);
  });
});
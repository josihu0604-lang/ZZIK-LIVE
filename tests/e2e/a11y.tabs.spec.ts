/**
 * Accessibility Tests for Bottom Tab Navigation
 * Tests WCAG 2.1 AA compliance using axe-core
 * 
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 * @see https://github.com/dequelabs/axe-core-npm
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Bottom Tab Navigation Accessibility', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the explore page (default)
    await page.goto('/');
  });

  test('@a11y tabs have proper ARIA landmarks', async ({ page }) => {
    // Check that navigation landmark exists
    const nav = page.getByRole('navigation', { name: 'Bottom tabs' });
    await expect(nav).toBeVisible();

    // Check tablist role
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
  });

  test('@a11y tabs have proper ARIA roles', async ({ page }) => {
    // Get all tabs
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    // Ensure we have 4 tabs
    expect(tabCount).toBe(4);

    // Check each tab has aria-label
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const ariaLabel = await tab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('@a11y active tab has aria-selected and aria-current', async ({ page }) => {
    // Find the active tab (explore should be default)
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();

    // Check aria-current
    const ariaCurrent = await activeTab.getAttribute('aria-current');
    expect(ariaCurrent).toBe('page');
  });

  test('@a11y tabs are keyboard accessible', async ({ page }) => {
    // Focus on first tab
    await page.keyboard.press('Tab');
    
    // Check that a tab is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        role: el?.getAttribute('role'),
        tagName: el?.tagName
      };
    });

    // Should focus on a link within the tab navigation
    expect(['tab', 'TAB', 'A']).toContain(focusedElement.tagName || focusedElement.role);
  });

  test('@a11y tabs meet WCAG 2.1 AA standards', async ({ page }) => {
    // Run axe-core accessibility scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Expect no violations
    expect(results.violations).toEqual([]);
  });

  test('@a11y tab icons are properly hidden from screen readers', async ({ page }) => {
    // Get all icon elements
    const icons = page.locator('[role="tab"] svg');
    const iconCount = await icons.count();

    // Check each icon has aria-hidden
    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('@a11y tabs have sufficient touch target size', async ({ page }) => {
    // Get all tabs
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    // Check each tab meets 48x48px minimum
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const box = await tab.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(48);
        expect(box.height).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('@a11y focus indicator is visible', async ({ page }) => {
    // Focus on first tab
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();

    // Check computed outline style
    const outline = await firstTab.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
      };
    });

    // Should have visible outline
    expect(parseInt(outline.outlineWidth)).toBeGreaterThan(0);
    expect(outline.outlineStyle).not.toBe('none');
  });

});

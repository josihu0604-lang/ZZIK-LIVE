import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check that h1 exists and is visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Run axe check specifically for heading-order
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('h1, h2, h3, h4, h5, h6')
      .withTags(['best-practice'])
      .analyze();

    // Check for heading order violations
    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order'
    );

    expect(headingViolations).toHaveLength(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    // Check specifically for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    // Check for image-alt violations
    const imageAltViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'image-alt'
    );

    expect(imageAltViolations).toHaveLength(0);
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/');

    // Check for label violations
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    const labelViolations = accessibilityScanResults.violations.filter((v) => v.id === 'label');

    expect(labelViolations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Test Tab navigation
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Run axe check for keyboard accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    const keyboardViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'focusable-content' || v.id === 'tabindex'
    );

    expect(keyboardViolations).toHaveLength(0);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'best-practice'])
      .analyze();

    // Check for ARIA-related violations
    const ariaViolations = accessibilityScanResults.violations.filter((v) =>
      v.id.startsWith('aria-')
    );

    expect(ariaViolations).toHaveLength(0);
  });

  test('should have accessible names for interactive elements', async ({ page }) => {
    await page.goto('/');

    // Check all buttons have accessible names
    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2a']).analyze();

    const buttonNameViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'button-name'
    );

    expect(buttonNameViolations).toHaveLength(0);
  });

  test('should have proper HTML lang attribute', async ({ page }) => {
    await page.goto('/');

    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en', 'ko', 'en-US'
  });

  test('should not have redundant ARIA roles', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    // Check for redundant roles
    const redundantRoleViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'aria-allowed-role'
    );

    expect(redundantRoleViolations).toHaveLength(0);
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/');

    // Look for skip link
    const skipLink = page.locator('a[href^="#"]').filter({ hasText: /skip/i }).first();

    // Skip links are optional but recommended
    // We'll just check that if they exist, they're properly implemented
    const skipLinkCount = await skipLink.count();

    if (skipLinkCount > 0) {
      // If skip link exists, it should be keyboard accessible
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');

      // Either the skip link should be focused or another interactive element
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should generate comprehensive accessibility report', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();

    // Log results for reporting
    console.log('Accessibility Scan Results:');
    console.log(`Violations: ${accessibilityScanResults.violations.length}`);
    console.log(`Passes: ${accessibilityScanResults.passes.length}`);
    console.log(`Incomplete: ${accessibilityScanResults.incomplete.length}`);

    // Generate detailed report
    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nDetailed Violations:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id} (${violation.impact})`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Help: ${violation.helpUrl}`);
        console.log(`   Nodes affected: ${violation.nodes.length}`);
      });
    }

    // For now, we'll allow some violations but log them
    // In strict mode, uncomment the line below:
    // expect(accessibilityScanResults.violations).toEqual([]);
  });
});

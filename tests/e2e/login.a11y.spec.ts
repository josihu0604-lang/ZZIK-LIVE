import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('login: a11y serious/critical 0', async ({ page }) => {
  await page.goto('/auth/login');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  const bad = r.violations.filter(v => ['critical','serious'].includes(v.impact ?? ''));
  expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
});
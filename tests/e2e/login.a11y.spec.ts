// tests/e2e/login.a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Login a11y', () => {
  test('login: a11y critical/serious 없음', async ({ page }) => {
    await page.goto('/auth/login');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
    const critical = results.violations.filter(v => ['critical','serious'].includes(v.impact ?? ''));
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });

  test('login: 탭list/tabpanel ARIA 정합 + 키보드 이동', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('tablist', { name: '로그인 방식' })).toBeVisible();

    const social = page.getByRole('tab', { name: '소셜' });
    await social.focus();
    await page.keyboard.press('ArrowRight'); // 이메일로 포커스 이동 기대
    await expect(page.getByRole('tab', { name: '이메일' })).toBeFocused();

    // 둘러보기는 링크로 존재해야 함
    await expect(page.getByRole('link', { name: '로그인 없이 둘러보기' })).toBeVisible();
  });
});
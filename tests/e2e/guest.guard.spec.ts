// tests/e2e/guest.guard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guest Guard', () => {
  test('게스트: /pass는 접근 가능, /wallet은 로그인 유도', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: '로그인 없이 둘러보기' }).click();
    await expect(page).toHaveURL(/\/pass/);

    await page.goto('/wallet');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fwallet/);
  });

  test('게스트: /scan 접근 시 로그인 유도', async ({ page }) => {
    // Set guest cookie
    await page.context().addCookies([{
      name: 'zzik_guest',
      value: '1',
      path: '/',
      domain: 'localhost'
    }]);

    await page.goto('/scan');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan/);
  });
});
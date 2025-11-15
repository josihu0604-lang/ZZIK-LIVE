import { test, expect } from '@playwright/test';

test('guest: /pass ok, /wallet -> login', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByRole('link', { name: '로그인 없이 둘러보기' }).click();
  await expect(page).toHaveURL(/\/pass/);
  await page.goto('/wallet');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fwallet/);
});
import { test, expect } from '@playwright/test';

test.describe('ZZIK LIVE Core UI Flow', () => {
  test('스플래시 → 온보딩 → 로그인 flow', async ({ page }) => {
    // Start at splash page
    await page.goto('/splash');

    // Should automatically redirect to onboarding after 2 seconds (first time user)
    await page.waitForTimeout(2100);
    await expect(page).toHaveURL(/\/onboarding/);

    // Verify onboarding content
    await expect(page.locator('h2')).toContainText('현장 체험을 증명');

    // Navigate through onboarding slides
    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.locator('h2')).toContainText('내 주변 오퍼 발견');

    await page.getByRole('button', { name: '다음' }).click();
    await expect(page.locator('h2')).toContainText('LIVE 릴스로 공유');

    // Complete onboarding
    await page.getByRole('button', { name: '시작하기' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('로그인 → OTP 인증 → 탐색 탭 진입', async ({ page }) => {
    // Start at login page
    await page.goto('/auth/login');

    // Test email login
    await page.getByRole('tab', { name: '이메일' }).click();
    await page.getByLabel('이메일 입력').fill('test@example.com');
    await page.getByRole('button', { name: '로그인 링크 받기' }).click();

    // Should show success message
    await expect(page.getByText('이메일을 확인해주세요')).toBeVisible();

    // Test phone login with OTP
    await page.getByRole('tab', { name: '휴대폰' }).click();
    await page.getByLabel('휴대폰 번호 입력').fill('010-1234-5678');
    await page.getByRole('button', { name: 'OTP 받기' }).click();

    // Should navigate to OTP verification
    await expect(page).toHaveURL(/\/auth\/verify-otp/);

    // Enter OTP code
    const otpInputs = page.locator('input[type="text"]');
    await otpInputs.nth(0).fill('1');
    await otpInputs.nth(1).fill('2');
    await otpInputs.nth(2).fill('3');
    await otpInputs.nth(3).fill('4');
    await otpInputs.nth(4).fill('5');
    await otpInputs.nth(5).fill('6');

    // Wait for auto-submit
    await page.waitForTimeout(1500);

    // Should redirect to explore tab
    await expect(page).toHaveURL(/\/\(tabs\)\/explore/);
  });

  test('탭 네비게이션 동작', async ({ page }) => {
    // Set mock auth token
    await page.addInitScript(() => {
      localStorage.setItem('zzik_token', 'test_token');
      localStorage.setItem('zzik_onboarded', '1');
    });

    // Start at explore tab
    await page.goto('/(tabs)/explore');

    // Verify explore page content
    await expect(page.locator('h1')).toContainText('내 주변 LIVE 체험');

    // Navigate to offers tab
    await page.getByRole('link', { name: '오퍼' }).click();
    await expect(page).toHaveURL(/\/\(tabs\)\/offers/);
    await expect(page.locator('h1')).toContainText('받은 오퍼');

    // Navigate to scan tab
    await page.getByRole('link', { name: 'QR 코드 스캔' }).click();
    await expect(page).toHaveURL(/\/\(tabs\)\/scan/);
    await expect(page.locator('h1')).toContainText('QR 스캔');

    // Navigate to wallet tab
    await page.getByRole('link', { name: '나의 지갑' }).click();
    await expect(page).toHaveURL(/\/\(tabs\)\/wallet/);
    await expect(page.locator('h1')).toContainText('내 지갑');

    // Verify tab highlighting
    const walletTab = page.getByRole('link', { name: '나의 지갑' });
    await expect(walletTab).toHaveAttribute('aria-current', 'page');
  });

  test('권한 요청 UI 표시', async ({ page, context }) => {
    // Set mock auth token
    await page.addInitScript(() => {
      localStorage.setItem('zzik_token', 'test_token');
      localStorage.setItem('zzik_onboarded', '1');
    });

    // Mock permission denied
    await context.grantPermissions([], { origin: 'http://localhost:3000' });

    // Go to explore page
    await page.goto('/(tabs)/explore');

    // Should show location permission request
    await expect(page.getByText('위치 권한이 필요합니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '위치 권한 허용' })).toBeVisible();

    // Go to scan page
    await page.goto('/(tabs)/scan');

    // Should show camera permission request
    await expect(page.getByText('카메라 권한이 필요합니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '카메라 권한 허용' })).toBeVisible();
  });

  test('접근성 - 키보드 네비게이션', async ({ page }) => {
    // Set mock auth token
    await page.addInitScript(() => {
      localStorage.setItem('zzik_token', 'test_token');
      localStorage.setItem('zzik_onboarded', '1');
    });

    await page.goto('/(tabs)/explore');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '탐색' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '오퍼' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'QR 코드 스캔' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '나의 지갑' })).toBeFocused();

    // Activate with Enter key
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/\(tabs\)\/wallet/);
  });

  test('다크 모드 스타일 적용', async ({ page }) => {
    await page.goto('/splash');

    // Check dark mode CSS variables
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).getPropertyValue('background-color');
    });

    // Should have dark background (roughly #0B0F14 in RGB)
    expect(bgColor).toMatch(/rgb\(11,\s*15,\s*20\)/);
  });

  test('모바일 뷰포트 반응형', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/splash');

    // Content should be visible and properly sized
    const title = page.locator('h1');
    await expect(title).toBeVisible();

    const titleBox = await title.boundingBox();
    expect(titleBox?.width).toBeLessThan(350); // Should fit within mobile width
  });
});

test.describe('Privacy & Security', () => {
  test('geohash5만 사용 (raw coordinates 차단)', async ({ page }) => {
    // Mock console to capture errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem('zzik_token', 'test_token');
    });

    await page.goto('/(tabs)/explore');

    // Try to track with raw coordinates (should be blocked)
    await page.evaluate(() => {
      // @ts-ignore
      if (window.track) {
        try {
          // @ts-ignore
          window.track('map_view', {
            latitude: 37.5665,
            longitude: 126.978,
            zoom: 12,
          });
        } catch (e) {
          console.error('Privacy violation detected');
        }
      }
    });

    // Check for privacy violation error
    const hasPrivacyError = consoleErrors.some(
      (err) => err.includes('Privacy violation') || err.includes('Raw coordinates')
    );
    expect(hasPrivacyError).toBe(true);
  });

  test('삼중 검증 프로세스 표시', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('zzik_token', 'test_token');
    });

    await page.goto('/(tabs)/scan');

    // Verify triple verification process is displayed
    await expect(page.getByText('삼중 검증 프로세스')).toBeVisible();
    await expect(page.getByText('GPS로 현재 위치 확인')).toBeVisible();
    await expect(page.getByText('매장 QR 코드 스캔')).toBeVisible();
    await expect(page.getByText('영수증 촬영으로 최종 인증')).toBeVisible();
  });
});

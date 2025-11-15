import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('로그인 화면: 소셜3 + 둘러보기 노출', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check heading
    await expect(page.getByRole('heading', { 
      name: 'ZZIK LIVE 로그인' 
    })).toBeVisible();
    
    // Check social buttons
    await expect(page.getByRole('button', { 
      name: /Instagram으로 계속/ 
    })).toBeVisible();
    
    await expect(page.getByRole('button', { 
      name: /TikTok으로 계속/ 
    })).toBeVisible();
    
    await expect(page.getByRole('button', { 
      name: /Google로 계속/ 
    })).toBeVisible();
    
    // Check skip button (at least one should be visible)
    await expect(page.getByRole('button', { 
      name: '둘러보기' 
    }).first()).toBeVisible();
  });

  test('둘러보기: 게스트 쿠키 및 접근 제한', async ({ page, context }) => {
    // Go to login page
    await page.goto('/auth/login');
    
    // Click skip button
    await page.getByRole('button', { name: '둘러보기' }).first().click();
    
    // Should navigate to /pass
    await expect(page).toHaveURL(/\/pass/);
    
    // Check guest cookie was set
    const cookies = await context.cookies();
    const guestCookie = cookies.find(c => c.name === 'zzik_guest');
    expect(guestCookie?.value).toBe('1');
    
    // Try to access protected route
    await page.goto('/scan');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('기타 방법 토글 동작', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Initially, form should be hidden
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeHidden();
    
    // Click on "기타 방법"
    await page.getByText('기타 방법').click();
    
    // Now form should be visible
    await expect(emailInput).toBeVisible();
    
    // Check label and button
    await expect(page.getByText('이메일 주소')).toBeVisible();
    await expect(page.getByRole('button', { 
      name: '로그인 링크 받기' 
    })).toBeVisible();
  });

  test('스플래시 화면 자동 라우팅', async ({ page }) => {
    // Go to splash page
    await page.goto('/splash');
    
    // Check splash content
    await expect(page.getByRole('heading', { 
      name: 'ZZIK LIVE' 
    })).toBeVisible();
    
    await expect(page.getByText('지도 기반 LIVE 체험')).toBeVisible();
    
    // Wait for automatic navigation (should happen within 2s)
    await page.waitForURL(/\/(auth\/login|pass)/, { 
      timeout: 3000 
    });
    
    // Should be redirected to login or pass page
    const url = page.url();
    expect(url).toMatch(/\/(auth\/login|pass)/);
  });

  test('소셜 로그인 버튼 스타일 일관성', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Get all social buttons
    const instagramBtn = page.getByRole('button', { 
      name: /Instagram으로 계속/ 
    });
    const tiktokBtn = page.getByRole('button', { 
      name: /TikTok으로 계속/ 
    });
    const googleBtn = page.getByRole('button', { 
      name: /Google로 계속/ 
    });
    
    // Check they all have the same height (52px)
    const instagramBox = await instagramBtn.boundingBox();
    const tiktokBox = await tiktokBtn.boundingBox();
    const googleBox = await googleBtn.boundingBox();
    
    expect(instagramBox?.height).toBe(52);
    expect(tiktokBox?.height).toBe(52);
    expect(googleBox?.height).toBe(52);
    
    // Check they have same width
    expect(instagramBox?.width).toBe(tiktokBox?.width);
    expect(tiktokBox?.width).toBe(googleBox?.width);
  });

  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Start with Tab key navigation
    await page.keyboard.press('Tab');
    
    // First focusable element should be skip button
    const skipButton = page.getByRole('button', { 
      name: '둘러보기' 
    }).first();
    await expect(skipButton).toBeFocused();
    
    // Continue tabbing through social buttons
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { 
      name: /Instagram으로 계속/ 
    })).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { 
      name: /TikTok으로 계속/ 
    })).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { 
      name: /Google로 계속/ 
    })).toBeFocused();
  });

  test('게스트로 보호된 페이지 접근 시도', async ({ page }) => {
    // Set guest cookie
    await page.context().addCookies([{
      name: 'zzik_guest',
      value: '1',
      domain: 'localhost',
      path: '/'
    }]);
    
    // Try to access wallet (protected)
    await page.goto('/wallet');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fwallet/);
    
    // Try to access scan (protected)
    await page.goto('/scan');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan/);
    
    // Try to access pass (allowed)
    await page.goto('/pass');
    
    // Should stay on pass page
    await expect(page).toHaveURL(/\/pass/);
  });
});
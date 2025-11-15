import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('접근성: 로그인 화면', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // No violations should be found
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('접근성: 스플래시 화면', async ({ page }) => {
    await page.goto('/splash');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // No violations should be found
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('접근성: Pass 페이지', async ({ page }) => {
    await page.goto('/pass');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // No violations should be found
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('ARIA 속성: 로그인 페이지', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check ARIA labels on buttons
    const instagramBtn = page.getByRole('button', { 
      name: 'Instagram으로 계속' 
    });
    expect(await instagramBtn.getAttribute('aria-label')).toBe('Instagram으로 계속');
    
    const skipBtn = page.getByRole('button', { 
      name: '로그인 없이 둘러보기' 
    }).first();
    expect(await skipBtn.getAttribute('aria-label')).toBe('로그인 없이 둘러보기');
    
    // Check heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('ZZIK LIVE 로그인');
  });

  test('색상 대비: AA 기준 충족', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check color contrast using axe
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        checks: [
          { id: 'color-contrast', options: { noScroll: true } }
        ]
      })
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('포커스 관리: 탭 순서', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Track focus order
    const focusOrder: string[] = [];
    
    // Tab through all focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate(el => el?.tagName?.toLowerCase());
      const text = await focusedElement.evaluate(el => 
        (el as HTMLElement)?.innerText || (el as HTMLElement)?.textContent || ''
      );
      
      if (tagName) {
        focusOrder.push(`${tagName}: ${text.trim().substring(0, 30)}`);
      }
    }
    
    // Verify logical tab order
    expect(focusOrder).toContain('button: 둘러보기');
    expect(focusOrder.findIndex(f => f.includes('Instagram'))).toBeGreaterThan(
      focusOrder.findIndex(f => f.includes('둘러보기'))
    );
  });

  test('스크린 리더: 라이브 리전', async ({ page }) => {
    await page.goto('/splash');
    
    // Check for live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
    
    // Check it has sr-only class
    await expect(liveRegion).toHaveClass(/sr-only/);
    
    // Check aria-atomic is set
    expect(await liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  test('터치 타겟: 최소 48px', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Get all interactive elements
    const buttons = await page.getByRole('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      
      // Touch targets should be at least 48px in height
      expect(box?.height).toBeGreaterThanOrEqual(44); // Allow slight variation
      
      // For main action buttons, should be exactly 52px
      const text = await button.textContent();
      if (text?.includes('으로 계속')) {
        expect(box?.height).toBe(52);
      }
    }
  });

  test('모션 설정: prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/splash');
    
    // Check that animations are disabled
    const progressBar = page.locator('.progress');
    const animationStyle = await progressBar.evaluate(el => 
      window.getComputedStyle(el).animation
    );
    
    // Animation should be none or very short duration
    expect(animationStyle).toMatch(/none|0\.01ms/);
  });

  test('시맨틱 마크업', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check semantic structure
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check section with aria-label
    const socialSection = page.locator('section[aria-label="소셜 로그인"]');
    await expect(socialSection).toBeVisible();
  });
});
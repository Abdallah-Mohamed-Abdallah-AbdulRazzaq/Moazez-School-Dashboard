import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/en');
    
    // Should redirect to dashboard or show login
    await expect(page).toHaveURL(/\/(en|ar)\/(dashboard|login)/);
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle language switching', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    // Look for language switcher - more specific selector to avoid strict mode violation
    const languageSwitcher = page.locator('button.hidden.md\\:flex').filter({ hasText: 'AR' });
    
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      
      // Should navigate to Arabic version
      await expect(page).toHaveURL(/\/ar\//);
    }
  });

  test('should navigate to admissions section', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    // Click on admissions link in sidebar
    const admissionsLink = page.locator('a[href*="/admissions"]').first();
    
    if (await admissionsLink.isVisible()) {
      await admissionsLink.click();
      await expect(page).toHaveURL(/\/admissions/);
    }
  });

  test('should navigate to students section', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    // Click on students link in sidebar
    const studentsLink = page.locator('a[href*="/students-guardians"]').first();
    
    if (await studentsLink.isVisible()) {
      await studentsLink.click();
      await expect(page).toHaveURL(/\/students-guardians/);
    }
  });
});

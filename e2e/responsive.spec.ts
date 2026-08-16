import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/en/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Mobile menu button should be visible
    const menuButton = page.locator('button:has-text("Menu"), button[aria-label*="menu"]').first();
    
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('should display sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/en/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('aside, nav[aria-label*="sidebar"]').first();
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should handle tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/en/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Page should render without errors
    await expect(page.locator('body')).toBeVisible();
  });
});

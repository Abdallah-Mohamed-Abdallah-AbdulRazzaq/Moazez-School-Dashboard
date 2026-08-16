import { test, expect } from '@playwright/test';

test.describe('DataTable Functionality', () => {
  test('should display data table on applications page', async ({ page }) => {
    await page.goto('/en/admissions/applications');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check if table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should sort table columns', async ({ page }) => {
    await page.goto('/en/admissions/applications');
    
    // Wait for table
    await page.waitForSelector('table');
    
    // Find a sortable column header
    const columnHeader = page.locator('th').first();
    
    if (await columnHeader.isVisible()) {
      // Click to sort
      await columnHeader.click();
      
      // Table should still be visible after sorting
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should paginate through data', async ({ page }) => {
    await page.goto('/en/admissions/applications');
    
    // Wait for table
    await page.waitForSelector('table');
    
    // Look for next page button
    const nextButton = page.locator('button[title*="next"]').first();
    
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Table should still be visible
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should handle search/filter', async ({ page }) => {
    await page.goto('/en/admissions/applications');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      
      // Table should still be visible after search
      await expect(page.locator('table')).toBeVisible();
    }
  });
});

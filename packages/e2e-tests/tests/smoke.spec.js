import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Functionality', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify key elements are present (more reliable than title)
    await expect(page.locator('h1:has-text("What do you want to automate?")')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/smoke-landing.png' });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/fusion-dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard loads
    await expect(page.locator('h1:has-text("FlashFusion")')).toBeVisible();
    
    // Verify tabs are present
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('button:has-text("Editor")')).toBeVisible();
    await expect(page.locator('button:has-text("Preview")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/smoke-dashboard.png' });
  });

  test('should handle basic interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test prompt input
    await page.fill('textarea', 'Test input');
    const value = await page.inputValue('textarea');
    expect(value).toBe('Test input');
    
    // Test navigation
    await page.click('a[href="/fusion-dashboard"]');
    await expect(page).toHaveURL(/.*fusion-dashboard/);
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/smoke-interactions.png' });
  });
});
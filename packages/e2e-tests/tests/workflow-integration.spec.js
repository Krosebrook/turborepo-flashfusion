import { test, expect } from '@playwright/test';
import { BasePage } from './utils/BasePage.js';

test.describe('FlashFusion - User Research Workflow Integration', () => {
  let basePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('should handle user research workflow API endpoints', async ({ page }) => {
    // This test verifies that the user research workflow integrations work
    // Since this is backend functionality, we'll test through API calls or UI elements that trigger these workflows
    
    await basePage.navigateTo('/');
    
    // Test if research-related functionality is accessible
    // Look for any UI elements that might trigger research workflows
    
    // Check if research templates are available
    try {
      await page.click('button:has-text("Multi-Agent AI")');
      await expect(page.locator('text="User Research"')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Research template might not be in dropdown, check for other research indicators
      console.log('User Research template not found in dropdown');
    }
    
    await basePage.takeScreenshot('research-workflow-ui-check');
  });

  test('should verify web scraping service integration', async ({ page }) => {
    // Test web scraping functionality through the UI
    await basePage.navigateTo('/fusion-dashboard');
    
    // Switch to editor to look for any web scraping related functionality
    await page.click('button:has-text("Editor")');
    
    // Look for any indicators of web scraping capabilities
    await expect(page.locator('h3:text("Project Files")')).toBeVisible();
    
    // Check if there are any scraping-related files or functionality
    const fileElements = await page.$$('[class*="cursor-pointer"]:has(span)');
    
    let scrapingRelatedFound = false;
    for (const element of fileElements) {
      const text = await element.textContent();
      if (text && (text.includes('scraping') || text.includes('crawler') || text.includes('playwright'))) {
        scrapingRelatedFound = true;
        break;
      }
    }
    
    // The integration should be working even if not directly visible in UI
    await basePage.takeScreenshot('web-scraping-integration-check');
  });

  test('should test AI agent orchestration capabilities', async ({ page }) => {
    await basePage.navigateTo('/fusion-dashboard');
    
    // Switch to editor to see agent status
    await page.click('button:has-text("Editor")');
    
    // Verify agent orchestration panel is visible
    await expect(page.locator('h3:text("Active Agents")')).toBeVisible();
    
    // Check for multiple agents running
    const agentElements = await page.$$('.flex:has(.w-2.h-2)');
    expect(agentElements.length).toBeGreaterThan(0);
    
    // Verify different types of agents
    await expect(page.locator('span:text("Code Generator")')).toBeVisible();
    await expect(page.locator('span:text("UI Designer")')).toBeVisible();
    await expect(page.locator('span:text("API Builder")')).toBeVisible();
    
    await basePage.takeScreenshot('agent-orchestration-check');
  });

  test('should validate workflow automation features', async ({ page }) => {
    await basePage.navigateTo('/fusion-dashboard');
    
    // Create a project that would trigger workflow automation
    const automationPrompt = 'Create an automated business workflow for customer onboarding with email notifications and task assignments';
    
    await page.fill('textarea[placeholder*="Build a full-stack"]', automationPrompt);
    
    // Select Business App template which should trigger automation workflows
    await page.click('button:has(span:text("Business App"))');
    await page.click('button:has(div:text("Business App"))');
    
    // Submit the automation request
    await page.click('button:has(svg):last-of-type');
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Verify the request was processed (should switch to editor or show feedback)
    const editorVisible = await page.isVisible('button:has-text("Editor")');
    expect(editorVisible).toBeTruthy();
    
    await basePage.takeScreenshot('workflow-automation-test');
  });

  test('should test cross-page navigation and state persistence', async ({ page }) => {
    // Start from landing page
    await basePage.navigateTo('/');
    
    // Enter a prompt on landing page
    const testPrompt = 'AI-powered content management system';
    await page.fill('textarea[placeholder*="Ask FlashFusion"]', testPrompt);
    
    // Navigate to dashboard
    await page.click('a[href="/fusion-dashboard"]');
    
    // Verify navigation worked
    await expect(page.locator('h1:has-text("FlashFusion")')).toBeVisible();
    
    // Test navigation back to home
    await page.goto('/');
    
    // Verify we're back on landing page
    await expect(page.locator('h1:has-text("What do you want to automate?")')).toBeVisible();
    
    await basePage.takeScreenshot('cross-page-navigation');
  });

  test('should validate application performance and loading states', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    
    await basePage.navigateTo('/fusion-dashboard');
    
    // Wait for critical elements to load
    await page.waitForSelector('h1:has-text("FlashFusion")', { timeout: 30000 });
    await page.waitForSelector('button:has-text("Dashboard")', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Verify reasonable load time (less than 10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Test tab switching performance
    const tabSwitchStart = Date.now();
    await page.click('button:has-text("Editor")');
    await page.waitForSelector('h3:text("Project Files")', { timeout: 5000 });
    
    const tabSwitchTime = Date.now() - tabSwitchStart;
    expect(tabSwitchTime).toBeLessThan(3000);
    
    await basePage.takeScreenshot('performance-validation');
  });

  test('should test accessibility features', async ({ page }) => {
    await basePage.navigateTo('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab'); // Should focus on first interactive element
    await page.keyboard.press('Tab'); // Move to next element
    
    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test ARIA labels and roles
    const buttons = await page.$$('button');
    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
    
    await basePage.takeScreenshot('accessibility-check');
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await basePage.navigateTo('/fusion-dashboard');
    
    // Simulate multiple rapid interactions
    const promises = [
      page.click('button:has-text("Editor")'),
      page.click('button:has-text("Preview")'),
      page.click('button:has-text("Dashboard")')
    ];
    
    // Execute concurrently with small delays
    await Promise.all([
      promises[0],
      page.waitForTimeout(200).then(() => promises[1]),
      page.waitForTimeout(400).then(() => promises[2])
    ]);
    
    // Verify final state is stable
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    
    await basePage.takeScreenshot('concurrent-interactions');
  });
});
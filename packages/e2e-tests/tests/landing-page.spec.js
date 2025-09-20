import { test, expect } from '@playwright/test';
import { LandingPage } from './utils/LandingPage.js';

test.describe('FlashFusion Landing Page', () => {
  let landingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.navigateToHome();
  });

  test('should load landing page with all essential elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/FlashFusion/);
    
    // Verify hero section is visible
    await landingPage.assertHeroSectionVisible();
    
    // Verify features section is visible
    await landingPage.assertFeaturesVisible();
    
    // Take screenshot for verification
    await landingPage.takeScreenshot('landing-page-loaded');
  });

  test('should display project cards on landing page', async ({ page }) => {
    // Wait for projects to load
    const projects = await landingPage.assertProjectsVisible();
    
    // Verify we have expected project cards
    expect(projects.length).toBeGreaterThan(0);
    
    // Verify project cards have required information
    projects.forEach(project => {
      expect(project.title).toBeTruthy();
      expect(project.status).toMatch(/(Active|Building|Deployed)/);
    });
  });

  test('should navigate to Fusion IDE from landing page', async ({ page }) => {
    // Click Fusion IDE link
    await landingPage.navigateToFusionIDE();
    
    // Verify navigation to dashboard
    await expect(page).toHaveURL(/.*fusion-dashboard/);
    await expect(page.locator('h1')).toContainText('FlashFusion');
  });

  test('should allow prompt input and submission', async ({ page }) => {
    const testPrompt = 'Create a simple React todo app with state management';
    
    // Enter prompt text
    await landingPage.enterPrompt(testPrompt);
    
    // Verify text was entered
    const promptValue = await page.inputValue(landingPage.selectors.promptTextarea);
    expect(promptValue).toBe(testPrompt);
    
    // Submit the prompt
    await landingPage.submitPrompt();
    
    // Take screenshot after submission
    await landingPage.takeScreenshot('prompt-submitted');
  });

  test('should allow template and model selection', async ({ page }) => {
    // Test template selection
    await landingPage.selectTemplate('E-commerce Platform');
    
    // Verify template was selected (check if dropdown shows the new selection)
    await expect(page.locator(landingPage.selectors.templateDropdown)).toContainText('E-commerce Platform');
    
    // Test model selection
    await landingPage.selectModel('GPT-4 Turbo');
    
    // Verify model was selected
    await expect(page.locator(landingPage.selectors.modelDropdown)).toContainText('GPT-4 Turbo');
  });

  test('should complete full project creation flow', async ({ page }) => {
    const projectPrompt = 'Build a customer management dashboard with real-time analytics';
    
    // Complete project creation flow
    await landingPage.createProject(
      projectPrompt, 
      'Analytics Dashboard', 
      'Claude Sonnet 4'
    );
    
    // Wait for any loading states or redirects
    await page.waitForTimeout(3000);
    
    // Take screenshot of final state
    await landingPage.takeScreenshot('project-creation-completed');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page with mobile viewport
    await landingPage.navigateToHome();
    
    // Verify hero section is still visible and functional
    await landingPage.assertHeroSectionVisible();
    
    // Test prompt input on mobile
    await landingPage.enterPrompt('Test mobile input');
    
    // Take mobile screenshot
    await landingPage.takeScreenshot('landing-page-mobile');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on prompt textarea
    await page.focus(landingPage.selectors.promptTextarea);
    
    // Type using keyboard
    await page.keyboard.type('Test keyboard input for automation project');
    
    // Submit using Enter key
    await page.keyboard.press('Enter');
    
    // Verify submission (assuming it triggers some action or alert)
    await page.waitForTimeout(1000);
    
    await landingPage.takeScreenshot('keyboard-navigation-test');
  });
});
import { test, expect } from '@playwright/test';
import { FusionDashboardPage } from './utils/FusionDashboardPage.js';

test.describe('FlashFusion Dashboard - Critical User Journeys', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new FusionDashboardPage(page);
    await dashboardPage.navigateToDashboard();
  });

  test('should load Fusion Dashboard with all tabs and components', async ({ page }) => {
    // Verify dashboard loads correctly
    await dashboardPage.assertDashboardLoaded();
    
    // Verify all tabs are present and clickable
    await expect(page.locator(dashboardPage.selectors.dashboardTab)).toBeVisible();
    await expect(page.locator(dashboardPage.selectors.editorTab)).toBeVisible();
    await expect(page.locator(dashboardPage.selectors.previewTab)).toBeVisible();
    
    // Take screenshot of initial dashboard state
    await dashboardPage.takeScreenshot('dashboard-loaded');
  });

  test('should switch between dashboard tabs successfully', async ({ page }) => {
    // Test Dashboard tab
    await dashboardPage.switchToTab('dashboard');
    await expect(page.locator(dashboardPage.selectors.heroTitle)).toBeVisible();
    
    // Test Editor tab
    await dashboardPage.switchToTab('editor');
    await dashboardPage.assertEditorLoaded();
    
    // Test Preview tab
    await dashboardPage.switchToTab('preview');
    await dashboardPage.assertPreviewLoaded();
    
    // Return to dashboard
    await dashboardPage.switchToTab('dashboard');
    
    await dashboardPage.takeScreenshot('tab-navigation-complete');
  });

  test('should create project from dashboard prompt', async ({ page }) => {
    const projectPrompt = 'Create a React e-commerce app with shopping cart and payment integration';
    
    // Create project from dashboard
    await dashboardPage.createProjectFromDashboard(projectPrompt, 'E-commerce');
    
    // Verify project creation feedback
    // The app should switch to editor tab and show generation progress
    await page.waitForSelector(dashboardPage.selectors.editorTab, { state: 'visible' });
    
    // Take screenshot after project creation
    await dashboardPage.takeScreenshot('project-created-from-dashboard');
  });

  test('should interact with code editor and file system', async ({ page }) => {
    // Switch to editor tab
    await dashboardPage.switchToTab('editor');
    
    // Verify file tree is loaded
    await dashboardPage.assertEditorLoaded();
    
    // Open a file
    await dashboardPage.openFile('app.js');
    
    // Wait for editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // Edit some code
    const testCode = `// E2E Test Code
import React from 'react';

function TestApp() {
  return <h1>E2E Test Success!</h1>;
}

export default TestApp;`;
    
    await dashboardPage.editCode(testCode);
    
    // Run the code
    await dashboardPage.runCode();
    
    // Take screenshot of editor state
    await dashboardPage.takeScreenshot('code-editor-interaction');
  });

  test('should use AI chat assistant functionality', async ({ page }) => {
    // Switch to editor to access chat
    await dashboardPage.switchToTab('editor');
    
    // Send a message to AI assistant
    const testMessage = 'Help me optimize this React component for performance';
    await dashboardPage.sendChatMessage(testMessage);
    
    // Verify chat messages appear
    const messages = await dashboardPage.getChatMessages();
    expect(messages.length).toBeGreaterThan(0);
    
    // Verify our message is in the chat
    const hasUserMessage = messages.some(msg => msg.includes('Help me optimize'));
    expect(hasUserMessage).toBeTruthy();
    
    // Take screenshot of chat interaction
    await dashboardPage.takeScreenshot('ai-chat-interaction');
  });

  test('should switch preview device modes', async ({ page }) => {
    // Switch to preview tab
    await dashboardPage.switchToTab('preview');
    
    // Test mobile preview
    await dashboardPage.switchPreviewDevice('mobile');
    
    // Verify mobile viewport is active
    await expect(page.locator('.w-80')).toBeVisible(); // Mobile width container
    
    // Test desktop preview
    await dashboardPage.switchPreviewDevice('desktop');
    
    // Verify desktop viewport is active
    await expect(page.locator('.w-full')).toBeVisible(); // Full width container
    
    // Test refresh functionality
    await dashboardPage.refreshPreview();
    
    await dashboardPage.takeScreenshot('preview-device-modes');
  });

  test('should display active agent status', async ({ page }) => {
    // Switch to editor to see agent status
    await dashboardPage.switchToTab('editor');
    
    // Verify agent status panel is visible
    await dashboardPage.assertAgentStatusVisible();
    
    // Check for specific agents
    await expect(page.locator('span:text("Code Generator")')).toBeVisible();
    await expect(page.locator('span:text("UI Designer")')).toBeVisible();
    await expect(page.locator('span:text("API Builder")')).toBeVisible();
    
    await dashboardPage.takeScreenshot('agent-status-display');
  });

  test('should complete full development workflow', async ({ page }) => {
    // 1. Create project from dashboard
    await dashboardPage.createProjectFromDashboard(
      'Build a todo app with local storage',
      'Next.js App'
    );
    
    // 2. Edit code in editor
    await dashboardPage.switchToTab('editor');
    await dashboardPage.openFile('app.js');
    
    // Wait for Monaco editor
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // 3. Chat with AI for help
    await dashboardPage.sendChatMessage('Add error handling to this component');
    
    // 4. Run the code
    await dashboardPage.runCode();
    
    // 5. Check preview
    await dashboardPage.switchToTab('preview');
    await dashboardPage.switchPreviewDevice('mobile');
    
    // 6. Deploy (just click the button)
    await page.click(dashboardPage.selectors.deployButton);
    
    await dashboardPage.takeScreenshot('full-workflow-completed');
  });

  test('should handle responsive design in dashboard', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Verify dashboard still loads properly
    await dashboardPage.assertDashboardLoaded();
    
    // Test mobile viewport  
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Basic functionality should still work
    await expect(page.locator(dashboardPage.selectors.title)).toBeVisible();
    
    await dashboardPage.takeScreenshot('dashboard-responsive');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Switch to editor
    await dashboardPage.switchToTab('editor');
    
    // Try to open a non-existent file (should handle gracefully)
    try {
      await page.click('span:text("nonexistent.js")', { timeout: 2000 });
    } catch (error) {
      // Expected to fail, this tests error handling
    }
    
    // Try invalid chat input
    await dashboardPage.sendChatMessage('');
    
    // The app should continue to function
    await expect(page.locator(dashboardPage.selectors.title)).toBeVisible();
    
    await dashboardPage.takeScreenshot('error-handling-test');
  });
});
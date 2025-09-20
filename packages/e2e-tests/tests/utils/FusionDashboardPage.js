import { BasePage } from './BasePage.js';

/**
 * Page Object Model for FlashFusion Dashboard
 */
export class FusionDashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      // Header
      header: 'header',
      title: 'h1:has-text("FlashFusion")',
      
      // Navigation tabs
      dashboardTab: 'button:has-text("Dashboard")',
      editorTab: 'button:has-text("Editor")',
      previewTab: 'button:has-text("Preview")',
      
      // Dashboard content
      heroTitle: 'h1:has-text("What do you want to build?")',
      promptTextarea: 'textarea[placeholder*="Build a full-stack"]',
      templateDropdown: 'button:has(span:text("Business App"))',
      modelDropdown: 'button:has(span:text("Claude Sonnet 4"))',
      submitButton: 'button:has(svg):last-of-type', // Submit arrow button
      
      // Editor elements
      fileTree: '.w-64:has(h3:text("Project Files"))',
      fileItem: '[class*="cursor-pointer"]:has([class*="w-4 h-4"])',
      editor: '.monaco-editor',
      fileTab: 'button:has-text(".js"), button:has-text(".css")',
      runButton: 'button:has-text("Run")',
      terminal: '.font-mono:has(span:text("Terminal"))',
      
      // Chat panel
      chatPanel: '.w-80:has(h3:text("AI Assistant"))',
      chatMessages: '.space-y-4',
      chatInput: 'input[placeholder*="Ask AI"]',
      chatSendButton: 'button[type="submit"]:has(svg)',
      
      // Preview elements
      previewFrame: '.mx-auto.bg-white',
      deviceToggle: 'button:has([data-testid="monitor"]), button:has([data-testid="smartphone"])',
      refreshButton: 'button:has-text("Refresh")',
      
      // Project elements
      projectCards: '.group.cursor-pointer',
      newProjectButton: 'button:has-text("New Project")',
      deployButton: 'button:has-text("Deploy")',
      
      // Agent status
      agentStatus: '.space-y-2:has(span:text("Code Generator"))'
    };
  }

  async navigateToDashboard() {
    await this.navigateTo('/fusion-dashboard');
    await this.waitForElement(this.selectors.title);
  }

  // Tab Navigation
  async switchToTab(tabName) {
    const selector = this.selectors[`${tabName.toLowerCase()}Tab`];
    if (!selector) {
      throw new Error(`Unknown tab: ${tabName}`);
    }
    await this.clickElement(selector);
    await this.page.waitForTimeout(500); // Wait for tab switch animation
  }

  // Dashboard functionality
  async createProjectFromDashboard(promptText, templateName = null) {
    await this.switchToTab('dashboard');
    await this.enterPrompt(promptText);
    
    if (templateName) {
      await this.selectTemplate(templateName);
    }
    
    await this.submitPrompt();
    await this.page.waitForTimeout(2000); // Wait for generation simulation
  }

  async enterPrompt(text) {
    await this.fillInput(this.selectors.promptTextarea, text);
  }

  async submitPrompt() {
    await this.clickElement(this.selectors.submitButton);
  }

  async selectTemplate(templateName) {
    await this.clickElement(this.selectors.templateDropdown);
    await this.clickElement(`button:has(div:text("${templateName}"))`);
  }

  // Editor functionality
  async openFile(fileName) {
    await this.switchToTab('editor');
    await this.clickElement(`[class*="cursor-pointer"]:has(span:text("${fileName}"))`);
    await this.page.waitForTimeout(500);
  }

  async editCode(code) {
    await this.switchToTab('editor');
    // Click in the Monaco editor area
    await this.page.click('.monaco-editor .monaco-editor-background');
    await this.page.keyboard.press('Control+A'); // Select all
    await this.page.keyboard.type(code);
  }

  async runCode() {
    await this.clickElement(this.selectors.runButton);
    await this.page.waitForTimeout(1000); // Wait for execution feedback
  }

  // Chat functionality
  async sendChatMessage(message) {
    await this.fillInput(this.selectors.chatInput, message);
    await this.clickElement(this.selectors.chatSendButton);
    await this.page.waitForTimeout(1500); // Wait for AI response simulation
  }

  async getChatMessages() {
    await this.waitForElement(this.selectors.chatMessages);
    return await this.page.$$eval(`${this.selectors.chatMessages} > div`, messages => 
      messages.map(msg => msg.textContent?.trim())
    );
  }

  // Preview functionality
  async switchPreviewDevice(device = 'mobile') {
    await this.switchToTab('preview');
    if (device === 'mobile') {
      await this.clickElement('button:has([class*="smartphone"])');
    } else {
      await this.clickElement('button:has([class*="monitor"])');
    }
    await this.page.waitForTimeout(500);
  }

  async refreshPreview() {
    await this.switchToTab('preview');
    await this.clickElement(this.selectors.refreshButton);
  }

  // Assertions
  async assertDashboardLoaded() {
    await this.assertElementExists(this.selectors.title, 'Dashboard title should be visible');
    await this.assertElementExists(this.selectors.dashboardTab, 'Dashboard tab should be visible');
    await this.assertElementExists(this.selectors.heroTitle, 'Hero title should be visible');
  }

  async assertEditorLoaded() {
    await this.switchToTab('editor');
    await this.assertElementExists(this.selectors.fileTree, 'File tree should be visible');
    await this.assertElementExists(this.selectors.chatPanel, 'Chat panel should be visible');
  }

  async assertPreviewLoaded() {
    await this.switchToTab('preview');
    await this.assertElementExists(this.selectors.previewFrame, 'Preview frame should be visible');
  }

  async assertAgentStatusVisible() {
    await this.switchToTab('editor');
    await this.assertElementExists(this.selectors.agentStatus, 'Agent status should be visible');
  }
}
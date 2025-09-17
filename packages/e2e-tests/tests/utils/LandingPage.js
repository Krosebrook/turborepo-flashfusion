import { BasePage } from './BasePage.js';

/**
 * Page Object Model for FlashFusion Landing Page
 */
export class LandingPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      heroTitle: 'h1:has-text("What do you want to automate?")',
      promptTextarea: 'textarea[placeholder*="Ask FlashFusion"]',
      templateDropdown: 'button:has-text("Multi-Agent AI")',
      modelDropdown: 'button:has-text("Claude Sonnet 4")',
      submitButton: 'button[type="submit"]:has(svg)', // Submit button with arrow icon
      fusionIDELink: 'a[href="/fusion-dashboard"]',
      projectCards: '[data-testid="project-card"], .group:has(h3)', // Project cards
      newProjectButton: 'button:has-text("New Project")',
      featuresGrid: '.grid:has(.group)',
      header: 'header',
      footer: 'footer'
    };
  }

  async navigateToHome() {
    await this.navigateTo('/');
    await this.waitForElement(this.selectors.heroTitle);
  }

  async enterPrompt(text) {
    await this.fillInput(this.selectors.promptTextarea, text);
  }

  async submitPrompt() {
    await this.clickElement(this.selectors.submitButton);
  }

  async selectTemplate(templateName) {
    await this.clickElement(this.selectors.templateDropdown);
    await this.clickElement(`button:has-text("${templateName}")`);
  }

  async selectModel(modelName) {
    await this.clickElement(this.selectors.modelDropdown);
    await this.clickElement(`button:has-text("${modelName}")`);
  }

  async navigateToFusionIDE() {
    await this.clickElement(this.selectors.fusionIDELink);
  }

  async createProject(promptText, templateName = null, modelName = null) {
    await this.enterPrompt(promptText);
    
    if (templateName) {
      await this.selectTemplate(templateName);
    }
    
    if (modelName) {
      await this.selectModel(modelName);
    }
    
    await this.submitPrompt();
  }

  async getProjectCards() {
    return await this.page.$$eval(this.selectors.projectCards, cards => 
      cards.map(card => {
        const title = card.querySelector('h3')?.textContent?.trim();
        const status = card.querySelector('[class*="text-green"], [class*="text-yellow"], [class*="text-blue"]')?.textContent?.trim();
        return { title, status };
      })
    );
  }

  async assertHeroSectionVisible() {
    await this.assertElementExists(this.selectors.heroTitle, 'Hero title should be visible');
    await this.assertElementExists(this.selectors.promptTextarea, 'Prompt textarea should be visible');
    await this.assertElementExists(this.selectors.submitButton, 'Submit button should be visible');
  }

  async assertFeaturesVisible() {
    await this.assertElementExists(this.selectors.featuresGrid, 'Features grid should be visible');
  }

  async assertProjectsVisible() {
    const projects = await this.getProjectCards();
    if (projects.length === 0) {
      throw new Error('No project cards found');
    }
    return projects;
  }
}
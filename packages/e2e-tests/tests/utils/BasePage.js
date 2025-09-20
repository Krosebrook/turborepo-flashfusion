/**
 * Base Page Object Model for FlashFusion E2E tests
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigateTo(path = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElement(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      timeout: 10000,
      ...options
    });
  }

  async clickElement(selector) {
    await this.page.click(selector);
  }

  async fillInput(selector, value) {
    await this.page.fill(selector, value);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async isElementVisible(selector) {
    return await this.page.isVisible(selector);
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async assertElementExists(selector, message = '') {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element '${selector}' not found. ${message}`);
    }
    return element;
  }

  async assertPageTitle(expectedTitle) {
    const title = await this.page.title();
    if (!title.includes(expectedTitle)) {
      throw new Error(`Expected page title to contain '${expectedTitle}', but got '${title}'`);
    }
  }
}
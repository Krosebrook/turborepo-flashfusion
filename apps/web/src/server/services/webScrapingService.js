/**
 * FlashFusion Web Scraping and Automation Service
 * Combines Firecrawl for content extraction and Playwright for browser automation
 * Use context7 for latest documentation and best practices
 */

const FirecrawlApp = require('@mendable/firecrawl-js').default;
const { chromium, firefox, webkit } = require('playwright');
const logger = require('../../utils/logger');

class WebScrapingService {
    constructor() {
    // Initialize Firecrawl with API key from environment (if available)
        this.firecrawl = null;
        if (
            process.env.FIRECRAWL_API_KEY &&
      process.env.FIRECRAWL_API_KEY !== 'your_firecrawl_api_key_here'
        ) {
            try {
                this.firecrawl = new FirecrawlApp({
                    apiKey: process.env.FIRECRAWL_API_KEY
                });
            } catch (error) {
                logger.warn('Failed to initialize Firecrawl:', error.message);
            }
        } else {
            logger.info(
                'Firecrawl API key not configured - Firecrawl features will be disabled'
            );
        }

        this.browserInstances = new Map();
        this.defaultBrowserOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        };
    }

    /**
   * Extract content from a URL using Firecrawl
   * @param {string} url - Target URL
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extracted content
   */
    async extractContent(url, options = {}) {
        try {
            logger.info(`Extracting content from: ${url}`);

            if (!this.firecrawl) {
                return {
                    success: false,
                    error:
            'Firecrawl not configured - please set FIRECRAWL_API_KEY environment variable'
                };
            }

            const defaultOptions = {
                formats: ['markdown', 'html'],
                includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a'],
                excludeTags: ['script', 'style', 'nav', 'footer'],
                onlyMainContent: true,
                timeout: 30000
            };

            const scrapeOptions = { ...defaultOptions, ...options };
            const result = await this.firecrawl.scrapeUrl(url, scrapeOptions);

            if (result.success) {
                logger.info(`Successfully extracted content from ${url}`);
                return {
                    success: true,
                    data: {
                        url: result.data.metadata.sourceURL,
                        title: result.data.metadata.title,
                        description: result.data.metadata.description,
                        markdown: result.data.markdown,
                        html: result.data.html,
                        metadata: result.data.metadata,
                        links: result.data.links || [],
                        extractedAt: new Date().toISOString()
                    }
                };
            } else {
                throw new Error(`Firecrawl extraction failed: ${result.error}`);
            }
        } catch (error) {
            logger.error(`Content extraction failed for ${url}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Crawl multiple URLs using Firecrawl
   * @param {string} baseUrl - Base URL to start crawling
   * @param {Object} options - Crawling options
   * @returns {Promise<Object>} Crawled content
   */
    async crawlWebsite(baseUrl, options = {}) {
        try {
            logger.info(`Starting website crawl from: ${baseUrl}`);

            if (!this.firecrawl) {
                return {
                    success: false,
                    error:
            'Firecrawl not configured - please set FIRECRAWL_API_KEY environment variable'
                };
            }

            const defaultOptions = {
                limit: 100,
                scrapeOptions: {
                    formats: ['markdown'],
                    onlyMainContent: true
                },
                excludePaths: ['/admin', '/login', '/api'],
                includePaths: [],
                maxDepth: 3,
                allowBackwardLinks: false,
                allowExternalLinks: false
            };

            const crawlOptions = { ...defaultOptions, ...options };
            const crawlResult = await this.firecrawl.crawlUrl(baseUrl, crawlOptions);

            if (crawlResult.success) {
                logger.info(
                    `Successfully crawled ${crawlResult.data.length} pages from ${baseUrl}`
                );
                return {
                    success: true,
                    data: {
                        baseUrl,
                        totalPages: crawlResult.data.length,
                        pages: crawlResult.data.map((page) => ({
                            url: page.metadata.sourceURL,
                            title: page.metadata.title,
                            content: page.markdown,
                            metadata: page.metadata
                        })),
                        crawledAt: new Date().toISOString()
                    }
                };
            } else {
                throw new Error(`Website crawl failed: ${crawlResult.error}`);
            }
        } catch (error) {
            logger.error(`Website crawl failed for ${baseUrl}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Get or create a browser instance
   * @param {string} browserType - 'chromium', 'firefox', or 'webkit'
   * @returns {Promise<Browser>} Browser instance
   */
    async getBrowser(browserType = 'chromium') {
        if (!this.browserInstances.has(browserType)) {
            logger.info(`Launching ${browserType} browser`);

            let browser;
            switch (browserType) {
            case 'firefox':
                browser = await firefox.launch(this.defaultBrowserOptions);
                break;
            case 'webkit':
                browser = await webkit.launch(this.defaultBrowserOptions);
                break;
            default:
                browser = await chromium.launch(this.defaultBrowserOptions);
            }

            this.browserInstances.set(browserType, browser);

            // Handle browser disconnection
            browser.on('disconnected', () => {
                logger.warn(`${browserType} browser disconnected`);
                this.browserInstances.delete(browserType);
            });
        }

        return this.browserInstances.get(browserType);
    }

    /**
   * Take a screenshot of a webpage
   * @param {string} url - Target URL
   * @param {Object} options - Screenshot options
   * @returns {Promise<Object>} Screenshot result
   */
    async takeScreenshot(url, options = {}) {
        try {
            logger.info(`Taking screenshot of: ${url}`);

            const browser = await this.getBrowser(options.browserType);
            const context = await browser.newContext({
                viewport: options.viewport || { width: 1920, height: 1080 },
                userAgent:
          options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });

            const page = await context.newPage();

            // Set up page options
            if (options.timeout) {
                page.setDefaultTimeout(options.timeout);
            }

            await page.goto(url, { waitUntil: 'networkidle' });

            // Wait for specific element if provided
            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector);
            }

            const screenshotOptions = {
                type: options.format || 'png',
                fullPage: options.fullPage || false
            };

            // Quality is only supported for JPEG
            if (screenshotOptions.type === 'jpeg') {
                screenshotOptions.quality = options.quality || 80;
            }

            const screenshot = await page.screenshot(screenshotOptions);
            await context.close();

            logger.info(`Screenshot taken successfully for ${url}`);
            return {
                success: true,
                data: {
                    url,
                    screenshot: screenshot.toString('base64'),
                    format: screenshotOptions.type,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error(`Screenshot failed for ${url}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Extract structured data from a webpage using Playwright
   * @param {string} url - Target URL
   * @param {Object} selectors - CSS selectors for data extraction
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extracted data
   */
    async extractStructuredData(url, selectors = {}, options = {}) {
        try {
            logger.info(`Extracting structured data from: ${url}`);

            const browser = await this.getBrowser(options.browserType);
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(url, { waitUntil: 'networkidle' });

            const extractedData = {};

            // Extract data based on provided selectors
            for (const [key, selector] of Object.entries(selectors)) {
                try {
                    if (typeof selector === 'string') {
                        // Simple text extraction
                        const element = await page.$(selector);
                        if (element) {
                            extractedData[key] = await element.textContent();
                        }
                    } else if (typeof selector === 'object') {
                        // Advanced extraction with options
                        const elements = await page.$$(selector.selector);
                        if (selector.multiple) {
                            extractedData[key] = await Promise.all(
                                elements.map((el) =>
                                    selector.attribute
                                        ? el.getAttribute(selector.attribute)
                                        : el.textContent()
                                )
                            );
                        } else if (elements.length > 0) {
                            extractedData[key] = selector.attribute
                                ? await elements[0].getAttribute(selector.attribute)
                                : await elements[0].textContent();
                        }
                    }
                } catch (selectorError) {
                    logger.warn(
                        `Failed to extract data for selector '${key}':`,
                        selectorError
                    );
                    extractedData[key] = null;
                }
            }

            await context.close();

            logger.info(`Structured data extraction completed for ${url}`);
            return {
                success: true,
                data: {
                    url,
                    extractedData,
                    extractedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error(`Structured data extraction failed for ${url}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Automate form submission on a webpage
   * @param {string} url - Target URL
   * @param {Object} formData - Form field data
   * @param {Object} options - Automation options
   * @returns {Promise<Object>} Automation result
   */
    async automateForm(url, formData = {}, options = {}) {
        try {
            logger.info(`Automating form submission on: ${url}`);

            const browser = await this.getBrowser(options.browserType);
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(url, { waitUntil: 'networkidle' });

            // Fill form fields
            for (const [selector, value] of Object.entries(formData)) {
                try {
                    await page.fill(selector, String(value));
                    logger.info(`Filled field ${selector} with value`);
                } catch (fillError) {
                    logger.warn(`Failed to fill field ${selector}:`, fillError);
                }
            }

            // Take screenshot before submission if requested
            let beforeScreenshot = null;
            if (options.takeScreenshots) {
                beforeScreenshot = await page.screenshot({ type: 'png' });
            }

            // Submit form
            const submitResult = { success: false };
            if (options.submitSelector) {
                await page.click(options.submitSelector);
                await page.waitForTimeout(options.waitAfterSubmit || 3000);
                submitResult.success = true;
            } else if (options.submitButton) {
                await page.click(options.submitButton);
                await page.waitForTimeout(options.waitAfterSubmit || 3000);
                submitResult.success = true;
            }

            // Take screenshot after submission if requested
            let afterScreenshot = null;
            if (options.takeScreenshots) {
                afterScreenshot = await page.screenshot({ type: 'png' });
            }

            // Extract success/error messages if selectors provided
            const messages = {};
            if (options.messageSelectors) {
                for (const [type, selector] of Object.entries(
                    options.messageSelectors
                )) {
                    try {
                        const element = await page.$(selector);
                        if (element) {
                            messages[type] = await element.textContent();
                        }
                    } catch (msgError) {
                        logger.warn(`Failed to extract ${type} message:`, msgError);
                    }
                }
            }

            await context.close();

            logger.info(`Form automation completed for ${url}`);
            return {
                success: true,
                data: {
                    url,
                    formSubmitted: submitResult.success,
                    messages,
                    screenshots: {
                        before: beforeScreenshot
                            ? beforeScreenshot.toString('base64')
                            : null,
                        after: afterScreenshot ? afterScreenshot.toString('base64') : null
                    },
                    automatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error(`Form automation failed for ${url}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Monitor a webpage for changes
   * @param {string} url - Target URL
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Monitoring result
   */
    async monitorPageChanges(url, options = {}) {
        try {
            logger.info(`Starting page monitoring for: ${url}`);

            const browser = await this.getBrowser(options.browserType);
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(url, { waitUntil: 'networkidle' });

            // Take initial screenshot and content snapshot
            const initialScreenshot = await page.screenshot({ type: 'png' });
            const initialContent = await page.content();
            const initialHash = require('crypto')
                .createHash('md5')
                .update(initialContent)
                .digest('hex');

            const monitoringData = {
                url,
                initialHash,
                changes: [],
                screenshots: [initialScreenshot.toString('base64')],
                startTime: new Date().toISOString()
            };

            // Monitor for specified duration
            const monitorDuration = options.duration || 60000; // Default 1 minute
            const checkInterval = options.interval || 5000; // Default 5 seconds
            const endTime = Date.now() + monitorDuration;

            while (Date.now() < endTime) {
                await new Promise((resolve) => setTimeout(resolve, checkInterval));

                try {
                    await page.reload({ waitUntil: 'networkidle' });
                    const currentContent = await page.content();
                    const currentHash = require('crypto')
                        .createHash('md5')
                        .update(currentContent)
                        .digest('hex');

                    if (
                        currentHash !== monitoringData.initialHash &&
            !monitoringData.changes.some(
                (change) => change.hash === currentHash
            )
                    ) {
                        const screenshot = await page.screenshot({ type: 'png' });
                        monitoringData.changes.push({
                            timestamp: new Date().toISOString(),
                            hash: currentHash,
                            screenshot: screenshot.toString('base64')
                        });

                        logger.info(
                            `Page change detected on ${url} at ${new Date().toISOString()}`
                        );
                    }
                } catch (monitorError) {
                    logger.warn(`Monitoring check failed for ${url}:`, monitorError);
                }
            }

            await context.close();

            logger.info(
                `Page monitoring completed for ${url}. Detected ${monitoringData.changes.length} changes`
            );
            return {
                success: true,
                data: {
                    ...monitoringData,
                    endTime: new Date().toISOString(),
                    totalChanges: monitoringData.changes.length
                }
            };
        } catch (error) {
            logger.error(`Page monitoring failed for ${url}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Clean up browser instances
   */
    async cleanup() {
        logger.info('Cleaning up browser instances');

        for (const [browserType, browser] of this.browserInstances) {
            try {
                await browser.close();
                logger.info(`${browserType} browser closed`);
            } catch (error) {
                logger.error(`Failed to close ${browserType} browser:`, error);
            }
        }

        this.browserInstances.clear();
    }

    /**
   * Health check for the web scraping service
   * @returns {Promise<Object>} Health status
   */
    async healthCheck() {
        try {
            const status = {
                firecrawl: false,
                playwright: false,
                browsers: {
                    chromium: false,
                    firefox: false,
                    webkit: false
                }
            };

            // Check Firecrawl availability
            try {
                // Simple test to check if Firecrawl is configured
                status.firecrawl = !!this.firecrawl;
                if (status.firecrawl) {
                    logger.info('Firecrawl is configured and ready');
                } else {
                    logger.info('Firecrawl not configured (API key missing)');
                }
            } catch (error) {
                logger.warn('Firecrawl health check failed:', error);
                status.firecrawl = false;
            }

            // Check Playwright browsers
            try {
                const testBrowser = await chromium.launch({ headless: true });
                await testBrowser.close();
                status.playwright = true;
                status.browsers.chromium = true;
            } catch (error) {
                logger.warn('Playwright Chromium health check failed:', error);
            }

            try {
                const testBrowser = await firefox.launch({ headless: true });
                await testBrowser.close();
                status.browsers.firefox = true;
            } catch (error) {
                logger.warn('Playwright Firefox health check failed:', error);
            }

            try {
                const testBrowser = await webkit.launch({ headless: true });
                await testBrowser.close();
                status.browsers.webkit = true;
            } catch (error) {
                logger.warn('Playwright WebKit health check failed:', error);
            }

            return {
                success: true,
                status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Web scraping service health check failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = WebScrapingService;
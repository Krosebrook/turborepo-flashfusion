/**
 * FlashFusion Web Scraping API Routes
 * RESTful endpoints for Firecrawl and Playwright functionality
 */

const express = require('express');
const router = express.Router();
const WebScrapingService = require('../services/webScrapingService');
const { body, validationResult } = require('express-validator');
const logger = require('../../utils/logger');

// Initialize web scraping service
const webScrapingService = new WebScrapingService();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * @swagger
 * /api/web-scraping/health:
 *   get:
 *     summary: Check web scraping service health
 *     tags: [Web Scraping]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await webScrapingService.healthCheck();
        res.json(healthStatus);
    } catch (error) {
        logger.error('Web scraping health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});

/**
 * @swagger
 * /api/web-scraping/extract:
 *   post:
 *     summary: Extract content from a URL using Firecrawl
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully extracted content
 */
router.post(
    '/extract',
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('options').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url, options = {} } = req.body;
            const result = await webScrapingService.extractContent(url, options);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Content extraction error:', error);
            res.status(500).json({
                success: false,
                error: 'Content extraction failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/crawl:
 *   post:
 *     summary: Crawl a website using Firecrawl
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - baseUrl
 *             properties:
 *               baseUrl:
 *                 type: string
 *                 format: uri
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully crawled website
 */
router.post(
    '/crawl',
    [
        body('baseUrl').isURL().withMessage('Valid base URL is required'),
        body('options').optional().isObject(),
        body('options.limit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Limit must be between 1 and 1000')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { baseUrl, options = {} } = req.body;
            const result = await webScrapingService.crawlWebsite(baseUrl, options);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Website crawl error:', error);
            res.status(500).json({
                success: false,
                error: 'Website crawl failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/screenshot:
 *   post:
 *     summary: Take a screenshot of a webpage
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully captured screenshot
 */
router.post(
    '/screenshot',
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('options').optional().isObject(),
        body('options.browserType')
            .optional()
            .isIn(['chromium', 'firefox', 'webkit']),
        body('options.format').optional().isIn(['png', 'jpeg'])
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url, options = {} } = req.body;
            const result = await webScrapingService.takeScreenshot(url, options);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Screenshot error:', error);
            res.status(500).json({
                success: false,
                error: 'Screenshot failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/extract-data:
 *   post:
 *     summary: Extract structured data from a webpage
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - selectors
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               selectors:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully extracted structured data
 */
router.post(
    '/extract-data',
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('selectors').isObject().withMessage('Selectors object is required'),
        body('options').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url, selectors, options = {} } = req.body;
            const result = await webScrapingService.extractStructuredData(
                url,
                selectors,
                options
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Structured data extraction error:', error);
            res.status(500).json({
                success: false,
                error: 'Structured data extraction failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/automate-form:
 *   post:
 *     summary: Automate form submission on a webpage
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - formData
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               formData:
 *                 type: object
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully automated form
 */
router.post(
    '/automate-form',
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('formData').isObject().withMessage('Form data object is required'),
        body('options').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url, formData, options = {} } = req.body;
            const result = await webScrapingService.automateForm(
                url,
                formData,
                options
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Form automation error:', error);
            res.status(500).json({
                success: false,
                error: 'Form automation failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/monitor:
 *   post:
 *     summary: Monitor a webpage for changes
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully monitored page
 */
router.post(
    '/monitor',
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('options').optional().isObject(),
        body('options.duration')
            .optional()
            .isInt({ min: 1000, max: 600000 })
            .withMessage('Duration must be between 1s and 10min'),
        body('options.interval')
            .optional()
            .isInt({ min: 1000, max: 60000 })
            .withMessage('Interval must be between 1s and 1min')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url, options = {} } = req.body;
            const result = await webScrapingService.monitorPageChanges(url, options);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error('Page monitoring error:', error);
            res.status(500).json({
                success: false,
                error: 'Page monitoring failed'
            });
        }
    }
);

/**
 * @swagger
 * /api/web-scraping/batch-extract:
 *   post:
 *     summary: Extract content from multiple URLs
 *     tags: [Web Scraping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Successfully extracted content from multiple URLs
 */
router.post(
    '/batch-extract',
    [
        body('urls')
            .isArray({ min: 1, max: 50 })
            .withMessage('URLs array is required (max 50)'),
        body('urls.*').isURL().withMessage('All URLs must be valid'),
        body('options').optional().isObject()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { urls, options = {} } = req.body;
            const results = [];

            // Process URLs concurrently with a limit
            const concurrencyLimit = options.concurrency || 5;
            const chunks = [];

            for (let i = 0; i < urls.length; i += concurrencyLimit) {
                chunks.push(urls.slice(i, i + concurrencyLimit));
            }

            for (const chunk of chunks) {
                const chunkResults = await Promise.all(
                    chunk.map((url) => webScrapingService.extractContent(url, options))
                );
                results.push(...chunkResults);
            }

            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            res.json({
                success: true,
                data: {
                    total: urls.length,
                    successful: successful.length,
                    failed: failed.length,
                    results: results,
                    processedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Batch extraction error:', error);
            res.status(500).json({
                success: false,
                error: 'Batch extraction failed'
            });
        }
    }
);

// Cleanup middleware - close browsers on server shutdown
process.on('SIGTERM', async () => {
    logger.info('Shutting down web scraping service...');
    await webScrapingService.cleanup();
});

process.on('SIGINT', async () => {
    logger.info('Shutting down web scraping service...');
    await webScrapingService.cleanup();
});

module.exports = router;
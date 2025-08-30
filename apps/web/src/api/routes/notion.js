/**
 * FlashFusion Notion API Routes
 * RESTful endpoints for Notion integration
 */

const express = require('express');
const router = express.Router();
const notionService = require('../../services/notionService');
const logger = require('../../utils/logger');

/**
 * GET /api/notion/status
 * Get Notion service connection status
 */
router.get('/status', async (req, res) => {
    try {
        const status = notionService.getConnectionStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Error getting Notion status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notion/test-connection
 * Test connection to Notion API
 */
router.post('/test-connection', async (req, res) => {
    try {
        const result = await notionService.testConnection();
        res.json(result);
    } catch (error) {
        logger.error('Error testing Notion connection:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notion/databases
 * Get all accessible databases
 */
router.get('/databases', async (req, res) => {
    try {
        const result = await notionService.getDatabases();
        res.json(result);
    } catch (error) {
        logger.error('Error getting Notion databases:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notion/databases/:id/pages
 * Get pages from a specific database
 */
router.get('/databases/:id/pages', async (req, res) => {
    try {
        const databaseId = req.params.id;
        const filters = {};

        // Parse query parameters for filtering
        if (req.query.filter) {
            try {
                filters.filter = JSON.parse(req.query.filter);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filter JSON'
                });
            }
        }

        if (req.query.sorts) {
            try {
                filters.sorts = JSON.parse(req.query.sorts);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid sorts JSON'
                });
            }
        }

        const result = await notionService.getDatabasePages(databaseId, filters);
        res.json(result);
    } catch (error) {
        logger.error('Error getting database pages:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notion/databases/:id/pages
 * Create a new page in a database
 */
router.post('/databases/:id/pages', async (req, res) => {
    try {
        const databaseId = req.params.id;
        const { properties, content = [] } = req.body;

        if (!properties) {
            return res.status(400).json({
                success: false,
                error: 'Page properties are required'
            });
        }

        const result = await notionService.createPage(
            databaseId,
            properties,
            content
        );
        res.json(result);
    } catch (error) {
        logger.error('Error creating Notion page:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/notion/pages/:id
 * Update an existing page
 */
router.patch('/pages/:id', async (req, res) => {
    try {
        const pageId = req.params.id;
        const { properties } = req.body;

        if (!properties) {
            return res.status(400).json({
                success: false,
                error: 'Page properties are required'
            });
        }

        const result = await notionService.updatePage(pageId, properties);
        res.json(result);
    } catch (error) {
        logger.error('Error updating Notion page:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notion/pages/:id/content
 * Get page content with blocks
 */
router.get('/pages/:id/content', async (req, res) => {
    try {
        const pageId = req.params.id;
        const result = await notionService.getPageContent(pageId);
        res.json(result);
    } catch (error) {
        logger.error('Error getting page content:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notion/search
 * Search across all accessible content
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const filters = {};

        if (req.query.filter) {
            try {
                filters.filter = JSON.parse(req.query.filter);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filter JSON'
                });
            }
        }

        if (req.query.sort) {
            try {
                filters.sort = JSON.parse(req.query.sort);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid sort JSON'
                });
            }
        }

        const result = await notionService.search(query, filters);
        res.json(result);
    } catch (error) {
        logger.error('Error searching Notion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notion/workflow-integration
 * Create workflow integration with Notion
 */
router.post('/workflow-integration', async (req, res) => {
    try {
        const { workflowId, notionConfig } = req.body;

        if (!workflowId || !notionConfig) {
            return res.status(400).json({
                success: false,
                error: 'Workflow ID and Notion configuration are required'
            });
        }

        const result = await notionService.createWorkflowIntegration(
            workflowId,
            notionConfig
        );
        res.json(result);
    } catch (error) {
        logger.error('Error creating workflow integration:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notion/health
 * Get service health status
 */
router.get('/health', async (req, res) => {
    try {
        const health = notionService.getHealth();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Error getting Notion health:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notion/agent-integration
 * Create agent-specific Notion actions
 */
router.post('/agent-integration', async (req, res) => {
    try {
        const { agentId, action, parameters } = req.body;

        if (!agentId || !action) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID and action are required'
            });
        }

        let result;

        switch (action) {
        case 'create_task_page': {
            if (!parameters.databaseId || !parameters.taskData) {
                return res.status(400).json({
                    success: false,
                    error: 'Database ID and task data are required'
                });
            }

            const taskProperties = {
                Title: {
                    title: [{ text: { content: parameters.taskData.title } }]
                },
                Status: {
                    select: { name: parameters.taskData.status || 'To Do' }
                },
                'Created By Agent': {
                    rich_text: [{ text: { content: agentId } }]
                }
            };

            if (parameters.taskData.description) {
                taskProperties.Description = {
                    rich_text: [{ text: { content: parameters.taskData.description } }]
                };
            }

            result = await notionService.createPage(
                parameters.databaseId,
                taskProperties
            );
            break;
        }

        case 'search_pages':
            result = await notionService.search(
                parameters.query || '',
                parameters.filters || {}
            );
            break;

        case 'update_task_status': {
            if (!parameters.pageId || !parameters.status) {
                return res.status(400).json({
                    success: false,
                    error: 'Page ID and status are required'
                });
            }

            const updateProperties = {
                Status: {
                    select: { name: parameters.status }
                },
                'Updated By Agent': {
                    rich_text: [{ text: { content: agentId } }]
                }
            };

            result = await notionService.updatePage(
                parameters.pageId,
                updateProperties
            );
            break;
        }

        default:
            return res.status(400).json({
                success: false,
                error: `Unknown action: ${action}`
            });
        }

        res.json({
            success: true,
            data: {
                agentId,
                action,
                result: result.data
            }
        });
    } catch (error) {
        logger.error('Error with agent Notion integration:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
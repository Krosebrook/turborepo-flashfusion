/**
 * FlashFusion Zapier API Routes
 * RESTful endpoints and webhook handlers for Zapier integration
 */

const express = require('express');
const router = express.Router();
const zapierService = require('../../services/zapierService');
const logger = console;

/**
 * GET /api/zapier/status
 * Get Zapier service connection status
 */
router.get('/status', async (req, res) => {
    try {
        const status = zapierService.getConnectionStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Error getting Zapier status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zapier/health
 * Get service health status
 */
router.get('/health', async (req, res) => {
    try {
        const health = zapierService.getHealth();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Error getting Zapier health:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/webhooks/register
 * Register a new webhook endpoint
 */
router.post('/webhooks/register', async (req, res) => {
    try {
        const { eventType, webhookUrl, config } = req.body;

        if (!eventType || !webhookUrl) {
            return res.status(400).json({
                success: false,
                error: 'Event type and webhook URL are required'
            });
        }

        const webhook = zapierService.registerWebhook(
            eventType,
            webhookUrl,
            config
        );

        res.json({
            success: true,
            data: webhook
        });
    } catch (error) {
        logger.error('Error registering webhook:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/webhooks/trigger
 * Trigger a webhook manually
 */
router.post('/webhooks/trigger', async (req, res) => {
    try {
        const { eventType, data, options } = req.body;

        if (!eventType) {
            return res.status(400).json({
                success: false,
                error: 'Event type is required'
            });
        }

        const result = await zapierService.triggerWebhook(
            eventType,
            data || {},
            options || {}
        );
        res.json(result);
    } catch (error) {
        logger.error('Error triggering webhook:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zapier/webhooks/stats
 * Get webhook statistics
 */
router.get('/webhooks/stats', async (req, res) => {
    try {
        const stats = zapierService.getWebhookStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting webhook stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/workflows/automation
 * Create workflow automation setup
 */
router.post('/workflows/automation', async (req, res) => {
    try {
        const { workflowId, zapierConfig } = req.body;

        if (!workflowId || !zapierConfig) {
            return res.status(400).json({
                success: false,
                error: 'Workflow ID and Zapier configuration are required'
            });
        }

        const result = await zapierService.createWorkflowAutomation(
            workflowId,
            zapierConfig
        );
        res.json(result);
    } catch (error) {
        logger.error('Error creating workflow automation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/webhooks/chain
 * Chain multiple webhooks
 */
router.post('/webhooks/chain', async (req, res) => {
    try {
        const { eventType, data, webhookUrls } = req.body;

        if (!eventType || !Array.isArray(webhookUrls) || webhookUrls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Event type and webhook URLs array are required'
            });
        }

        const result = await zapierService.chainWebhooks(
            eventType,
            data || {},
            webhookUrls
        );
        res.json(result);
    } catch (error) {
        logger.error('Error chaining webhooks:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zapier/suggestions
 * Get automation suggestions
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { category } = req.query;
        const suggestions = zapierService.getAutomationSuggestions(category);

        res.json({
            success: true,
            data: {
                suggestions,
                total: suggestions.length,
                category: category || 'all'
            }
        });
    } catch (error) {
        logger.error('Error getting automation suggestions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/incoming-webhook
 * Handle incoming webhooks from Zapier
 */
router.post('/incoming-webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        const headers = req.headers;

        const result = await zapierService.processIncomingWebhook(
            webhookData,
            headers
        );

        // Always return 200 to Zapier to prevent retries
        res.status(200).json({
            success: true,
            message: 'Webhook received and processed',
            data: result
        });
    } catch (error) {
        logger.error('Error processing incoming webhook:', error);
        // Still return 200 to Zapier
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
            error: error.message
        });
    }
});

/**
 * GET /api/zapier/incoming-webhook
 * Handle GET requests for webhook testing
 */
router.get('/incoming-webhook', async (req, res) => {
    res.json({
        success: true,
        message: 'FlashFusion Zapier webhook endpoint is active',
        timestamp: new Date().toISOString(),
        service: 'FlashFusion-AI',
        methods: ['GET', 'POST', 'PUT'],
        documentation: 'https://flashfusion.co/docs/zapier'
    });
});

/**
 * PUT /api/zapier/incoming-webhook
 * Handle PUT requests from Zapier
 */
router.put('/incoming-webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        const headers = req.headers;

        const result = await zapierService.processIncomingWebhook(
            webhookData,
            headers
        );

        res.status(200).json({
            success: true,
            message: 'Webhook received and processed via PUT',
            data: result
        });
    } catch (error) {
        logger.error('Error processing PUT webhook:', error);
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/test-automation
 * Test automation flow with sample data
 */
router.post('/test-automation', async (req, res) => {
    try {
        const { automationType, testData } = req.body;

        const testResults = {};

        switch (automationType) {
        case 'workflow_completed':
            testResults.workflow = await zapierService.triggerWebhook(
                'workflow_completed',
                {
                    workflowId: 'test-workflow-001',
                    workflowType: 'development',
                    status: 'completed',
                    duration: 1200,
                    ...testData
                }
            );
            break;

        case 'lead_generated':
            testResults.lead = await zapierService.triggerWebhook(
                'lead_generated',
                {
                    leadId: 'lead-001',
                    email: 'test@example.com',
                    source: 'website',
                    score: 85,
                    ...testData
                }
            );
            break;

        case 'agent_action':
            testResults.agent = await zapierService.triggerWebhook(
                'agent_action_completed',
                {
                    agentId: 'universal-creator',
                    action: 'content_generated',
                    result: 'Blog post created successfully',
                    ...testData
                }
            );
            break;

        default:
            return res.status(400).json({
                success: false,
                error: 'Unknown automation type'
            });
        }

        res.json({
            success: true,
            data: {
                automationType,
                testResults,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error testing automation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zapier/webhook-template/:eventType
 * Get webhook payload template for specific event type
 */
router.get('/webhook-template/:eventType', async (req, res) => {
    try {
        const { eventType } = req.params;

        const templates = {
            workflow_completed: {
                event: 'workflow_completed',
                timestamp: '2025-01-24T12:00:00.000Z',
                data: {
                    workflowId: 'wf_12345',
                    workflowType: 'development',
                    status: 'completed',
                    duration: 1200,
                    results: {
                        tasksCompleted: 8,
                        errors: 0,
                        output: 'Workflow completed successfully'
                    }
                },
                source: 'FlashFusion-AI'
            },
            lead_generated: {
                event: 'lead_generated',
                timestamp: '2025-01-24T12:00:00.000Z',
                data: {
                    leadId: 'lead_12345',
                    email: 'prospect@company.com',
                    name: 'John Doe',
                    company: 'Tech Corp',
                    source: 'website',
                    score: 85,
                    interests: ['automation', 'ai']
                },
                source: 'FlashFusion-AI'
            },
            agent_action_completed: {
                event: 'agent_action_completed',
                timestamp: '2025-01-24T12:00:00.000Z',
                data: {
                    agentId: 'universal-creator',
                    agentName: 'Universal Creator',
                    action: 'content_generated',
                    result: 'Blog post created successfully',
                    metadata: {
                        contentType: 'blog_post',
                        wordCount: 1200,
                        topics: ['AI', 'automation']
                    }
                },
                source: 'FlashFusion-AI'
            }
        };

        const template = templates[eventType];
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found for event type',
                availableTypes: Object.keys(templates)
            });
        }

        res.json({
            success: true,
            data: {
                eventType,
                template,
                description: `Sample webhook payload for ${eventType} events`,
                zapierSetup: `Use this template when setting up your Zapier webhook for ${eventType} events`
            }
        });
    } catch (error) {
        logger.error('Error getting webhook template:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zapier/bulk-trigger
 * Trigger multiple webhooks for batch processing
 */
router.post('/bulk-trigger', async (req, res) => {
    try {
        const { triggers } = req.body;

        if (!Array.isArray(triggers) || triggers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Triggers array is required'
            });
        }

        const results = [];

        for (const trigger of triggers) {
            const { eventType, data, options } = trigger;
            if (eventType) {
                const result = await zapierService.triggerWebhook(
                    eventType,
                    data || {},
                    options || {}
                );
                results.push({
                    eventType,
                    ...result
                });
            }
        }

        res.json({
            success: true,
            data: {
                totalTriggers: triggers.length,
                processedTriggers: results.length,
                results
            }
        });
    } catch (error) {
        logger.error('Error with bulk trigger:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
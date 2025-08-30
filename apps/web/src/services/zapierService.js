/**
 * FlashFusion Zapier Integration Service
 * Provides comprehensive webhook and automation integration with Zapier
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = console;

class ZapierService {
    constructor() {
        this.webhookEndpoints = new Map();
        this.automationSuggestions = [];
        this.isInitialized = false;
        this.connectionStatus = {
            connected: false,
            lastTriggered: null,
            totalTriggers: 0,
            error: null
        };
    }

    /**
   * Initialize Zapier service
   */
    async initialize() {
        try {
            this.isInitialized = true;
            this.connectionStatus = {
                connected: true,
                lastTriggered: null,
                totalTriggers: 0,
                error: null
            };

            // Initialize default automation suggestions
            this.initializeAutomationSuggestions();

            logger.info('Zapier service initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Zapier service:', error);
            this.connectionStatus = {
                connected: false,
                lastTriggered: null,
                totalTriggers: 0,
                error: error.message
            };
            return false;
        }
    }

    /**
   * Register a webhook endpoint for Zapier triggers
   */
    registerWebhook(eventType, webhookUrl, config = {}) {
        if (!this.isInitialized) {
            throw new Error('Zapier service not initialized');
        }

        const webhook = {
            id: crypto.randomUUID(),
            eventType,
            url: webhookUrl,
            active: true,
            createdAt: new Date().toISOString(),
            config: {
                method: config.method || 'POST',
                headers: config.headers || { 'Content-Type': 'application/json' },
                authentication: config.authentication || null,
                retryCount: config.retryCount || 3,
                timeout: config.timeout || 30000
            }
        };

        this.webhookEndpoints.set(eventType, webhook);
        logger.info(`Zapier webhook registered for event: ${eventType}`);

        return webhook;
    }

    /**
   * Trigger a Zapier webhook with data
   */
    async triggerWebhook(eventType, data, options = {}) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        const webhook = this.webhookEndpoints.get(eventType);
        if (!webhook || !webhook.active) {
            return {
                success: false,
                error: `No active webhook found for event: ${eventType}`
            };
        }

        try {
            const payload = {
                event: eventType,
                timestamp: new Date().toISOString(),
                data: data,
                source: 'FlashFusion-AI',
                ...options
            };

            const response = await axios({
                method: webhook.config.method,
                url: webhook.url,
                data: payload,
                headers: webhook.config.headers,
                timeout: webhook.config.timeout
            });

            this.connectionStatus.lastTriggered = new Date().toISOString();
            this.connectionStatus.totalTriggers++;

            logger.info(`Zapier webhook triggered successfully for ${eventType}`);

            return {
                success: true,
                data: {
                    webhookId: webhook.id,
                    eventType,
                    response: response.status,
                    triggeredAt: payload.timestamp
                }
            };
        } catch (error) {
            logger.error(`Failed to trigger Zapier webhook for ${eventType}:`, error);
            return {
                success: false,
                error: error.message,
                webhookId: webhook.id
            };
        }
    }

    /**
   * Create automation workflows for common FlashFusion events
   */
    async createWorkflowAutomation(workflowId, zapierConfig) {
        const automations = [];

        // Workflow Started Automation
        if (zapierConfig.triggerOnStart) {
            automations.push({
                event: 'workflow_started',
                webhook: zapierConfig.startWebhook,
                description: 'Trigger when workflow begins execution'
            });
        }

        // Workflow Completed Automation
        if (zapierConfig.triggerOnComplete) {
            automations.push({
                event: 'workflow_completed',
                webhook: zapierConfig.completeWebhook,
                description: 'Trigger when workflow finishes successfully'
            });
        }

        // Agent Action Automation
        if (zapierConfig.triggerOnAgentAction) {
            automations.push({
                event: 'agent_action_completed',
                webhook: zapierConfig.agentWebhook,
                description: 'Trigger when AI agent completes an action'
            });
        }

        // Error Handling Automation
        if (zapierConfig.triggerOnError) {
            automations.push({
                event: 'workflow_error',
                webhook: zapierConfig.errorWebhook,
                description: 'Trigger when workflow encounters an error'
            });
        }

        return {
            success: true,
            data: {
                workflowId,
                automations,
                created: new Date().toISOString()
            }
        };
    }

    /**
   * Send data to multiple Zapier endpoints (webhook chaining)
   */
    async chainWebhooks(eventType, data, webhookUrls) {
        const results = [];

        for (const url of webhookUrls) {
            try {
                const result = await this.triggerWebhook(eventType, data, {
                    webhookUrl: url
                });
                results.push({ url, ...result });
            } catch (error) {
                results.push({ url, success: false, error: error.message });
            }
        }

        return {
            success: true,
            data: {
                eventType,
                totalWebhooks: webhookUrls.length,
                results
            }
        };
    }

    /**
   * Process incoming webhook from Zapier
   */
    async processIncomingWebhook(webhookData, headers = {}) {
        try {
            const processedData = {
                id: crypto.randomUUID(),
                receivedAt: new Date().toISOString(),
                source: 'zapier',
                data: webhookData,
                headers: headers
            };

            // Process based on webhook type
            if (webhookData.event) {
                switch (webhookData.event) {
                case 'workflow_trigger':
                    return await this.handleWorkflowTrigger(webhookData);
                case 'agent_instruction':
                    return await this.handleAgentInstruction(webhookData);
                case 'data_sync':
                    return await this.handleDataSync(webhookData);
                default:
                    return await this.handleGenericWebhook(webhookData);
                }
            }

            return {
                success: true,
                data: processedData
            };
        } catch (error) {
            logger.error('Error processing incoming webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
   * Handle workflow trigger from Zapier
   */
    async handleWorkflowTrigger(data) {
        return {
            success: true,
            action: 'workflow_triggered',
            workflowId: data.workflowId || 'auto-generated',
            data: data
        };
    }

    /**
   * Handle agent instruction from Zapier
   */
    async handleAgentInstruction(data) {
        return {
            success: true,
            action: 'agent_instructed',
            agentId: data.agentId || 'universal-coordinator',
            instruction: data.instruction,
            data: data
        };
    }

    /**
   * Handle data synchronization from Zapier
   */
    async handleDataSync(data) {
        return {
            success: true,
            action: 'data_synced',
            syncType: data.syncType || 'general',
            records: Array.isArray(data.records) ? data.records.length : 1,
            data: data
        };
    }

    /**
   * Handle generic webhook data
   */
    async handleGenericWebhook(data) {
        return {
            success: true,
            action: 'webhook_processed',
            type: 'generic',
            data: data
        };
    }

    /**
   * Get automation suggestions based on FlashFusion usage
   */
    getAutomationSuggestions(category = 'all') {
        if (category === 'all') {
            return this.automationSuggestions;
        }

        return this.automationSuggestions.filter(
            (suggestion) => suggestion.category === category
        );
    }

    /**
   * Initialize default automation suggestions
   */
    initializeAutomationSuggestions() {
        this.automationSuggestions = [
            // Business Automation
            {
                id: 'lead-to-crm',
                title: 'New Lead → CRM Integration',
                description:
          'Automatically add new leads from FlashFusion to your CRM (Salesforce, HubSpot, Pipedrive)',
                category: 'business',
                triggers: ['lead_generated', 'contact_form_submitted'],
                actions: [
                    'Create CRM contact',
                    'Send welcome email',
                    'Assign to sales rep'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/salesforce',
                difficulty: 'Easy',
                timeToSetup: '5 minutes'
            },
            {
                id: 'project-management',
                title: 'Workflow Complete → Project Updates',
                description:
          'Update project management tools when FlashFusion workflows complete',
                category: 'business',
                triggers: ['workflow_completed', 'milestone_reached'],
                actions: [
                    'Update Asana task',
                    'Send Slack notification',
                    'Create Trello card'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/asana',
                difficulty: 'Easy',
                timeToSetup: '3 minutes'
            },

            // E-commerce Automation
            {
                id: 'order-fulfillment',
                title: 'Order Processing → Multi-Platform Sync',
                description:
          'Sync new orders across inventory, accounting, and shipping systems',
                category: 'ecommerce',
                triggers: ['order_created', 'payment_received'],
                actions: [
                    'Update inventory',
                    'Create invoice',
                    'Generate shipping label'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/shopify',
                difficulty: 'Medium',
                timeToSetup: '15 minutes'
            },
            {
                id: 'customer-support',
                title: 'Support Ticket → AI Agent Response',
                description:
          'Route customer support tickets to appropriate AI agents for initial response',
                category: 'ecommerce',
                triggers: ['support_ticket_created', 'customer_complaint'],
                actions: [
                    'Analyze sentiment',
                    'Generate AI response',
                    'Escalate if needed'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/zendesk',
                difficulty: 'Medium',
                timeToSetup: '10 minutes'
            },

            // Content & Marketing
            {
                id: 'content-distribution',
                title: 'Content Created → Multi-Channel Publishing',
                description:
          'Automatically distribute AI-generated content across social media and blogs',
                category: 'marketing',
                triggers: ['content_generated', 'blog_post_created'],
                actions: [
                    'Post to Twitter',
                    'Share on LinkedIn',
                    'Update blog',
                    'Send newsletter'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/twitter',
                difficulty: 'Easy',
                timeToSetup: '8 minutes'
            },
            {
                id: 'lead-nurturing',
                title: 'Lead Score Change → Email Campaigns',
                description:
          'Trigger personalized email sequences based on AI-calculated lead scores',
                category: 'marketing',
                triggers: ['lead_score_updated', 'engagement_detected'],
                actions: [
                    'Send targeted email',
                    'Add to campaign',
                    'Update lead status'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/mailchimp',
                difficulty: 'Medium',
                timeToSetup: '12 minutes'
            },

            // Data & Analytics
            {
                id: 'data-analytics',
                title: 'Performance Metrics → Analytics Dashboard',
                description:
          'Send FlashFusion performance data to analytics and reporting tools',
                category: 'analytics',
                triggers: ['metrics_calculated', 'report_generated'],
                actions: [
                    'Update Google Sheets',
                    'Send to Data Studio',
                    'Create chart'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/google-sheets',
                difficulty: 'Easy',
                timeToSetup: '5 minutes'
            },
            {
                id: 'error-monitoring',
                title: 'System Errors → Alert Management',
                description:
          'Automatically notify teams and create tickets for system errors',
                category: 'analytics',
                triggers: ['error_occurred', 'system_down'],
                actions: ['Send Slack alert', 'Create Jira ticket', 'Email tech team'],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/slack',
                difficulty: 'Easy',
                timeToSetup: '3 minutes'
            },

            // Team Collaboration
            {
                id: 'team-notifications',
                title: 'Agent Actions → Team Updates',
                description:
          'Keep teams informed about AI agent activities and decisions',
                category: 'collaboration',
                triggers: ['agent_decision_made', 'task_completed'],
                actions: [
                    'Send team notification',
                    'Update status board',
                    'Log activity'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/microsoft-teams',
                difficulty: 'Easy',
                timeToSetup: '4 minutes'
            },
            {
                id: 'calendar-management',
                title: 'Meeting Scheduled → Multi-Platform Sync',
                description:
          'Sync FlashFusion meeting scheduling across calendar platforms',
                category: 'collaboration',
                triggers: ['meeting_scheduled', 'appointment_booked'],
                actions: [
                    'Add to Google Calendar',
                    'Send Outlook invite',
                    'Create Zoom meeting'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations/google-calendar',
                difficulty: 'Easy',
                timeToSetup: '6 minutes'
            },

            // Advanced Automations
            {
                id: 'multi-step-workflow',
                title: 'Complex Business Process Automation',
                description:
          'Chain multiple tools together for sophisticated business workflows',
                category: 'advanced',
                triggers: ['custom_event', 'complex_condition_met'],
                actions: [
                    'Multi-step processing',
                    'Conditional logic',
                    'Error handling'
                ],
                zapUrl: 'https://zapier.com/apps/webhook/integrations',
                difficulty: 'Advanced',
                timeToSetup: '30+ minutes'
            }
        ];
    }

    /**
   * Get connection status
   */
    getConnectionStatus() {
        return {
            service: 'zapier',
            ...this.connectionStatus,
            initialized: this.isInitialized,
            registeredWebhooks: this.webhookEndpoints.size
        };
    }

    /**
   * Health check for the service
   */
    getHealth() {
        return {
            service: 'zapier',
            status: this.isInitialized ? 'healthy' : 'unhealthy',
            initialized: this.isInitialized,
            webhooks: this.webhookEndpoints.size,
            totalTriggers: this.connectionStatus.totalTriggers,
            lastTriggered: this.connectionStatus.lastTriggered
        };
    }

    /**
   * Get webhook statistics
   */
    getWebhookStats() {
        const webhooks = Array.from(this.webhookEndpoints.values());

        return {
            total: webhooks.length,
            active: webhooks.filter((w) => w.active).length,
            inactive: webhooks.filter((w) => !w.active).length,
            byEventType: webhooks.reduce((acc, webhook) => {
                acc[webhook.eventType] = (acc[webhook.eventType] || 0) + 1;
                return acc;
            }, {}),
            totalTriggers: this.connectionStatus.totalTriggers,
            lastTriggered: this.connectionStatus.lastTriggered
        };
    }

    /**
   * Cleanup resources
   */
    async cleanup() {
        this.webhookEndpoints.clear();
        this.automationSuggestions = [];
        this.isInitialized = false;
        this.connectionStatus = {
            connected: false,
            lastTriggered: null,
            totalTriggers: 0,
            error: null
        };
        logger.info('Zapier service cleaned up');
    }
}

module.exports = new ZapierService();
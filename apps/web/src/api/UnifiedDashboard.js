/**
 * Unified Dashboard API - Central API for FlashFusion platform
 */

const express = require('express');
const databaseService = require('../services/database');
const aiService = require('../services/aiService');
const logger = console;

class UnifiedDashboard {
    constructor(agentOrchestrator, workflowEngine) {
        this.agentOrchestrator = agentOrchestrator;
        this.workflowEngine = workflowEngine;
        this.router = express.Router();
        this.setupRoutes();
    }

    /**
   * Set up API routes
   */
    setupRoutes() {
    // Health check
        this.router.get('/health', this.getHealth.bind(this));

        // System status
        this.router.get('/status', this.getSystemStatus.bind(this));

        // Agent routes
        this.router.get('/agents', this.getAgents.bind(this));
        this.router.get('/agents/:id', this.getAgent.bind(this));
        this.router.post('/agents/chat', this.chatWithAgent.bind(this));

        // Workflow routes
        this.router.get('/workflows', this.getWorkflows.bind(this));
        this.router.post('/workflows', this.createWorkflow.bind(this));
        this.router.get('/workflows/:id', this.getWorkflow.bind(this));
        this.router.post('/workflows/:id/start', this.startWorkflow.bind(this));

        // Dashboard data
        this.router.get('/dashboard', this.getDashboardData.bind(this));
    }

    /**
   * Health check endpoint
   */
    async getHealth(req, res) {
        try {
            const dbHealth = await databaseService.healthCheck();
            const aiHealth = await aiService.healthCheck();

            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'FlashFusion Unified Dashboard',
                version: '2.0.0',
                uptime: process.uptime(),
                services: {
                    database: dbHealth,
                    ai: aiHealth,
                    agentOrchestrator: this.agentOrchestrator
                        ? this.agentOrchestrator.getHealth()
                        : { status: 'inactive' },
                    workflowEngine: this.workflowEngine
                        ? this.workflowEngine.getHealth()
                        : { status: 'inactive' }
                }
            };

            // Determine overall health
            if (dbHealth.status !== 'healthy' || !aiHealth.initialized) {
                health.status = 'degraded';
            }

            res.json(health);
        } catch (error) {
            logger.error('Health check error:', error);
            res.status(500).json({
                status: 'error',
                error: error.message
            });
        }
    }

    /**
   * Get system status
   */
    async getSystemStatus(req, res) {
        try {
            // Get real agent data from database
            const personalitiesResult = await databaseService.getAgentPersonalities();
            const agentPersonalities = personalitiesResult.success
                ? personalitiesResult.data
                : [];

            // Get workflow data
            const workflowStatus = this.workflowEngine
                ? this.workflowEngine.getAllWorkflows()
                : { data: { workflows: [] } };

            // Get database connection status
            const dbStatus = databaseService.getConnectionStatus();

            res.json({
                success: true,
                data: {
                    agents: {
                        roles: agentPersonalities.map((personality) => ({
                            id: personality.agent_id,
                            name: this.getAgentDisplayName(personality.agent_id),
                            status: 'active',
                            personality_type: personality.personality_type,
                            traits: personality.traits,
                            last_updated: personality.updated_at
                        }))
                    },
                    workflows: workflowStatus.data.workflows || [],
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        platform: process.platform,
                        nodeVersion: process.version,
                        database: dbStatus
                    }
                }
            });
        } catch (error) {
            logger.error('System status error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Get all agents
   */
    async getAgents(req, res) {
        try {
            const result = this.agentOrchestrator.getAgentsStatus();
            res.json(result);
        } catch (error) {
            logger.error('Get agents error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Get specific agent
   */
    async getAgent(req, res) {
        try {
            const { id } = req.params;
            const agentStatus = this.agentOrchestrator.getAgentsStatus();

            const agent = agentStatus.data.agents.roles.find(
                (agent) => agent.id === id
            );

            if (!agent) {
                return res.status(404).json({
                    success: false,
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                data: agent
            });
        } catch (error) {
            logger.error('Get agent error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Chat with agent
   */
    async chatWithAgent(req, res) {
        try {
            const { agentId, message, context = {} } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: 'Message is required'
                });
            }

            // Emit agent message event
            this.agentOrchestrator.emit('agent_message', {
                agentId: agentId || 'coordinator',
                message,
                context,
                timestamp: new Date()
            });

            // Determine target agent
            const targetAgentId = agentId || 'coordinator';

            // Use real AI service to generate response
            const aiResponse = await aiService.generateAgentResponse(
                targetAgentId,
                message,
                {
                    ...context,
                    userId: req.user?.id || context?.userId || 'anonymous',
                    timestamp: new Date().toISOString()
                }
            );

            const response = {
                success: true,
                data: {
                    agentId: targetAgentId,
                    response: aiResponse.response,
                    model: aiResponse.model,
                    responseTime: aiResponse.responseTime,
                    conversationId: aiResponse.conversationId,
                    timestamp: new Date().toISOString(),
                    suggestions: [
                        'Create a new workflow',
                        'Check system status',
                        'Analyze performance metrics',
                        'Optimize existing processes'
                    ]
                }
            };

            res.json(response);
        } catch (error) {
            logger.error('Chat with agent error:', error);

            // Fallback response if AI service fails
            const fallbackResponse = {
                success: false,
                error: error.message,
                fallback: {
                    agentId: req.body.agentId || 'coordinator',
                    response: 'I apologize, but I\'m currently experiencing technical difficulties. ' +
                        `Please try again in a moment. Error: ${error.message}`,
                    timestamp: new Date().toISOString(),
                    model: 'fallback'
                }
            };

            res.status(500).json(fallbackResponse);
        }
    }

    /**
   * Get all workflows
   */
    async getWorkflows(req, res) {
        try {
            const result = this.workflowEngine.getAllWorkflows();
            res.json(result);
        } catch (error) {
            logger.error('Get workflows error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Create new workflow
   */
    async createWorkflow(req, res) {
        try {
            const { type, config } = req.body;

            if (!type) {
                return res.status(400).json({
                    success: false,
                    error: 'Workflow type is required'
                });
            }

            const result = await this.workflowEngine.createWorkflow(type, config);
            res.json(result);
        } catch (error) {
            logger.error('Create workflow error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Get specific workflow
   */
    async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            const result = this.workflowEngine.getWorkflowStatus(id);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.json(result);
        } catch (error) {
            logger.error('Get workflow error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Start workflow
   */
    async startWorkflow(req, res) {
        try {
            const { id } = req.params;
            const result = await this.workflowEngine.startWorkflow(id);
            res.json(result);
        } catch (error) {
            logger.error('Start workflow error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Get dashboard data
   */
    async getDashboardData(req, res) {
        try {
            const agentStatus = this.agentOrchestrator.getAgentsStatus();
            const workflowStatus = this.workflowEngine.getAllWorkflows();

            const dashboardData = {
                success: true,
                data: {
                    summary: {
                        totalAgents: agentStatus.data.total,
                        activeAgents: agentStatus.data.agents.active,
                        totalWorkflows: workflowStatus.data.total,
                        runningWorkflows: workflowStatus.data.running,
                        completedWorkflows: workflowStatus.data.completed
                    },
                    agents: agentStatus.data.agents.roles,
                    recentWorkflows: workflowStatus.data.workflows.slice(-5),
                    systemHealth: {
                        status: 'healthy',
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                }
            };

            res.json(dashboardData);
        } catch (error) {
            logger.error('Dashboard data error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
   * Get router for Express app
   */
    getRouter() {
        return this.router;
    }

    /**
   * Helper method to get agent display name
   */
    getAgentDisplayName(agentId) {
        const displayNames = {
            coordinator: 'Universal Coordinator',
            creator: 'Universal Creator',
            researcher: 'Universal Researcher',
            automator: 'Universal Automator',
            analyzer: 'Universal Analyzer',
            optimizer: 'Universal Optimizer'
        };
        return displayNames[agentId] || agentId;
    }

    /**
   * Get default agents when database is not available
   */
    getDefaultAgents() {
        return [
            {
                id: 'coordinator',
                name: 'Universal Coordinator',
                status: 'active',
                personality_type: 'coordinator',
                traits: ['organized', 'communicative', 'strategic', 'diplomatic'],
                description: 'Project coordination and team management'
            },
            {
                id: 'creator',
                name: 'Universal Creator',
                status: 'active',
                personality_type: 'creator',
                traits: ['creative', 'innovative', 'artistic', 'expressive'],
                description: 'Content creation and creative solutions'
            },
            {
                id: 'researcher',
                name: 'Universal Researcher',
                status: 'active',
                personality_type: 'researcher',
                traits: ['analytical', 'thorough', 'detail-oriented', 'logical'],
                description: 'Research and data analysis'
            },
            {
                id: 'automator',
                name: 'Universal Automator',
                status: 'active',
                personality_type: 'automator',
                traits: [
                    'efficient',
                    'systematic',
                    'technology-focused',
                    'solution-oriented'
                ],
                description: 'Process automation and optimization'
            },
            {
                id: 'analyzer',
                name: 'Universal Analyzer',
                status: 'active',
                personality_type: 'analyzer',
                traits: ['analytical', 'pattern-focused', 'strategic', 'insightful'],
                description: 'Data analysis and insights'
            },
            {
                id: 'optimizer',
                name: 'Universal Optimizer',
                status: 'active',
                personality_type: 'optimizer',
                traits: [
                    'performance-focused',
                    'improvement-oriented',
                    'strategic',
                    'results-driven'
                ],
                description: 'Performance optimization and improvement'
            }
        ];
    }
}

module.exports = { UnifiedDashboard };
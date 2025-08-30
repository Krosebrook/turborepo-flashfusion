// =====================================================
// ORCHESTRATION API ROUTES - FlashFusion Integration
// RESTful API endpoints for the Digital Product Orchestration System
// =====================================================

const express = require('express');
const router = express.Router();
const DigitalProductOrchestrator = require('../../orchestration/core/DigitalProductOrchestrator');

// Initialize orchestrator instance
let orchestrator = null;

// Middleware to ensure orchestrator is initialized
async function ensureOrchestrator(req, res, next) {
    try {
        if (!orchestrator) {
            orchestrator = new DigitalProductOrchestrator();
            await orchestrator.initialize();
        }
        req.orchestrator = orchestrator;
        next();
    } catch (error) {
        console.error('Failed to initialize orchestrator:', error);
        res.status(500).json({
            success: false,
            error: 'Orchestration system unavailable',
            details: error.message
        });
    }
}

// Apply middleware to all routes
router.use(ensureOrchestrator);

// =====================================================
// SYSTEM STATUS AND HEALTH
// =====================================================

// GET /api/orchestration/status
router.get('/status', async (req, res) => {
    try {
        const dashboard = await req.orchestrator.getDashboard();
        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system status',
            details: error.message
        });
    }
});

// GET /api/orchestration/health
router.get('/health', async (req, res) => {
    try {
        const status = {
            orchestrator: 'healthy',
            timestamp: Date.now(),
            uptime: process.uptime()
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});

// =====================================================
// PROJECT MANAGEMENT
// =====================================================

// POST /api/orchestration/projects
router.post('/projects', async (req, res) => {
    try {
        const {
            description,
            priority = 5,
            platform = 'web',
            targetAudience,
            budget,
            timeline,
            context
        } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Project description is required'
            });
        }

        const projectId = `ff-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

        const request = {
            projectId,
            description,
            priority,
            context: {
                platform,
                target_audience: targetAudience,
                budget,
                timeline,
                ...context
            }
        };

        const result = await req.orchestrator.processProductRequest(request);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create project',
            details: error.message
        });
    }
});

// GET /api/orchestration/projects/:projectId
router.get('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project context
        const context = await req.orchestrator.context.getProjectContext(projectId);
        if (!context) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Get workflow status
        const workflow = await req.orchestrator.workflow.getWorkflowStatus(
            projectId
        );

        res.json({
            success: true,
            data: {
                project: context,
                workflow: workflow
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get project details',
            details: error.message
        });
    }
});

// PUT /api/orchestration/projects/:projectId
router.put('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const updates = req.body;

        const updatedContext = await req.orchestrator.context.updateProjectContext(
            projectId,
            updates,
            'api_user'
        );

        if (!updatedContext) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: updatedContext
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update project',
            details: error.message
        });
    }
});

// =====================================================
// QUICK START
// =====================================================

// POST /api/orchestration/quickstart
router.post('/quickstart', async (req, res) => {
    try {
        const { description, options = {} } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Project description is required for quick start'
            });
        }

        const result = await req.orchestrator.quickStart(description, options);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Quick start failed',
            details: error.message
        });
    }
});

// =====================================================
// AGENTS AND ROLES
// =====================================================

// GET /api/orchestration/agents
router.get('/agents', async (req, res) => {
    try {
        const agents = req.orchestrator.getAgentStatus();
        const workloadStatus = req.orchestrator.roleSelector.getWorkloadStatus();

        res.json({
            success: true,
            data: {
                agents,
                workload: workloadStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get agent status',
            details: error.message
        });
    }
});

// GET /api/orchestration/agents/roles
router.get('/agents/roles', async (req, res) => {
    try {
        const roles = req.orchestrator.roleSelector.getAllRoles();

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get agent roles',
            details: error.message
        });
    }
});

// POST /api/orchestration/agents/analyze
router.post('/agents/analyze', async (req, res) => {
    try {
        const { description, priority = 5, context = {} } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'Request description is required for analysis'
            });
        }

        const request = { description, priority, context };
        const analysis = await req.orchestrator.roleSelector.analyzeRequest(
            request
        );
        const selectedAgents =
      req.orchestrator.roleSelector.selectOptimalAgents(analysis);

        res.json({
            success: true,
            data: {
                analysis,
                selectedAgents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to analyze request',
            details: error.message
        });
    }
});

// =====================================================
// WORKFLOWS
// =====================================================

// GET /api/orchestration/workflows
router.get('/workflows', async (req, res) => {
    try {
        const workflows = await req.orchestrator.getActiveWorkflows();
        const analytics = await req.orchestrator.workflow.getAnalytics();

        res.json({
            success: true,
            data: {
                workflows,
                analytics
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflows',
            details: error.message
        });
    }
});

// GET /api/orchestration/workflows/:projectId
router.get('/workflows/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const status = await req.orchestrator.workflow.getWorkflowStatus(projectId);

        if (!status) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get workflow status',
            details: error.message
        });
    }
});

// PUT /api/orchestration/workflows/:projectId/progress
router.put('/workflows/:projectId/progress', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { capability, status, agentRole } = req.body;

        if (!capability || !status) {
            return res.status(400).json({
                success: false,
                error: 'Capability and status are required'
            });
        }

        const workflow = await req.orchestrator.workflow.updateProgress(
            projectId,
            capability,
            status,
            agentRole
        );

        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update workflow progress',
            details: error.message
        });
    }
});

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

// GET /api/orchestration/performance
router.get('/performance', async (req, res) => {
    try {
        const dashboard = await req.orchestrator.monitor.getDashboardData();

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get performance data',
            details: error.message
        });
    }
});

// GET /api/orchestration/performance/alerts
router.get('/performance/alerts', async (req, res) => {
    try {
        const alerts = await req.orchestrator.monitor.getActiveAlerts();

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts',
            details: error.message
        });
    }
});

// PUT /api/orchestration/performance/alerts/:alertId/acknowledge
router.put('/performance/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const alert = await req.orchestrator.monitor.acknowledgeAlert(alertId);

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert',
            details: error.message
        });
    }
});

// PUT /api/orchestration/performance/alerts/:alertId/resolve
router.put('/performance/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const alert = await req.orchestrator.monitor.resolveAlert(alertId);

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve alert',
            details: error.message
        });
    }
});

// =====================================================
// COMMUNICATION AND HANDOFFS
// =====================================================

// GET /api/orchestration/communication/status
router.get('/communication/status', async (req, res) => {
    try {
        const status = req.orchestrator.communication.getStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get communication status',
            details: error.message
        });
    }
});

// POST /api/orchestration/communication/messages
router.post('/communication/messages', async (req, res) => {
    try {
        const { fromAgent, toAgent, message, priority = 'normal' } = req.body;

        if (!fromAgent || !toAgent || !message) {
            return res.status(400).json({
                success: false,
                error: 'fromAgent, toAgent, and message are required'
            });
        }

        const messageId = await req.orchestrator.communication.sendMessage(
            fromAgent,
            toAgent,
            message,
            priority
        );

        res.status(201).json({
            success: true,
            data: { messageId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to send message',
            details: error.message
        });
    }
});

// GET /api/orchestration/communication/messages/:messageId
router.get('/communication/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await req.orchestrator.communication.getMessage(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get message',
            details: error.message
        });
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// Global error handler for orchestration routes
router.use((error, req, res, _next) => {
    console.error('Orchestration API Error:', error);

    res.status(500).json({
        success: false,
        error: 'Internal orchestration system error',
        details:
      process.env.NODE_ENV === 'development'
          ? error.message
          : 'Contact support'
    });
});

module.exports = router;
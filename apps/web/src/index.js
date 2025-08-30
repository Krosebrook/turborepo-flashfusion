/**
 * FlashFusion Unified Platform
 * Main entry point for the AI Business Operating System
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Core FlashFusion modules
const { FlashFusionCore } = require('./core/FlashFusionCore');
const { AgentOrchestrator } = require('./core/AgentOrchestrator');
const { WorkflowEngine } = require('./core/WorkflowEngine');
const { UnifiedDashboard } = require('./api/UnifiedDashboard');

// Services
const databaseService = require('./services/database');
const aiService = require('./services/aiService');
const notionService = require('./services/notionService');
const zapierService = require('./services/zapierService');

// Configuration and utilities
const config = require('./config/environment');
const logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');

class FlashFusionUnified {
    constructor() {
        this.app = express();
        this.core = new FlashFusionCore();
        this.orchestrator = new AgentOrchestrator();
        this.workflowEngine = new WorkflowEngine();
        this.dashboard = new UnifiedDashboard(
            this.orchestrator,
            this.workflowEngine
        );

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
    // Security middleware
        this.app.use(helmet());
        this.app.use(
            cors({
                origin: config.ALLOWED_ORIGINS || [
                    'http://localhost:3000',
                    'http://localhost:3001'
                ],
                credentials: true
            })
        );

        // Utility middleware
        this.app.use(compression());
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use(express.static(path.join(__dirname, '../client/dist')));
    }

    setupRoutes() {
    // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                version: config.APP_VERSION,
                timestamp: new Date().toISOString(),
                services: {
                    core: this.core.getHealth
                        ? this.core.getHealth()
                        : { status: 'healthy' },
                    orchestrator: this.orchestrator.getHealth(),
                    workflowEngine: this.workflowEngine.getHealth()
                }
            });
        });

        // API routes
        this.app.use('/api/v1', this.dashboard.getRouter());

        // Workflow routes
        this.app.use('/api/workflows', require('./api/routes/workflows'));

        // Agent routes
        this.app.use('/api/agents', require('./api/routes/agents'));

        // Integration routes
        this.app.use('/api/integrations', require('./api/routes/integrations'));

        // Notion integration routes
        this.app.use('/api/notion', require('./api/routes/notion'));

        // Zapier integration routes
        this.app.use('/api/zapier', require('./api/routes/zapier'));

        // Analytics routes
        this.app.use('/api/analytics', require('./api/routes/analytics'));

        // Replit-style interface route
        this.app.get('/replit', (req, res) => {
            res.sendFile(
                path.join(__dirname, '../client/dist/replit-interface.html')
            );
        });

        // Zapier automation hub route
        this.app.get('/zapier-automation', (req, res) => {
            res.sendFile(
                path.join(__dirname, '../client/dist/zapier-automation.html')
            );
        });

        // Default to Replit interface for root
        this.app.get('/', (req, res) => {
            res.sendFile(
                path.join(__dirname, '../client/dist/replit-interface.html')
            );
        });

        // Original dashboard route
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });

        // Serve original dashboard for iframe in personal dashboard modal
        this.app.get('*', (req, res) => {
            // Check if it's a static file request
            if (req.path.includes('.')) {
                res.sendFile(path.join(__dirname, '../client/dist', req.path));
            } else {
                res.sendFile(
                    path.join(__dirname, '../client/dist/replit-interface.html')
                );
            }
        });
    }

    setupErrorHandling() {
    // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });

        // Global error handler using ErrorHandler utility
        this.app.use(ErrorHandler.expressErrorHandler('FlashFusion'));
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing FlashFusion Unified Platform...');

            // Initialize database service
            const dbInitialized = await databaseService.initialize();
            if (dbInitialized) {
                console.log('✅ Database service initialized');
            } else {
                console.warn(
                    '⚠️ Database service failed to initialize - running in offline mode'
                );
            }

            // Initialize AI service
            const aiInitialized = await aiService.initialize();
            if (aiInitialized) {
                console.log('✅ AI service initialized');
            } else {
                console.warn(
                    '⚠️ AI service failed to initialize - agents will have limited functionality'
                );
            }

            // Initialize Notion service
            const notionInitialized = await notionService.initialize();
            if (notionInitialized) {
                console.log('✅ Notion service initialized');
            } else {
                console.warn(
                    '⚠️ Notion service failed to initialize - integration disabled'
                );
            }

            // Initialize Zapier service
            const zapierInitialized = await zapierService.initialize();
            if (zapierInitialized) {
                console.log('✅ Zapier service initialized');
            } else {
                console.warn(
                    '⚠️ Zapier service failed to initialize - webhooks disabled'
                );
            }

            // Initialize core services
            await this.core.initialize();
            logger.info('✅ Core services initialized');

            // Initialize agent orchestrator
            await this.orchestrator.initialize();
            console.log('✅ Agent orchestrator initialized');

            // Initialize workflow engine
            await this.workflowEngine.initialize();
            console.log('✅ Workflow engine initialized');

            // Dashboard ready (no initialization needed)
            console.log('📊 Dashboard ready');
            console.log('✅ Unified dashboard initialized');

            // Run database cleanup
            if (dbInitialized) {
                await databaseService.cleanup();
            }

            console.log('🎉 FlashFusion Unified Platform ready!');
        } catch (error) {
            console.error('❌ Failed to initialize FlashFusion:', error);
            throw error;
        }
    }

    async start(port = config.PORT || 3000) {
        try {
            await this.initialize();

            this.server = this.app.listen(port, () => {
                console.log(`🌟 FlashFusion Unified Platform running on port ${port}`);
                console.log(`📊 Dashboard: http://localhost:${port}`);
                console.log(`🔍 Health check: http://localhost:${port}/health`);
                console.log(`📚 API docs: http://localhost:${port}/api/docs`);
            });

            // Graceful shutdown handling
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());
        } catch (error) {
            console.error('❌ Failed to start FlashFusion:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down FlashFusion Unified Platform...');

        try {
            // Close server
            if (this.server) {
                await new Promise((resolve) => this.server.close(resolve));
            }

            // Cleanup services
            await this.workflowEngine.shutdown();
            await this.orchestrator.shutdown();
            await this.core.shutdown();

            // Final database cleanup
            if (databaseService.isConnected) {
                await databaseService.cleanup();
            }

            console.log('✅ FlashFusion shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Export for testing
module.exports = FlashFusionUnified;

// Start server if this file is run directly
if (require.main === module) {
    const platform = new FlashFusionUnified();
    platform.start();
}
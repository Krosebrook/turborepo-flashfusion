/**
 * RAG API Interface
 * Express API endpoints for the RAG system
 */

const express = require('express');
const RAGSystem = require('./src/index');

class RAGAPIService {
    constructor() {
        this.ragSystem = new RAGSystem();
        this.isInitialized = false;
        this.router = express.Router();
        this.setupRoutes();
    }

    /**
     * Initialize the RAG API service
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            console.log('🚀 Initializing RAG API Service...');
            const success = await this.ragSystem.initialize();
            
            if (success) {
                this.isInitialized = true;
                console.log('✅ RAG API Service initialized');
                
                // Try to load existing knowledge base
                const hasIndex = await this.ragSystem.indexExists();
                if (hasIndex) {
                    await this.ragSystem.buildKnowledgeBase(process.cwd(), false);
                    console.log('📁 Loaded existing knowledge base');
                } else {
                    console.log('⚠️  No knowledge base found. Build one using /api/rag/build');
                }
            }
            
            return success;
        } catch (error) {
            console.error('❌ RAG API Service initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Health check endpoint
        this.router.get('/health', async (req, res) => {
            try {
                const health = await this.ragSystem.healthCheck();
                res.json({
                    success: true,
                    data: health
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Build knowledge base
        this.router.post('/build', async (req, res) => {
            try {
                const { rootPath, forceRebuild = false } = req.body;
                const targetPath = rootPath || process.cwd();

                const success = await this.ragSystem.buildKnowledgeBase(targetPath, forceRebuild);
                
                if (success) {
                    const stats = this.ragSystem.getStats();
                    res.json({
                        success: true,
                        message: 'Knowledge base built successfully',
                        data: {
                            documentsIndexed: stats.documentsIndexed,
                            indexPath: stats.indexPath
                        }
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to build knowledge base'
                    });
                }
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Query endpoint
        this.router.post('/query', async (req, res) => {
            try {
                const { question, options = {} } = req.body;

                if (!question) {
                    return res.status(400).json({
                        success: false,
                        error: 'Question is required'
                    });
                }

                const result = await this.ragSystem.query(question, options);
                
                res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Search code endpoint
        this.router.post('/search', async (req, res) => {
            try {
                const { codeQuery } = req.body;

                if (!codeQuery) {
                    return res.status(400).json({
                        success: false,
                        error: 'Code query is required'
                    });
                }

                const result = await this.ragSystem.searchCode(codeQuery);
                
                res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Documentation endpoint
        this.router.post('/docs', async (req, res) => {
            try {
                const { topic } = req.body;

                if (!topic) {
                    return res.status(400).json({
                        success: false,
                        error: 'Documentation topic is required'
                    });
                }

                const result = await this.ragSystem.getDocumentation(topic);
                
                res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Repository overview endpoint
        this.router.get('/overview', async (req, res) => {
            try {
                const result = await this.ragSystem.getRepositoryOverview();
                
                res.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Statistics endpoint
        this.router.get('/stats', async (req, res) => {
            try {
                const stats = this.ragSystem.getStats();
                
                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Clear knowledge base endpoint
        this.router.delete('/clear', async (req, res) => {
            try {
                this.ragSystem.clearKnowledgeBase();
                
                res.json({
                    success: true,
                    message: 'Knowledge base cleared successfully'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Simple ask endpoint for quick queries
        this.router.get('/ask', async (req, res) => {
            try {
                const { q: question } = req.query;

                if (!question) {
                    return res.status(400).json({
                        success: false,
                        error: 'Question parameter (q) is required'
                    });
                }

                const result = await this.ragSystem.query(question, { verbose: false });
                
                res.json({
                    success: true,
                    data: {
                        question,
                        answer: result.answer,
                        confidence: result.confidence
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Middleware to check if RAG system is initialized
     */
    requireInitialized() {
        return (req, res, next) => {
            if (!this.isInitialized) {
                return res.status(503).json({
                    success: false,
                    error: 'RAG system not initialized'
                });
            }
            next();
        };
    }

    /**
     * Get the Express router
     */
    getRouter() {
        return this.router;
    }

    /**
     * Get RAG system instance
     */
    getRAGSystem() {
        return this.ragSystem;
    }
}

module.exports = RAGAPIService;
// =====================================================
// CONTEXT MANAGER - FlashFusion Integration
// Manages project context and knowledge base
// =====================================================

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContextManager {
    constructor() {
        this.projectContexts = new Map();
        this.contextPath = path.join(__dirname, '..', 'data', 'contexts');
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Ensure context directory exists
            await fs.mkdir(this.contextPath, { recursive: true });
            console.log('📂 Context Manager initialized');
            this.isInitialized = true;
        } catch (error) {
            console.error('Context Manager initialization failed:', error);
            throw error;
        }
    }

    async createProjectContext(projectId, initialContext = {}) {
        const context = {
            projectId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            project: {
                phase: 'discovery',
                status: 'active',
                ...initialContext
            },
            agents: {},
            history: [],
            metadata: {
                version: '1.0',
                source: 'FlashFusion-Orchestrator'
            }
        };

        this.projectContexts.set(projectId, context);
        await this.persistContext(projectId, context);

        console.log(`📋 Created context for project: ${projectId}`);
        return context;
    }

    async getProjectContext(projectId) {
    // Try memory first
        let context = this.projectContexts.get(projectId);

        // Try file system if not in memory
        if (!context) {
            try {
                context = await this.loadContext(projectId);
                if (context) {
                    this.projectContexts.set(projectId, context);
                }
            } catch (error) {
                console.warn(
                    `Context not found for project ${projectId}:`,
                    error.message
                );
            }
        }

        return context;
    }

    async updateProjectContext(projectId, updates, updatedBy = 'system') {
        let context = await this.getProjectContext(projectId);

        if (!context) {
            context = await this.createProjectContext(projectId);
        }

        // Update the context
        context.updatedAt = Date.now();
        context.project = { ...context.project, ...updates };

        // Add to history
        context.history.push({
            timestamp: Date.now(),
            updatedBy,
            changes: updates,
            id: crypto.randomUUID()
        });

        // Keep only last 50 history entries
        if (context.history.length > 50) {
            context.history = context.history.slice(-50);
        }

        this.projectContexts.set(projectId, context);
        await this.persistContext(projectId, context);

        return context;
    }

    async getRelevantContext(projectId, agentRole) {
        const context = await this.getProjectContext(projectId);
        if (!context) {
            return {};
        }

        // Get context relevant to this agent role
        const relevantContext = {
            project: context.project,
            lastUpdate: context.updatedAt,
            recentHistory: context.history.slice(-5), // Last 5 changes
            agentHistory: context.agents[agentRole] || {}
        };

        // Add role-specific context based on agent type
        switch (agentRole) {
        case 'visionary_strategist':
            relevantContext.strategy = context.project.strategy || {};
            relevantContext.market = context.project.market || {};
            break;
        case 'product_manager':
            relevantContext.requirements = context.project.requirements || {};
            relevantContext.features = context.project.features || {};
            break;
        case 'ux_designer':
            relevantContext.userResearch = context.project.userResearch || {};
            relevantContext.design = context.project.design || {};
            break;
        case 'ui_designer':
            relevantContext.design = context.project.design || {};
            relevantContext.branding = context.project.branding || {};
            break;
        case 'mobile_developer':
        case 'backend_developer':
            relevantContext.technical = context.project.technical || {};
            relevantContext.architecture = context.project.architecture || {};
            break;
        case 'qa_engineer':
            relevantContext.testing = context.project.testing || {};
            relevantContext.quality = context.project.quality || {};
            break;
        case 'devops_engineer':
            relevantContext.infrastructure = context.project.infrastructure || {};
            relevantContext.deployment = context.project.deployment || {};
            break;
        case 'security_analyst':
            relevantContext.security = context.project.security || {};
            relevantContext.compliance = context.project.compliance || {};
            break;
        case 'marketing_growth':
            relevantContext.marketing = context.project.marketing || {};
            relevantContext.growth = context.project.growth || {};
            break;
        case 'business_analyst':
            relevantContext.business = context.project.business || {};
            relevantContext.analysis = context.project.analysis || {};
            break;
        }

        return relevantContext;
    }

    async updateAgentContext(projectId, agentRole, agentData) {
        const context = await this.getProjectContext(projectId);
        if (!context) {
            return;
        }

        if (!context.agents[agentRole]) {
            context.agents[agentRole] = {
                firstInteraction: Date.now(),
                interactions: 0
            };
        }

        context.agents[agentRole] = {
            ...context.agents[agentRole],
            lastInteraction: Date.now(),
            interactions: (context.agents[agentRole].interactions || 0) + 1,
            ...agentData
        };

        await this.persistContext(projectId, context);
    }

    async persistContext(projectId, context) {
        try {
            const filePath = path.join(this.contextPath, `${projectId}.json`);
            await fs.writeFile(filePath, JSON.stringify(context, null, 2));
        } catch (error) {
            console.error(`Failed to persist context for ${projectId}:`, error);
        }
    }

    async loadContext(projectId) {
        const filePath = path.join(this.contextPath, `${projectId}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to load context for ${projectId}:`, error);
            }
            return null;
        }
    }

    async searchContexts(query) {
        const results = [];

        for (const [projectId, context] of this.projectContexts) {
            const searchText = JSON.stringify(context).toLowerCase();
            if (searchText.includes(query.toLowerCase())) {
                results.push({
                    projectId,
                    relevance: this.calculateRelevance(context, query),
                    summary: {
                        phase: context.project.phase,
                        status: context.project.status,
                        lastUpdate: context.updatedAt
                    }
                });
            }
        }

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(context, query) {
        const searchText = JSON.stringify(context).toLowerCase();
        const queryWords = query.toLowerCase().split(' ');

        let relevance = 0;
        queryWords.forEach((word) => {
            const matches = (searchText.match(new RegExp(word, 'g')) || []).length;
            relevance += matches;
        });

        return relevance;
    }

    async getContextSummary() {
        return {
            totalProjects: this.projectContexts.size,
            activeProjects: Array.from(this.projectContexts.values()).filter(
                (ctx) => ctx.project.status === 'active'
            ).length,
            phases: this.getPhaseDistribution(),
            recentActivity: this.getRecentActivity()
        };
    }

    getPhaseDistribution() {
        const phases = {};
        for (const context of this.projectContexts.values()) {
            const phase = context.project.phase || 'unknown';
            phases[phase] = (phases[phase] || 0) + 1;
        }
        return phases;
    }

    getRecentActivity() {
        const recent = [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (const context of this.projectContexts.values()) {
            if (now - context.updatedAt < dayMs) {
                recent.push({
                    projectId: context.projectId,
                    lastUpdate: context.updatedAt,
                    phase: context.project.phase
                });
            }
        }

        return recent.sort((a, b) => b.lastUpdate - a.lastUpdate);
    }
}

module.exports = ContextManager;
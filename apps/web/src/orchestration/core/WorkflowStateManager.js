// =====================================================
// WORKFLOW STATE MANAGER - FlashFusion Integration
// Manages workflow states and progress tracking
// =====================================================

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class WorkflowStateManager extends EventEmitter {
    constructor() {
        super();
        this.activeWorkflows = new Map();
        this.workflowPath = path.join(__dirname, '..', 'data', 'workflows');
        this.defaultStates = this.initializeDefaultStates();
    }

    initializeDefaultStates() {
        return {
            discovery: {
                market_research: 'pending',
                strategy: 'pending',
                vision: 'pending',
                requirements: 'pending'
            },
            design: {
                user_research: 'pending',
                wireframes: 'pending',
                visual_design: 'pending',
                design_system: 'pending'
            },
            development: {
                api_dev: 'pending',
                mobile_dev: 'pending',
                database: 'pending',
                security: 'pending'
            },
            testing: {
                testing: 'pending',
                automation: 'pending',
                quality: 'pending',
                performance_testing: 'pending'
            },
            deployment: {
                deployment: 'pending',
                infrastructure: 'pending',
                monitoring: 'pending',
                cicd: 'pending'
            },
            launch: {
                campaigns: 'pending',
                growth: 'pending',
                user_acquisition: 'pending',
                content: 'pending'
            }
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.workflowPath, { recursive: true });
            console.log('🔄 Workflow State Manager initialized');
        } catch (error) {
            console.error('Workflow State Manager initialization failed:', error);
            throw error;
        }
    }

    async createWorkflow(projectId, customStates = null) {
        const workflow = {
            projectId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            currentPhase: 'discovery',
            phases: customStates || JSON.parse(JSON.stringify(this.defaultStates)),
            progress: {
                overall: 0,
                byPhase: {}
            },
            timeline: {
                started: Date.now(),
                estimated: null,
                milestones: []
            },
            metadata: {
                version: '1.0',
                source: 'FlashFusion-Orchestrator'
            }
        };

        // Calculate initial progress
        workflow.progress.byPhase = this.calculatePhaseProgress(workflow.phases);
        workflow.progress.overall = this.calculateOverallProgress(workflow.phases);

        this.activeWorkflows.set(projectId, workflow);
        await this.persistWorkflow(projectId, workflow);

        console.log(`🚀 Created workflow for project: ${projectId}`);
        this.emit('workflow:created', { projectId, workflow });

        return workflow;
    }

    async getWorkflow(projectId) {
        let workflow = this.activeWorkflows.get(projectId);

        if (!workflow) {
            try {
                workflow = await this.loadWorkflow(projectId);
                if (workflow) {
                    this.activeWorkflows.set(projectId, workflow);
                }
            } catch (error) {
                console.warn(
                    `Workflow not found for project ${projectId}:`,
                    error.message
                );
            }
        }

        return workflow;
    }

    async updateProgress(projectId, capability, status, agentRole = null) {
        const workflow = await this.getWorkflow(projectId);
        if (!workflow) {
            console.warn(`No workflow found for project ${projectId}`);
            return null;
        }

        // Find which phase contains this capability
        let targetPhase = null;
        let updated = false;

        for (const [phase, capabilities] of Object.entries(workflow.phases)) {
            if (Object.prototype.hasOwnProperty.call(capabilities, capability)) {
                workflow.phases[phase][capability] = status;
                targetPhase = phase;
                updated = true;
                break;
            }
        }

        if (!updated) {
            // If capability not found in predefined phases, add to current phase
            targetPhase = workflow.currentPhase;
            if (!workflow.phases[targetPhase]) {
                workflow.phases[targetPhase] = {};
            }
            workflow.phases[targetPhase][capability] = status;
        }

        // Update timestamp and progress
        workflow.updatedAt = Date.now();
        workflow.progress.byPhase = this.calculatePhaseProgress(workflow.phases);
        workflow.progress.overall = this.calculateOverallProgress(workflow.phases);

        // Add milestone if task completed
        if (status === 'completed') {
            workflow.timeline.milestones.push({
                capability,
                phase: targetPhase,
                completedAt: Date.now(),
                completedBy: agentRole
            });
        }

        // Check if phase is complete and advance if needed
        await this.checkPhaseCompletion(workflow, targetPhase);

        await this.persistWorkflow(projectId, workflow);

        this.emit('progress:updated', {
            projectId,
            capability,
            status,
            phase: targetPhase,
            overallProgress: workflow.progress.overall
        });

        console.log(
            `📊 Progress updated - ${projectId}: ${capability} = ${status}`
        );
        return workflow;
    }

    async checkPhaseCompletion(workflow, phase) {
        const phaseCapabilities = workflow.phases[phase];
        const completedCount = Object.values(phaseCapabilities).filter(
            (status) => status === 'completed'
        ).length;
        const totalCount = Object.keys(phaseCapabilities).length;

        const phaseProgress =
      totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        // If phase is 80% complete, consider advancing to next phase
        if (phaseProgress >= 80) {
            const phases = Object.keys(this.defaultStates);
            const currentIndex = phases.indexOf(phase);

            if (currentIndex >= 0 && currentIndex < phases.length - 1) {
                const nextPhase = phases[currentIndex + 1];

                // Only advance if not already in a later phase
                const currentPhaseIndex = phases.indexOf(workflow.currentPhase);
                if (currentIndex >= currentPhaseIndex) {
                    workflow.currentPhase = nextPhase;

                    this.emit('phase:advanced', {
                        projectId: workflow.projectId,
                        fromPhase: phase,
                        toPhase: nextPhase,
                        progress: phaseProgress
                    });

                    console.log(
                        `🎯 Phase advanced - ${workflow.projectId}: ${phase} → ${nextPhase}`
                    );
                }
            }
        }
    }

    calculatePhaseProgress(phases) {
        const progress = {};

        for (const [phase, capabilities] of Object.entries(phases)) {
            const total = Object.keys(capabilities).length;
            const completed = Object.values(capabilities).filter(
                (status) => status === 'completed'
            ).length;

            progress[phase] = total > 0 ? Math.round((completed / total) * 100) : 0;
        }

        return progress;
    }

    calculateOverallProgress(phases) {
        const allCapabilities = [];

        for (const capabilities of Object.values(phases)) {
            allCapabilities.push(...Object.values(capabilities));
        }

        if (allCapabilities.length === 0) {
            return 0;
        }

        const completed = allCapabilities.filter(
            (status) => status === 'completed'
        ).length;
        return Math.round((completed / allCapabilities.length) * 100);
    }

    async getWorkflowStatus(projectId) {
        const workflow = await this.getWorkflow(projectId);
        if (!workflow) {
            return null;
        }

        return {
            projectId,
            currentPhase: workflow.currentPhase,
            overallProgress: workflow.progress.overall,
            phaseProgress: workflow.progress.byPhase,
            recentMilestones: workflow.timeline.milestones.slice(-5),
            lastUpdate: workflow.updatedAt,
            timeElapsed: Date.now() - workflow.timeline.started,
            status: this.determineWorkflowStatus(workflow)
        };
    }

    determineWorkflowStatus(workflow) {
        const overall = workflow.progress.overall;

        if (overall === 0) {
            return 'not_started';
        }
        if (overall < 25) {
            return 'planning';
        }
        if (overall < 50) {
            return 'development';
        }
        if (overall < 75) {
            return 'testing';
        }
        if (overall < 100) {
            return 'deployment';
        }
        return 'completed';
    }

    async setCustomWorkflow(projectId, customPhases) {
        const workflow = await this.getWorkflow(projectId);
        if (!workflow) {
            return await this.createWorkflow(projectId, customPhases);
        }

        workflow.phases = customPhases;
        workflow.updatedAt = Date.now();
        workflow.progress.byPhase = this.calculatePhaseProgress(workflow.phases);
        workflow.progress.overall = this.calculateOverallProgress(workflow.phases);

        await this.persistWorkflow(projectId, workflow);

        this.emit('workflow:customized', { projectId, workflow });
        return workflow;
    }

    async addMilestone(projectId, milestone) {
        const workflow = await this.getWorkflow(projectId);
        if (!workflow) {
            return null;
        }

        workflow.timeline.milestones.push({
            ...milestone,
            timestamp: Date.now(),
            id: `milestone-${Date.now()}`
        });

        await this.persistWorkflow(projectId, workflow);

        this.emit('milestone:added', { projectId, milestone });
        return workflow;
    }

    async getAnalytics() {
        const analytics = {
            totalWorkflows: this.activeWorkflows.size,
            phaseDistribution: {},
            averageProgress: 0,
            completionRates: {},
            recentActivity: []
        };

        let totalProgress = 0;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (const workflow of this.activeWorkflows.values()) {
            // Phase distribution
            const phase = workflow.currentPhase;
            analytics.phaseDistribution[phase] =
        (analytics.phaseDistribution[phase] || 0) + 1;

            // Average progress
            totalProgress += workflow.progress.overall;

            // Recent activity
            if (now - workflow.updatedAt < dayMs) {
                analytics.recentActivity.push({
                    projectId: workflow.projectId,
                    phase: workflow.currentPhase,
                    progress: workflow.progress.overall,
                    lastUpdate: workflow.updatedAt
                });
            }

            // Completion rates by phase
            for (const [phase, progress] of Object.entries(
                workflow.progress.byPhase
            )) {
                if (!analytics.completionRates[phase]) {
                    analytics.completionRates[phase] = [];
                }
                analytics.completionRates[phase].push(progress);
            }
        }

        analytics.averageProgress =
      this.activeWorkflows.size > 0
          ? Math.round(totalProgress / this.activeWorkflows.size)
          : 0;

        // Calculate average completion rates
        for (const [phase, rates] of Object.entries(analytics.completionRates)) {
            const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            analytics.completionRates[phase] = Math.round(avg);
        }

        analytics.recentActivity.sort((a, b) => b.lastUpdate - a.lastUpdate);

        return analytics;
    }

    async persistWorkflow(projectId, workflow) {
        try {
            const filePath = path.join(this.workflowPath, `${projectId}.json`);
            await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
        } catch (error) {
            console.error(`Failed to persist workflow for ${projectId}:`, error);
        }
    }

    async loadWorkflow(projectId) {
        const filePath = path.join(this.workflowPath, `${projectId}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to load workflow for ${projectId}:`, error);
            }
            return null;
        }
    }
}

module.exports = WorkflowStateManager;
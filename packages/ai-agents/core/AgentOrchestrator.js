/**
 * Agent Orchestrator - Manages AI agent coordination and communication
 */

const { EventEmitter } = require('events');
const logger = console;

class AgentOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.activeWorkflows = new Map();
        this.agentCommunicationQueue = [];
        this.isInitialized = false;
    }

    /**
   * Initialize the orchestrator
   */
    async initialize() {
        try {
            logger.info('🎭 Initializing Agent Orchestrator...');

            // Initialize core agents
            await this.initializeCoreAgents();

            // Set up communication channels
            this.setupCommunicationChannels();

            this.isInitialized = true;
            logger.info('✅ Agent Orchestrator initialized successfully');

            return { success: true };
        } catch (error) {
            logger.error('❌ Failed to initialize Agent Orchestrator:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Initialize the 6 core universal agents
   */
    async initializeCoreAgents() {
        const coreAgents = [
            {
                id: 'researcher',
                name: 'Universal Researcher',
                role: 'Research and information gathering',
                capabilities: ['web_search', 'data_analysis', 'market_research'],
                priority: 1,
                status: 'idle'
            },
            {
                id: 'creator',
                name: 'Universal Creator',
                role: 'Content and asset creation',
                capabilities: ['content_generation', 'design', 'copywriting'],
                priority: 2,
                status: 'idle'
            },
            {
                id: 'optimizer',
                name: 'Universal Optimizer',
                role: 'Performance optimization',
                capabilities: [
                    'seo_optimization',
                    'conversion_optimization',
                    'analytics'
                ],
                priority: 3,
                status: 'idle'
            },
            {
                id: 'automator',
                name: 'Universal Automator',
                role: 'Process automation',
                capabilities: [
                    'workflow_automation',
                    'integration_setup',
                    'task_scheduling'
                ],
                priority: 4,
                status: 'idle'
            },
            {
                id: 'analyzer',
                name: 'Universal Analyzer',
                role: 'Data analysis and insights',
                capabilities: ['data_analysis', 'reporting', 'trend_analysis'],
                priority: 5,
                status: 'idle'
            },
            {
                id: 'coordinator',
                name: 'Universal Coordinator',
                role: 'Agent coordination and management',
                capabilities: [
                    'agent_management',
                    'workflow_coordination',
                    'resource_allocation'
                ],
                priority: 0,
                status: 'active'
            }
        ];

        for (const agentConfig of coreAgents) {
            this.agents.set(agentConfig.id, agentConfig);
            logger.info(`🤖 Initialized agent: ${agentConfig.name}`);
        }
    }

    /**
   * Set up inter-agent communication channels
   */
    setupCommunicationChannels() {
        this.on('agent_message', this.handleAgentMessage.bind(this));
        this.on('workflow_request', this.handleWorkflowRequest.bind(this));
        this.on('agent_handoff', this.handleAgentHandoff.bind(this));
    }

    /**
   * Get all agents status
   */
    getAgentsStatus() {
        return {
            success: true,
            data: {
                total: this.agents.size,
                agents: {
                    roles: Array.from(this.agents.values()),
                    active: Array.from(this.agents.values()).filter(
                        (a) => a.status === 'active'
                    ).length,
                    idle: Array.from(this.agents.values()).filter(
                        (a) => a.status === 'idle'
                    ).length
                },
                workflows: {
                    active: this.activeWorkflows.size,
                    queue_length: this.agentCommunicationQueue.length
                }
            }
        };
    }

    /**
   * Assign agent to workflow
   */
    async assignAgent(workflowId, agentId, task) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }

            // Update agent status
            agent.status = 'working';
            agent.currentWorkflow = workflowId;
            agent.currentTask = task;

            // Track workflow
            if (!this.activeWorkflows.has(workflowId)) {
                this.activeWorkflows.set(workflowId, {
                    id: workflowId,
                    agents: [],
                    startTime: new Date(),
                    status: 'active'
                });
            }

            const workflow = this.activeWorkflows.get(workflowId);
            workflow.agents.push(agentId);

            logger.info(`🎯 Assigned ${agent.name} to workflow ${workflowId}`);

            return {
                success: true,
                data: {
                    agent: agent.name,
                    workflow: workflowId,
                    task: task
                }
            };
        } catch (error) {
            logger.error('❌ Failed to assign agent:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Handle agent messages
   */
    handleAgentMessage(data) {
        logger.info(`📨 Agent message from ${data.agentId}: ${data.message}`);
        this.agentCommunicationQueue.push({
            timestamp: new Date(),
            ...data
        });
    }

    /**
   * Handle workflow requests
   */
    handleWorkflowRequest(data) {
        logger.info(
            `🔄 Workflow request: ${data.workflowType} - ${data.description}`
        );
        // Delegate to appropriate agents based on workflow type
        this.delegateWorkflow(data);
    }

    /**
   * Handle agent handoffs
   */
    handleAgentHandoff(data) {
        logger.info(`🤝 Agent handoff: ${data.fromAgent} → ${data.toAgent}`);
        // Transfer context and responsibilities
        this.transferAgentContext(data);
    }

    /**
   * Delegate workflow to appropriate agents
   */
    delegateWorkflow(workflowData) {
        const { workflowType } = workflowData;

        // Simple delegation logic - can be enhanced with AI decision making
        let recommendedAgents = [];

        switch (workflowType) {
        case 'development':
            recommendedAgents = ['researcher', 'creator', 'automator'];
            break;
        case 'commerce':
            recommendedAgents = ['analyzer', 'optimizer', 'automator'];
            break;
        case 'content':
            recommendedAgents = ['researcher', 'creator', 'optimizer'];
            break;
        case 'hybrid':
            recommendedAgents = ['coordinator', 'analyzer', 'automator'];
            break;
        default:
            recommendedAgents = ['coordinator'];
        }

        logger.info(
            `🎭 Recommended agents for ${workflowType}: ${recommendedAgents.join(
                ', '
            )}`
        );
        return recommendedAgents;
    }

    /**
   * Transfer context between agents
   */
    transferAgentContext(handoffData) {
        const { fromAgent, toAgent, context, workflowId } = handoffData;

        // Update agent statuses
        const from = this.agents.get(fromAgent);
        const to = this.agents.get(toAgent);

        if (from && to) {
            from.status = 'idle';
            from.currentWorkflow = null;
            from.currentTask = null;

            to.status = 'working';
            to.currentWorkflow = workflowId;
            to.currentTask = context.task;

            logger.info(`✅ Context transferred from ${from.name} to ${to.name}`);
        }
    }

    /**
   * Get orchestrator health
   */
    getHealth() {
        return {
            status: this.isInitialized ? 'healthy' : 'initializing',
            agents: this.agents.size,
            activeWorkflows: this.activeWorkflows.size,
            queueLength: this.agentCommunicationQueue.length,
            uptime: process.uptime()
        };
    }
}

module.exports = { AgentOrchestrator };
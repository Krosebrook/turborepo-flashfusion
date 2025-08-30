// =====================================================
// DIGITAL PRODUCT ORCHESTRATION SYSTEM - FlashFusion Integration
// Adapted for FlashFusion's existing architecture
// =====================================================

const EventEmitter = require('events');

// Import FlashFusion services
const { SecureAIService } = require('../../server/services/ai');

// Import orchestration components
const AgentCommunicationSystem = require('./AgentCommunicationSystem');
const DynamicRoleSelector = require('./DynamicRoleSelector');
const ContextManager = require('./ContextManager');
const WorkflowStateManager = require('./WorkflowStateManager');
const PerformanceMonitor = require('./PerformanceMonitor');

class DigitalProductOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.activeWorkflows = new Map();
        this.communication = new AgentCommunicationSystem();
        this.roleSelector = new DynamicRoleSelector();
        this.monitor = new PerformanceMonitor();
        this.context = new ContextManager();
        this.workflow = new WorkflowStateManager();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize FlashFusion AI services
            const aiHealth = await SecureAIService.healthCheck();
            console.log('🤖 AI Services Status:', aiHealth.status);

            // Initialize orchestration subsystems
            await this.communication.initialize();
            await this.context.initialize();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log(
                '🎭 Digital Product Orchestrator initialized for FlashFusion'
            );

            return {
                status: 'initialized',
                services: {
                    ai: aiHealth.status,
                    communication: 'ready',
                    context: 'ready',
                    workflow: 'ready'
                }
            };
        } catch (error) {
            console.error('❌ Orchestrator initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.communication.on(
            'handoff:completed',
            this.handleHandoffCompleted.bind(this)
        );
        this.communication.on(
            'handoff:timeout',
            this.handleHandoffTimeout.bind(this)
        );
        this.monitor.on('alert:triggered', this.handleMonitorAlert.bind(this));
    }

    async processProductRequest(request) {
        try {
            console.log(`🎯 Processing product request: ${request.description}`);

            // Validate AI services are available
            const aiHealth = await SecureAIService.healthCheck();
            if (aiHealth.status !== 'healthy') {
                throw new Error(`AI services unavailable: ${aiHealth.status}`);
            }

            // Analyze request and select agents
            const analysis = await this.roleSelector.analyzeRequest(request);
            const selectedAgents = this.roleSelector.selectOptimalAgents(analysis);

            console.log(
                `📋 Selected ${selectedAgents.length} agents:`,
                selectedAgents.map((a) => a.role)
            );

            // Create or get project context
            let context = await this.context.getProjectContext(request.projectId);
            if (!context) {
                context = await this.context.createProjectContext(request.projectId, {
                    ...request.context,
                    createdBy: 'FlashFusion-Orchestrator'
                });
                await this.workflow.createWorkflow(request.projectId);
            }

            // Execute agent workflow with FlashFusion AI
            const result = await this.executeFlashFusionWorkflow(
                selectedAgents,
                request,
                context
            );

            return {
                success: true,
                projectId: request.projectId,
                agents: selectedAgents.map((a) => a.role),
                results: result,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Error processing request:', error);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    async executeFlashFusionWorkflow(selectedAgents, request, _context) {
        const results = [];

        for (const agent of selectedAgents) {
            try {
                console.log(`🔄 Executing ${agent.role} for ${agent.capability}`);

                // Get relevant context for agent
                const agentContext = await this.context.getRelevantContext(
                    request.projectId,
                    agent.role
                );

                // Build agent prompt
                const prompt = this.buildFlashFusionAgentPrompt(
                    agent,
                    request,
                    agentContext
                );

                // Use FlashFusion's SecureAIService
                const aiResponse = await SecureAIService.generateCompletion(
                    prompt,
                    null,
                    {
                        maxTokens: 1500,
                        temperature: 0.7
                    }
                );

                // Process and validate the AI response
                const agentResult = {
                    content: aiResponse.content,
                    provider: aiResponse.provider,
                    model: aiResponse.model,
                    usage: aiResponse.usage
                };

                // Update context with results
                await this.context.updateProjectContext(
                    request.projectId,
                    { [agent.capability]: agentResult },
                    agent.role
                );

                // Update progress
                await this.workflow.updateProgress(
                    request.projectId,
                    agent.capability,
                    'completed'
                );

                results.push({
                    agent: agent.role,
                    capability: agent.capability,
                    result: agentResult,
                    timestamp: Date.now()
                });

                console.log(`✅ ${agent.role} completed successfully`);
            } catch (error) {
                console.error(`❌ Agent ${agent.role} failed:`, error);
                results.push({
                    agent: agent.role,
                    capability: agent.capability,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }

        return results;
    }

    buildFlashFusionAgentPrompt(agent, request, context) {
        const baseContext = `
Project: ${request.projectId}
Request: ${request.description}
Current Phase: ${context.project?.phase || 'discovery'}
Previous Context: ${JSON.stringify(context.project || {}, null, 2)}
`;

        const rolePrompts = {
            visionary_strategist: `${baseContext}

You are the Visionary Strategist for FlashFusion. Your role is to:
1. Define the strategic vision and market positioning
2. Identify key success metrics and KPIs
3. Create a high-level roadmap with milestones
4. Assess market opportunities and competitive landscape

Provide a structured response with:
- Vision Statement
- Strategic Pillars (3-5 key areas)
- Success Metrics
- Market Analysis
- Recommended Next Steps`,

            product_manager: `${baseContext}

You are the Product Manager for FlashFusion. Your role is to:
1. Break down requirements into user stories
2. Prioritize features based on value and effort
3. Define acceptance criteria
4. Coordinate between stakeholders

Provide a structured response with:
- User Stories (with acceptance criteria)
- Feature Prioritization Matrix
- Stakeholder Communication Plan
- Risk Assessment`,

            ux_designer: `${baseContext}

You are the UX Designer for FlashFusion. Your role is to:
1. Research user needs and pain points
2. Create user personas and journey maps
3. Design wireframes and user flows
4. Plan usability testing approach

Provide a structured response with:
- User Personas (2-3 key personas)
- User Journey Map
- Key User Flows
- Wireframe Specifications
- Usability Testing Plan`,

            ui_designer: `${baseContext}

You are the UI Designer for FlashFusion. Your role is to:
1. Create visual design language and style guide
2. Design high-fidelity mockups
3. Ensure brand consistency
4. Optimize for accessibility

Provide a structured response with:
- Design System Overview
- Color Palette and Typography
- Component Library Specifications
- Accessibility Guidelines
- Brand Implementation Guide`,

            mobile_developer: `${baseContext}

You are the Mobile Developer for FlashFusion. Your role is to:
1. Design mobile app architecture
2. Define technical implementation approach
3. Plan integration with FlashFusion's AI services
4. Optimize for performance and user experience

Provide a structured response with:
- Mobile Architecture Overview
- Technology Stack Recommendations
- AI Service Integration Plan
- Performance Optimization Strategy
- Development Timeline`,

            backend_developer: `${baseContext}

You are the Backend Developer for FlashFusion. Your role is to:
1. Design API architecture and endpoints
2. Plan database schema and data flow
3. Ensure scalability and security
4. Integrate with FlashFusion's existing services

Provide a structured response with:
- API Design and Documentation
- Database Schema
- Security Implementation Plan
- Integration with FlashFusion Services
- Scalability Strategy`,

            qa_engineer: `${baseContext}

You are the QA Engineer for FlashFusion. Your role is to:
1. Create comprehensive test strategy
2. Design automated and manual test cases
3. Plan performance and security testing
4. Define quality gates and metrics

Provide a structured response with:
- Test Strategy Overview
- Test Case Specifications
- Automation Framework Plan
- Performance Testing Approach
- Quality Metrics and KPIs`,

            devops_engineer: `${baseContext}

You are the DevOps Engineer for FlashFusion. Your role is to:
1. Design CI/CD pipeline
2. Plan infrastructure and deployment strategy
3. Implement monitoring and alerting
4. Ensure security and compliance

Provide a structured response with:
- CI/CD Pipeline Design
- Infrastructure Architecture
- Deployment Strategy
- Monitoring and Alerting Plan
- Security and Compliance Measures`,

            security_analyst: `${baseContext}

You are the Security Analyst for FlashFusion. Your role is to:
1. Conduct security risk assessment
2. Define security requirements and controls
3. Plan penetration testing and audits
4. Ensure compliance with standards

Provide a structured response with:
- Security Risk Assessment
- Security Requirements Matrix
- Threat Modeling Results
- Compliance Checklist
- Security Testing Plan`,

            marketing_growth: `${baseContext}

You are the Marketing & Growth Strategist for FlashFusion. Your role is to:
1. Define go-to-market strategy
2. Plan user acquisition campaigns
3. Design growth metrics and funnels
4. Create content and messaging strategy

Provide a structured response with:
- Go-to-Market Strategy
- User Acquisition Plan
- Growth Metrics and KPIs
- Content Strategy
- Campaign Execution Plan`,

            business_analyst: `${baseContext}

You are the Business Analyst for FlashFusion. Your role is to:
1. Analyze business requirements and feasibility
2. Define process workflows and stakeholder needs
3. Create business case and ROI projections
4. Identify risks and mitigation strategies

Provide a structured response with:
- Business Requirements Document
- Process Flow Diagrams
- ROI Analysis and Business Case
- Stakeholder Analysis
- Risk Assessment Matrix`
        };

        return (
            rolePrompts[agent.role] ||
      `You are a ${agent.role.replace(
          '_',
          ' '
      )} for FlashFusion. Handle this request: ${request.description}`
        );
    }

    async getDashboard() {
        const aiHealth = await SecureAIService.healthCheck();

        return {
            system: {
                status: this.isInitialized ? 'operational' : 'initializing',
                ai_services: aiHealth,
                active_workflows: this.activeWorkflows.size,
                timestamp: Date.now()
            },
            performance: await this.monitor.getDashboardData(),
            workflows: await this.getActiveWorkflows(),
            agents: this.getAgentStatus()
        };
    }

    async getActiveWorkflows() {
        const workflows = [];
        for (const [projectId] of this.workflow.activeWorkflows) {
            try {
                const status = await this.workflow.getWorkflowStatus(projectId);
                workflows.push(status);
            } catch (error) {
                console.error(`Error getting workflow status for ${projectId}:`, error);
            }
        }
        return workflows;
    }

    getAgentStatus() {
        const roles = Object.keys(this.roleSelector.roleCapabilities);
        return {
            total: roles.length,
            available: roles.length, // All agents are AI-powered, so always available
            roles: roles.map((role) => ({
                name: role,
                status: 'ready',
                capabilities: this.roleSelector.roleCapabilities[role].capabilities,
                priority: this.roleSelector.roleCapabilities[role].priority
            }))
        };
    }

    async handleHandoffCompleted(handoffData) {
        console.log('✅ Handoff completed:', handoffData.id);
        await this.monitor.recordMetric('handoff_completion', 1, {
            from: handoffData.from,
            to: handoffData.to,
            status: 'success'
        });
    }

    async handleHandoffTimeout(handoffData) {
        console.error('⏰ Handoff timeout:', handoffData.id);
        await this.monitor.recordMetric('handoff_timeout', 1, {
            from: handoffData.from,
            to: handoffData.to
        });
    }

    async handleMonitorAlert(alert) {
        console.warn('🚨 Monitor alert:', alert);
        this.emit('alert', alert);
    }

    // Quick start method for FlashFusion integration
    async quickStart(projectDescription, options = {}) {
        const projectId = options.projectId || `ff-${Date.now()}`;

        const request = {
            projectId,
            description: projectDescription,
            priority: options.priority || 5,
            context: {
                platform: options.platform || 'web',
                target_audience: options.targetAudience || 'general',
                budget: options.budget || 'medium',
                timeline: options.timeline || 'standard',
                ...options.context
            }
        };

        console.log(`🚀 FlashFusion Quick Start: ${projectDescription}`);
        return await this.processProductRequest(request);
    }
}

module.exports = DigitalProductOrchestrator;
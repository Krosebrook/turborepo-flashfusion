// =====================================================
// DYNAMIC ROLE SELECTOR - FlashFusion Integration
// AI-powered agent selection and load balancing
// =====================================================

const { SecureAIService } = require('../../server/services/ai');

class DynamicRoleSelector {
    constructor() {
        this.workloadTracker = new Map();
        this.roleCapabilities = this.initializeFlashFusionRoles();
    }

    initializeFlashFusionRoles() {
        return {
            visionary_strategist: {
                capabilities: [
                    'market_research',
                    'strategy',
                    'vision',
                    'roadmap',
                    'competitive_analysis'
                ],
                priority: 10,
                maxConcurrent: 2,
                description:
          'Defines strategic vision and market positioning for digital products'
            },
            product_manager: {
                capabilities: [
                    'backlog',
                    'coordination',
                    'stakeholder_mgmt',
                    'planning',
                    'user_stories'
                ],
                priority: 9,
                maxConcurrent: 5,
                description:
          'Coordinates product development and manages stakeholder requirements'
            },
            ux_designer: {
                capabilities: [
                    'user_research',
                    'wireframes',
                    'usability',
                    'journey_mapping',
                    'personas'
                ],
                priority: 8,
                maxConcurrent: 3,
                description:
          'Creates user-centered design experiences and research insights'
            },
            ui_designer: {
                capabilities: [
                    'visual_design',
                    'mockups',
                    'brand',
                    'assets',
                    'design_system'
                ],
                priority: 7,
                maxConcurrent: 3,
                description: 'Develops visual design language and interface components'
            },
            mobile_developer: {
                capabilities: [
                    'mobile_dev',
                    'frontend',
                    'performance',
                    'integrations',
                    'cross_platform'
                ],
                priority: 8,
                maxConcurrent: 4,
                description:
          'Builds mobile applications with optimal performance and user experience'
            },
            backend_developer: {
                capabilities: [
                    'api_dev',
                    'database',
                    'security',
                    'scalability',
                    'architecture'
                ],
                priority: 8,
                maxConcurrent: 4,
                description:
          'Develops server-side logic, APIs, and database architecture'
            },
            qa_engineer: {
                capabilities: [
                    'testing',
                    'automation',
                    'quality',
                    'regression',
                    'performance_testing'
                ],
                priority: 7,
                maxConcurrent: 3,
                description:
          'Ensures product quality through comprehensive testing strategies'
            },
            devops_engineer: {
                capabilities: [
                    'deployment',
                    'infrastructure',
                    'monitoring',
                    'cicd',
                    'scaling'
                ],
                priority: 8,
                maxConcurrent: 2,
                description:
          'Manages deployment, infrastructure, and operational reliability'
            },
            security_analyst: {
                capabilities: [
                    'security_audit',
                    'compliance',
                    'threat_modeling',
                    'privacy',
                    'penetration_testing'
                ],
                priority: 9,
                maxConcurrent: 2,
                description: 'Ensures security compliance and protects against threats'
            },
            marketing_growth: {
                capabilities: [
                    'campaigns',
                    'aso',
                    'growth',
                    'content',
                    'user_acquisition'
                ],
                priority: 6,
                maxConcurrent: 3,
                description:
          'Drives user acquisition and growth through strategic marketing'
            },
            business_analyst: {
                capabilities: [
                    'requirements',
                    'feasibility',
                    'process_modeling',
                    'stakeholder_analysis',
                    'roi_analysis'
                ],
                priority: 7,
                maxConcurrent: 2,
                description:
          'Analyzes business requirements and ensures project feasibility'
            }
        };
    }

    async analyzeRequest(request) {
        try {
            // Use FlashFusion's AI service to analyze the request
            const prompt = `
Analyze this digital product development request and determine which capabilities are needed.

Request: "${request.description}"
Context: ${JSON.stringify(request.context || {})}
Priority: ${request.priority || 5}/10

Available capabilities:
- market_research, strategy, vision, roadmap, competitive_analysis
- backlog, coordination, stakeholder_mgmt, planning, user_stories  
- user_research, wireframes, usability, journey_mapping, personas
- visual_design, mockups, brand, assets, design_system
- mobile_dev, frontend, performance, integrations, cross_platform
- api_dev, database, security, scalability, architecture
- testing, automation, quality, regression, performance_testing
- deployment, infrastructure, monitoring, cicd, scaling
- security_audit, compliance, threat_modeling, privacy, penetration_testing
- campaigns, aso, growth, content, user_acquisition
- requirements, feasibility, process_modeling, stakeholder_analysis, roi_analysis

Return a JSON object with:
{
  "capabilities": ["capability1", "capability2", ...],
  "urgency": 1-10,
  "complexity": "simple|medium|complex",
  "effort": estimated_hours,
  "dependencies": ["capability1->capability2", ...],
  "reasoning": "brief explanation"
}
`;

            const aiResponse = await SecureAIService.generateCompletion(
                prompt,
                null,
                {
                    maxTokens: 800,
                    temperature: 0.3
                }
            );

            // Parse AI response
            let analysis;
            try {
                // Extract JSON from AI response
                const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in AI response');
                }
            } catch (parseError) {
                console.warn(
                    'Failed to parse AI analysis, using fallback:',
                    parseError.message
                );
                analysis = this.createFallbackAnalysis(request);
            }

            // Validate and ensure required fields
            return {
                requiredCapabilities:
          analysis.capabilities ||
          this.extractCapabilitiesFromDescription(request.description),
                urgency: Math.max(
                    1,
                    Math.min(10, analysis.urgency || request.priority || 5)
                ),
                complexity: ['simple', 'medium', 'complex'].includes(
                    analysis.complexity
                )
                    ? analysis.complexity
                    : 'medium',
                estimatedEffort: Math.max(1, analysis.effort || 8),
                dependencies: analysis.dependencies || [],
                reasoning:
          analysis.reasoning ||
          'AI analysis unavailable, using pattern matching'
            };
        } catch (error) {
            console.error('Error analyzing request with AI:', error);
            return this.createFallbackAnalysis(request);
        }
    }

    createFallbackAnalysis(request) {
        const description = (request.description || '').toLowerCase();
        const capabilities = this.extractCapabilitiesFromDescription(description);

        return {
            requiredCapabilities: capabilities,
            urgency: request.priority || 5,
            complexity:
        capabilities.length > 5
            ? 'complex'
            : capabilities.length > 2
                ? 'medium'
                : 'simple',
            estimatedEffort: capabilities.length * 2,
            dependencies: [],
            reasoning: 'Fallback analysis based on keyword matching'
        };
    }

    extractCapabilitiesFromDescription(description) {
        const keywords = {
            strategy: ['strategy', 'vision', 'roadmap', 'market', 'business'],
            user_research: ['user', 'research', 'persona', 'ux', 'experience'],
            visual_design: ['design', 'ui', 'visual', 'brand', 'mockup'],
            mobile_dev: ['mobile', 'app', 'ios', 'android', 'react native'],
            api_dev: ['api', 'backend', 'server', 'database'],
            testing: ['test', 'qa', 'quality', 'automation'],
            deployment: ['deploy', 'infrastructure', 'devops', 'cicd'],
            security_audit: ['security', 'privacy', 'compliance', 'audit'],
            campaigns: ['marketing', 'growth', 'acquisition', 'campaign'],
            requirements: ['requirements', 'analysis', 'feasibility']
        };

        const capabilities = [];
        for (const [capability, words] of Object.entries(keywords)) {
            if (words.some((word) => description.includes(word))) {
                capabilities.push(capability);
            }
        }

        // Always include basic planning
        if (capabilities.length === 0) {
            capabilities.push('planning', 'requirements');
        }

        return capabilities;
    }

    selectOptimalAgents(requestAnalysis) {
        const selectedAgents = [];
        const requiredCapabilities = requestAnalysis.requiredCapabilities;

        for (const capability of requiredCapabilities) {
            const suitableRoles = this.findRolesWithCapability(capability);
            const bestRole = this.selectBestAvailableRole(
                suitableRoles,
                requestAnalysis
            );

            if (bestRole) {
                selectedAgents.push({
                    role: bestRole.name,
                    capability,
                    estimatedLoad: this.calculateLoad(bestRole, requestAnalysis),
                    priority: bestRole.config.priority,
                    description: bestRole.config.description
                });
            }
        }

        return this.optimizeAgentSelection(selectedAgents, requestAnalysis);
    }

    findRolesWithCapability(capability) {
        const suitableRoles = [];

        for (const [roleName, roleConfig] of Object.entries(
            this.roleCapabilities
        )) {
            if (roleConfig.capabilities.includes(capability)) {
                suitableRoles.push({
                    name: roleName,
                    config: roleConfig,
                    currentLoad: this.workloadTracker.get(roleName) || 0
                });
            }
        }

        return suitableRoles.sort((a, b) => {
            // Sort by priority and availability
            const priorityDiff = b.config.priority - a.config.priority;
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a.currentLoad - b.currentLoad;
        });
    }

    selectBestAvailableRole(suitableRoles, requestAnalysis) {
        for (const role of suitableRoles) {
            // For AI agents, we don't have hard concurrency limits
            // Instead, we prefer less loaded roles
            if (requestAnalysis.urgency > 8 && role.config.priority < 8) {
                continue; // Skip lower priority roles for urgent requests
            }
            return role;
        }

        // Return the highest priority role if no ideal match
        return suitableRoles[0] || null;
    }

    calculateLoad(role, requestAnalysis) {
        const baseLoad = requestAnalysis.estimatedEffort / 8; // Convert hours to load units
        const complexityMultiplier = {
            simple: 0.8,
            medium: 1.0,
            complex: 1.5
        };

        return baseLoad * (complexityMultiplier[requestAnalysis.complexity] || 1.0);
    }

    optimizeAgentSelection(selectedAgents, _requestAnalysis) {
    // Remove duplicates and optimize for parallel work
        const optimized = [];
        const usedRoles = new Set();

        for (const agent of selectedAgents) {
            if (!usedRoles.has(agent.role)) {
                optimized.push(agent);
                usedRoles.add(agent.role);

                // Update workload tracking for AI agents
                const currentLoad = this.workloadTracker.get(agent.role) || 0;
                this.workloadTracker.set(agent.role, currentLoad + agent.estimatedLoad);
            }
        }

        return optimized;
    }

    async updateWorkload(roleName, loadDelta) {
        const currentLoad = this.workloadTracker.get(roleName) || 0;
        const newLoad = Math.max(0, currentLoad + loadDelta);
        this.workloadTracker.set(roleName, newLoad);
    }

    getWorkloadStatus() {
        const status = {};
        for (const [roleName, roleConfig] of Object.entries(
            this.roleCapabilities
        )) {
            const currentLoad = this.workloadTracker.get(roleName) || 0;
            status[roleName] = {
                currentLoad,
                maxConcurrent: roleConfig.maxConcurrent,
                priority: roleConfig.priority,
                utilization: (currentLoad / roleConfig.maxConcurrent) * 100,
                available: currentLoad < roleConfig.maxConcurrent
            };
        }
        return status;
    }

    getAllRoles() {
        return Object.entries(this.roleCapabilities).map(([name, config]) => ({
            name,
            ...config,
            currentLoad: this.workloadTracker.get(name) || 0
        }));
    }
}

module.exports = DynamicRoleSelector;
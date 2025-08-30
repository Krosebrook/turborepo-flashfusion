const express = require('express');
const router = express.Router();
const {
    AgentPersonalitySystem
} = require('../services/AgentPersonalitySystem');
const logger = require('../../utils/logger');

// Initialize personality system
const personalitySystem = new AgentPersonalitySystem();

// Map agent tasks to personality roles
const taskToPersonality = {
    content_request: 'ux_designer',
    code_request: 'backend_developer',
    mobile_code: 'mobile_developer',
    automation: 'devops',
    security_analysis: 'security_analyst',
    ui_design: 'ui_designer',
    product_planning: 'product_manager',
    marketing_copy: 'marketing',
    testing: 'qa_engineer',
    requirements: 'business_analyst',
    vision: 'visionary'
};

// Enhanced agent configurations with personalities
const personalizedAgents = {
    writerbot: {
        model: 'anthropic/claude-3-opus',
        basePrompt:
      'You write emotionally intelligent copy and mental health content.',
        task: 'content_request',
        personality: 'ux_designer'
    },
    coderbot: {
        model: 'openai/gpt-4o',
        basePrompt: 'You are a full-stack developer skilled in modern frameworks.',
        task: 'code_request',
        personality: 'backend_developer'
    },
    mobilebot: {
        model: 'openai/gpt-4o',
        basePrompt: 'You are a mobile developer focused on iOS and Android.',
        task: 'mobile_code',
        personality: 'mobile_developer'
    },
    logicbot: {
        model: 'cohere/command-r-plus',
        basePrompt: 'You design automation workflows and CI/CD pipelines.',
        task: 'automation',
        personality: 'devops'
    },
    securitybot: {
        model: 'anthropic/claude-3-opus',
        basePrompt: 'You are a security expert focused on defensive practices.',
        task: 'security_analysis',
        personality: 'security_analyst'
    },
    designbot: {
        model: 'anthropic/claude-3-opus',
        basePrompt: 'You create beautiful, user-centric visual designs.',
        task: 'ui_design',
        personality: 'ui_designer'
    },
    productbot: {
        model: 'openai/gpt-4o',
        basePrompt: 'You manage product roadmaps and stakeholder alignment.',
        task: 'product_planning',
        personality: 'product_manager'
    },
    marketingbot: {
        model: 'anthropic/claude-3-opus',
        basePrompt: 'You create growth-focused marketing strategies.',
        task: 'marketing_copy',
        personality: 'marketing'
    },
    qabot: {
        model: 'openai/gpt-4o',
        basePrompt: 'You ensure quality through comprehensive testing.',
        task: 'testing',
        personality: 'qa_engineer'
    },
    analystbot: {
        model: 'cohere/command-r-plus',
        basePrompt: 'You translate business needs into clear requirements.',
        task: 'requirements',
        personality: 'business_analyst'
    },
    visionarybot: {
        model: 'anthropic/claude-3-opus',
        basePrompt: 'You dream big and inspire teams with future possibilities.',
        task: 'vision',
        personality: 'visionary'
    }
};

// Context tracking for emotional states
const agentContexts = new Map();

function getAgentContext(agentId) {
    if (!agentContexts.has(agentId)) {
        agentContexts.set(agentId, {
            workload: 0,
            timeline_pressure: 0,
            conflicts: 0,
            lastInteraction: Date.now(),
            interactions: 0
        });
    }
    return agentContexts.get(agentId);
}

function updateAgentContext(agentId, update) {
    const context = getAgentContext(agentId);
    Object.assign(context, update);
    context.lastInteraction = Date.now();
    context.interactions++;

    // Simulate workload increase
    context.workload = Math.min(1, context.workload + 0.1);

    // Workload decreases over time
    const timeSinceLastInteraction = Date.now() - context.lastInteraction;
    const hoursIdle = timeSinceLastInteraction / (1000 * 60 * 60);
    context.workload = Math.max(0, context.workload - hoursIdle * 0.1);

    agentContexts.set(agentId, context);
}

// 🎭 Personality-enhanced chat endpoint
router.post('/personality-chat', async (req, res) => {
    try {
        const { taskType, input, projectContext = {} } = req.body;

        // Find the appropriate agent
        const agent = Object.values(personalizedAgents).find(
            (a) => a.task === taskType
        );
        if (!agent) {
            return res.status(400).json({
                error: `Unknown task type: ${taskType}`,
                availableTasks: [
                    ...new Set(Object.values(personalizedAgents).map((a) => a.task))
                ]
            });
        }

        // Get agent context
        const agentContext = getAgentContext(agent.personality);

        // Merge with project context
        const fullContext = {
            ...agentContext,
            ...projectContext
        };

        // Generate personalized prompt
        personalitySystem.getPersonalizedPrompt(
            agent.personality,
            `${agent.basePrompt}\n\nUser request: ${input}`,
            fullContext
        );

        // Log personality state
        logger.info(
            `Agent ${
                agent.personality
            } responding with mood: ${personalitySystem.getEmotionalState(
                agent.personality,
                fullContext
            )}`
        );

        // Here you would call your AI service with the personalized prompt
        // For now, we'll simulate a response
        const simulatedResponse = `I understand you need help with: "${input}"\n\nAs a ${
            agent.personality
        }, I'll approach this with my ${
            personalitySystem.personalities[agent.personality].decision_bias
        } perspective.`;

        // Generate personalized response
        const finalResponse = personalitySystem.generateAgentResponse(
            agent.personality,
            simulatedResponse,
            fullContext
        );

        // Update context based on interaction
        updateAgentContext(agent.personality, {
            timeline_pressure: projectContext.deadline_approaching ? 0.8 : 0.3
        });

        res.json({
            success: true,
            agent: agent.personality,
            response: finalResponse,
            context: {
                emotionalState: personalitySystem.getEmotionalState(
                    agent.personality,
                    fullContext
                ),
                workload: fullContext.workload,
                interactions: fullContext.interactions
            }
        });
    } catch (error) {
        logger.error('Personality chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🤝 Check for personality conflicts
router.post('/check-conflicts', async (req, res) => {
    try {
        const { agent1, agent2 } = req.body;

        const conflict = personalitySystem.detectPersonalityClashes(agent1, agent2);
        const strategy = personalitySystem.suggestCollaborationStrategy(
            agent1,
            agent2
        );

        res.json({
            success: true,
            hasConflict: !!conflict,
            conflict,
            strategy
        });
    } catch (error) {
        logger.error('Conflict check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📊 Get all agent personalities and states
router.get('/personalities', async (req, res) => {
    try {
        const agentStates = {};

        for (const [agentId, agent] of Object.entries(personalizedAgents)) {
            const context = getAgentContext(agent.personality);
            agentStates[agentId] = {
                personality: agent.personality,
                traits: personalitySystem.personalities[agent.personality].traits,
                emotionalState: personalitySystem.getEmotionalState(
                    agent.personality,
                    context
                ),
                workload: context.workload,
                lastInteraction: context.lastInteraction,
                communicationStyle:
          personalitySystem.personalities[agent.personality]
              .communication_style
            };
        }

        res.json({
            success: true,
            agents: agentStates,
            personalities: personalitySystem.personalities
        });
    } catch (error) {
        logger.error('Get personalities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎯 Team dynamics analysis
router.post('/team-dynamics', async (req, res) => {
    try {
        const { teamMembers } = req.body;

        if (!Array.isArray(teamMembers) || teamMembers.length < 2) {
            return res.status(400).json({
                error: 'Please provide at least 2 team members'
            });
        }

        const conflicts = [];
        const collaborations = [];

        // Check all pairs for conflicts
        for (let i = 0; i < teamMembers.length; i++) {
            for (let j = i + 1; j < teamMembers.length; j++) {
                const member1 = teamMembers[i];
                const member2 = teamMembers[j];

                const conflict = personalitySystem.detectPersonalityClashes(
                    member1,
                    member2
                );
                const strategy = personalitySystem.suggestCollaborationStrategy(
                    member1,
                    member2
                );

                if (conflict) {
                    conflicts.push({
                        members: [member1, member2],
                        issue: conflict,
                        resolution: strategy
                    });
                } else {
                    collaborations.push({
                        members: [member1, member2],
                        strength: 'Natural collaboration'
                    });
                }
            }
        }

        res.json({
            success: true,
            teamSize: teamMembers.length,
            conflicts,
            collaborations,
            recommendation:
        conflicts.length > 0
            ? 'Consider involving a mediator for conflict resolution'
            : 'Team has good natural dynamics'
        });
    } catch (error) {
        logger.error('Team dynamics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎨 Get personality-based agent for a task
router.get('/recommend-agent/:task', async (req, res) => {
    try {
        const { task } = req.params;
        const personality = taskToPersonality[task];

        if (!personality) {
            return res.status(404).json({
                error: 'No agent found for this task',
                availableTasks: Object.keys(taskToPersonality)
            });
        }

        const agent = Object.entries(personalizedAgents).find(
            ([_, config]) => config.personality === personality
        );

        if (!agent) {
            return res.status(404).json({
                error: 'Agent configuration not found'
            });
        }

        const [agentId] = agent;
        const context = getAgentContext(personality);

        res.json({
            success: true,
            recommendation: {
                agentId,
                personality,
                traits: personalitySystem.personalities[personality].traits,
                currentMood: personalitySystem.getEmotionalState(personality, context),
                workload: context.workload,
                available: context.workload < 0.8
            }
        });
    } catch (error) {
        logger.error('Agent recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
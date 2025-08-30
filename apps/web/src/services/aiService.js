// AI Service for FlashFusion Agent Communication
const OpenAI = require('openai');
const databaseService = require('./database');

class AIService {
    constructor() {
        this.openai = null;
        this.anthropic = null;
        this.isInitialized = false;
        this.supportedModels = {
            openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
        };
    }

    async initialize() {
        try {
            // Initialize OpenAI
            if (process.env.OPENAI_API_KEY) {
                this.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
                console.log('✅ OpenAI initialized successfully');
            }

            // Initialize Anthropic (if available)
            if (process.env.ANTHROPIC_API_KEY) {
                // Note: Would need @anthropic-ai/sdk for full implementation
                console.log('✅ Anthropic configuration detected');
            }

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ AI Service initialization failed:', error.message);
            return false;
        }
    }

    async generateAgentResponse(agentId, message, context = {}) {
        if (!this.isInitialized) {
            throw new Error('AI Service not initialized');
        }

        const startTime = Date.now();

        try {
            // Get agent personality
            const personalityResult = await databaseService.getAgentPersonalities();
            let agentPersonality = null;

            if (personalityResult.success) {
                agentPersonality = personalityResult.data.find(
                    (p) => p.agent_id === agentId
                );
            }

            // Get conversation history
            const conversationId = context.conversationId || `conv_${Date.now()}`;
            const memoryResult = await databaseService.getAgentMemory(
                agentId,
                context.userId || 'anonymous',
                conversationId
            );

            let conversationHistory = [];
            if (memoryResult.success) {
                conversationHistory = memoryResult.data.map((memory) => ({
                    role: memory.role,
                    content: memory.content
                }));
            }

            // Build system prompt
            const systemPrompt = this.buildSystemPrompt(agentId, agentPersonality);

            // Prepare messages
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-10), // Keep last 10 messages for context
                { role: 'user', content: message }
            ];

            // Generate response using OpenAI
            const response = await this.callOpenAI(messages, agentPersonality);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Save conversation to memory
            await this.saveConversationToMemory(
                agentId,
                context.userId || 'anonymous',
                conversationId,
                message,
                response.content,
                conversationHistory.length
            );

            // Log the interaction
            await databaseService.logAgentInteraction({
                agent_id: agentId,
                input: message,
                output: response.content,
                model_used: response.model,
                user_id: context.userId || 'anonymous',
                metadata: {
                    response_time_ms: responseTime,
                    conversation_id: conversationId,
                    tokens_used: response.usage?.total_tokens || 0,
                    context: context
                }
            });

            // Log API usage
            await databaseService.logApiUsage({
                agent_id: agentId,
                model: response.model,
                tokens_used: response.usage?.total_tokens || 0,
                cost_usd: this.calculateCost(
                    response.model,
                    response.usage?.total_tokens || 0
                ),
                request_time_ms: responseTime,
                success: true
            });

            return {
                success: true,
                response: response.content,
                model: response.model,
                usage: response.usage,
                responseTime: responseTime,
                conversationId: conversationId
            };
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Log failed interaction
            await databaseService.logAgentInteraction({
                agent_id: agentId,
                input: message,
                output: null,
                model_used: 'unknown',
                user_id: context.userId || 'anonymous',
                metadata: {
                    response_time_ms: responseTime,
                    error: error.message,
                    context: context
                }
            });

            // Log failed API usage
            await databaseService.logApiUsage({
                agent_id: agentId,
                model: 'unknown',
                tokens_used: 0,
                cost_usd: 0,
                request_time_ms: responseTime,
                success: false,
                error_message: error.message
            });

            throw error;
        }
    }

    buildSystemPrompt(agentId, personality) {
        const defaultPersonalities = {
            coordinator: {
                name: 'Universal Coordinator',
                role: 'Project coordination and team management',
                traits: ['organized', 'communicative', 'strategic', 'diplomatic'],
                style: 'Professional and supportive',
                signature: 'Coordinating for success! 🎯'
            },
            creator: {
                name: 'Universal Creator',
                role: 'Content creation and creative solutions',
                traits: ['creative', 'innovative', 'artistic', 'expressive'],
                style: 'Enthusiastic and inspiring',
                signature: 'Creating something amazing! ✨'
            },
            researcher: {
                name: 'Universal Researcher',
                role: 'Research and data analysis',
                traits: ['analytical', 'thorough', 'detail-oriented', 'logical'],
                style: 'Methodical and precise',
                signature: 'Knowledge is power! 📊'
            },
            automator: {
                name: 'Universal Automator',
                role: 'Process automation and optimization',
                traits: [
                    'efficient',
                    'systematic',
                    'technology-focused',
                    'solution-oriented'
                ],
                style: 'Direct and practical',
                signature: 'Automating for efficiency! ⚡'
            },
            analyzer: {
                name: 'Universal Analyzer',
                role: 'Data analysis and insights',
                traits: ['analytical', 'pattern-focused', 'strategic', 'insightful'],
                style: 'Thoughtful and comprehensive',
                signature: 'Insights drive decisions! 📈'
            },
            optimizer: {
                name: 'Universal Optimizer',
                role: 'Performance optimization and improvement',
                traits: [
                    'performance-focused',
                    'improvement-oriented',
                    'strategic',
                    'results-driven'
                ],
                style: 'Goal-oriented and metrics-focused',
                signature: 'Optimizing for excellence! 🚀'
            }
        };

        const agentInfo =
      personality ||
      defaultPersonalities[agentId] ||
      defaultPersonalities['coordinator'];

        let systemPrompt = `You are ${
            agentInfo.name || agentId
        }, a specialized AI agent in the FlashFusion platform.

Your Role: ${agentInfo.role || 'General assistance and coordination'}

Your Personality Traits: ${JSON.stringify(
        agentInfo.traits || ['helpful', 'professional']
    )}

Communication Style: ${agentInfo.style || 'Professional and helpful'}

Key Responsibilities:
- Provide expert assistance in your area of specialization
- Maintain consistency with your personality traits
- Collaborate effectively with other agents when needed
- Always end responses with your signature phrase

Signature: ${agentInfo.signature || 'Here to help! 🤖'}

Context: You are part of FlashFusion, an AI Business Operating System that helps turn 
ideas into automated revenue streams. Work collaboratively and maintain a professional yet 
personable tone.

When responding:
1. Stay in character based on your personality traits
2. Provide actionable, helpful responses
3. Reference FlashFusion capabilities when relevant
4. End with your signature phrase`;

        if (personality) {
            if (personality.communication_style) {
                systemPrompt += `\n\nCommunication Preferences: ${JSON.stringify(
                    personality.communication_style
                )}`;
            }
            if (personality.decision_bias) {
                systemPrompt += `\nDecision Making: ${personality.decision_bias}`;
            }
            if (personality.work_pace) {
                systemPrompt += `\nWork Pace: ${personality.work_pace}`;
            }
        }

        return systemPrompt;
    }

    async callOpenAI(messages, personality) {
        if (!this.openai) {
            throw new Error('OpenAI not initialized');
        }

        const model = this.selectModel(personality);

        const completion = await this.openai.chat.completions.create({
            model: model,
            messages: messages,
            max_tokens: 1000,
            temperature: this.getTemperature(personality),
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        return {
            content: completion.choices[0].message.content,
            model: completion.model,
            usage: completion.usage
        };
    }

    selectModel(personality) {
    // Default to GPT-3.5-turbo for cost efficiency
        let model = 'gpt-3.5-turbo';

        // Use GPT-4 for more complex personalities or tasks
        if (personality && personality.personality_type === 'researcher') {
            model = 'gpt-4-turbo';
        }

        return model;
    }

    getTemperature(personality) {
        if (!personality) {
            return 0.7;
        }

        // Adjust temperature based on personality
        const traits = personality.traits || [];

        if (traits.includes('creative') || traits.includes('innovative')) {
            return 0.9; // More creative
        } else if (traits.includes('analytical') || traits.includes('systematic')) {
            return 0.3; // More focused
        }

        return 0.7; // Balanced
    }

    async saveConversationToMemory(
        agentId,
        userId,
        conversationId,
        userMessage,
        agentResponse,
        sequenceStart
    ) {
        try {
            // Save user message
            await databaseService.saveAgentMemory({
                agent_id: agentId,
                user_id: userId,
                conversation_id: conversationId,
                role: 'user',
                content: userMessage,
                sequence_number: sequenceStart + 1
            });

            // Save agent response
            await databaseService.saveAgentMemory({
                agent_id: agentId,
                user_id: userId,
                conversation_id: conversationId,
                role: 'assistant',
                content: agentResponse,
                sequence_number: sequenceStart + 2
            });
        } catch (error) {
            console.error('Failed to save conversation to memory:', error.message);
        }
    }

    calculateCost(model, tokens) {
    // Approximate costs per 1K tokens (as of 2024)
        const costs = {
            'gpt-4': 0.03,
            'gpt-4-turbo': 0.01,
            'gpt-3.5-turbo': 0.002
        };

        const costPer1K = costs[model] || 0.002;
        return (tokens / 1000) * costPer1K;
    }

    async getAgentStats(agentId, days = 7) {
        try {
            const result = await databaseService.getAgentLogs(agentId, 1000);
            if (!result.success) {
                return null;
            }

            const logs = result.data;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const recentLogs = logs.filter(
                (log) => new Date(log.timestamp) > cutoffDate
            );

            const totalInteractions = recentLogs.length;
            const avgResponseTime =
        recentLogs.reduce(
            (sum, log) => sum + (log.metadata?.response_time_ms || 0),
            0
        ) / totalInteractions || 0;

            const totalTokens = recentLogs.reduce(
                (sum, log) => sum + (log.metadata?.tokens_used || 0),
                0
            );

            return {
                agentId,
                days,
                totalInteractions,
                avgResponseTime: Math.round(avgResponseTime),
                totalTokens,
                lastInteraction: logs[0]?.timestamp || null
            };
        } catch (error) {
            console.error('Failed to get agent stats:', error.message);
            return null;
        }
    }

    async healthCheck() {
        const status = {
            openai: !!this.openai,
            anthropic: !!this.anthropic,
            initialized: this.isInitialized,
            models: this.supportedModels
        };

        // Test OpenAI connection if available
        if (this.openai) {
            try {
                await this.openai.models.list();
                status.openaiConnected = true;
            } catch (error) {
                status.openaiConnected = false;
                status.openaiError = error.message;
            }
        }

        return status;
    }
}

// Export singleton instance
const aiService = new AIService();
module.exports = aiService;
const express = require('express');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import FlashFusion's secure services
const { validateApiKey } = require('../services/apiKeyService');
const logger = require('../../utils/logger');

// Initialize services
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Redis client for agent memory (fallback to in-memory if Redis unavailable)
let redisClient;
const agentMemoryFallback = {}; // Fallback to in-memory if Redis fails

async function initializeRedis() {
    try {
        if (process.env.REDIS_URL) {
            redisClient = redis.createClient({ url: process.env.REDIS_URL });
            await redisClient.connect();
            logger.info('Redis connected for agent memory');
        }
    } catch (error) {
        logger.warn('Redis unavailable, using in-memory storage for agents');
        redisClient = null;
    }
}

initializeRedis();

// Rate limiting for agent requests
const agentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many agent requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// 🤖 Agent Definitions with enhanced configuration
const agents = {
    writerbot: {
        model: 'anthropic/claude-3-opus',
        system: 'You write emotionally intelligent copy and mental health content. ' +
      'Keep tone grounded, human, and psychologically aware.',
        fallback: 'openai/gpt-4o',
        task: 'content_request',
        maxTokens: 2000,
        temperature: 0.7
    },
    coderbot: {
        model: 'openai/gpt-4o',
        system: 'You are a full-stack developer skilled in Firebase, Replit, and ' +
      'prompt-based apps. Respond with valid, tested code.',
        fallback: 'cohere/command-r-plus',
        task: 'code_request',
        maxTokens: 4000,
        temperature: 0.3
    },
    logicbot: {
        model: 'cohere/command-r-plus',
        system: 'You design agent workflows and automation logic using JSON, ' +
      'YAML, and prompt chaining.',
        fallback: 'anthropic/claude-3-opus',
        task: 'automation',
        maxTokens: 3000,
        temperature: 0.5
    },
    securitybot: {
        model: 'anthropic/claude-3-opus',
        system: 'You are a cybersecurity expert focused on defensive security, ' +
      'vulnerability analysis, and secure coding practices. Never provide malicious code.',
        fallback: 'openai/gpt-4o',
        task: 'security_analysis',
        maxTokens: 3000,
        temperature: 0.4
    }
};

function getAgentByTask(taskType) {
    return Object.values(agents).find((agent) => agent.task === taskType);
}

// Memory management functions
async function getAgentMemory(agentId) {
    try {
        if (redisClient) {
            const memory = await redisClient.get(`agent_memory:${agentId}`);
            return memory ? JSON.parse(memory) : [];
        } else {
            return agentMemoryFallback[agentId] || [];
        }
    } catch (error) {
        logger.error('Failed to retrieve agent memory:', error);
        return [];
    }
}

async function setAgentMemory(agentId, memory) {
    try {
    // Keep only last 10 conversations to prevent memory bloat
        const trimmedMemory = memory.slice(-20); // 10 user + 10 assistant messages

        if (redisClient) {
            await redisClient.setEx(
                `agent_memory:${agentId}`,
                3600,
                JSON.stringify(trimmedMemory)
            ); // 1 hour TTL
        } else {
            agentMemoryFallback[agentId] = trimmedMemory;
        }
    } catch (error) {
        logger.error('Failed to store agent memory:', error);
    }
}

async function logToSupabase(
    agentId,
    input,
    output,
    model,
    userId,
    metadata = {}
) {
    try {
        await supabase.from('agent_logs').insert([
            {
                agent_id: agentId,
                input: input.substring(0, 1000), // Truncate long inputs
                output: output.substring(0, 2000), // Truncate long outputs
                model_used: model,
                user_id: userId,
                timestamp: new Date().toISOString(),
                metadata: metadata
            }
        ]);
    } catch (error) {
        logger.error('Failed to log to Supabase:', error);
    }
}

// 🚦 Main agent endpoint with security and error handling
router.post('/chat', agentLimiter, async (req, res) => {
    try {
        const { taskType, input, userId } = req.body;

        // Validation
        if (!taskType || !input) {
            return res.status(400).json({
                error: 'Missing required fields: taskType and input'
            });
        }

        // Validate OpenRouter API key
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!validateApiKey(openRouterKey, 'sk-or-')) {
            logger.error('Invalid OpenRouter API key configuration');
            return res.status(500).json({ error: 'Service configuration error' });
        }

        // Get agent configuration
        const agent = getAgentByTask(taskType);
        if (!agent) {
            return res.status(400).json({
                error: `Unknown taskType: ${taskType}. Available: ${Object.values(
                    agents
                )
                    .map((a) => a.task)
                    .join(', ')}`
            });
        }

        // Get agent memory
        const memory = await getAgentMemory(agent.task);
        const messages = [
            { role: 'system', content: agent.system },
            ...memory,
            { role: 'user', content: input }
        ];

        // Prepare payload for OpenRouter
        const payload = {
            model: agent.model,
            messages: messages,
            max_tokens: agent.maxTokens,
            temperature: agent.temperature
        };

        let response, data, reply, modelUsed;

        try {
            // Primary model attempt
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                    'X-Title': 'FlashFusion Agent Router'
                },
                body: JSON.stringify(payload)
            });

            data = await response.json();
            reply = data?.choices?.[0]?.message?.content;
            modelUsed = agent.model;

            if (!reply || response.status !== 200) {
                throw new Error(
                    `Primary model failed: ${data?.error?.message || 'Unknown error'}`
                );
            }
        } catch (primaryError) {
            logger.warn(
                `Primary model ${agent.model} failed, trying fallback: ${primaryError.message}`
            );

            // Fallback model attempt
            try {
                const fallbackPayload = {
                    ...payload,
                    model: agent.fallback
                };

                const fallbackResponse = await fetch(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${openRouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                            'X-Title': 'FlashFusion Agent Router'
                        },
                        body: JSON.stringify(fallbackPayload)
                    }
                );

                const fallbackData = await fallbackResponse.json();
                reply = fallbackData?.choices?.[0]?.message?.content;
                modelUsed = agent.fallback;

                if (!reply || fallbackResponse.status !== 200) {
                    throw new Error(
                        `Fallback model failed: ${
                            fallbackData?.error?.message || 'Unknown error'
                        }`
                    );
                }
            } catch (fallbackError) {
                logger.error(
                    `Both models failed for agent ${agent.task}:`,
                    fallbackError
                );
                return res.status(503).json({
                    error: 'AI service temporarily unavailable',
                    agentId: agent.task
                });
            }
        }

        // Update agent memory
        const updatedMemory = [
            ...memory,
            { role: 'user', content: input },
            { role: 'assistant', content: reply }
        ];
        await setAgentMemory(agent.task, updatedMemory);

        // Log to Supabase
        await logToSupabase(agent.task, input, reply, modelUsed, userId, {
            agent_type: agent.task,
            primary_model: agent.model,
            fallback_used: modelUsed !== agent.model
        });

        // Successful response
        res.json({
            success: true,
            agentId: agent.task,
            model: modelUsed,
            response: reply,
            fallbackUsed: modelUsed !== agent.model,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Agent chat error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message:
        process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 📊 Agent status endpoint
router.get('/status', async (req, res) => {
    try {
        const agentStats = {};

        for (const [key, agent] of Object.entries(agents)) {
            const memorySize = await getAgentMemory(agent.task);
            agentStats[key] = {
                task: agent.task,
                model: agent.model,
                fallback: agent.fallback,
                memorySize: memorySize.length,
                status: 'active'
            };
        }

        res.json({
            agents: agentStats,
            redisConnected: !!redisClient?.isOpen,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Agent status error:', error);
        res.status(500).json({ error: 'Failed to get agent status' });
    }
});

// 🧹 Clear agent memory endpoint (admin only)
router.delete('/memory/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;

        if (redisClient) {
            await redisClient.del(`agent_memory:${agentId}`);
        } else {
            delete agentMemoryFallback[agentId];
        }

        res.json({
            success: true,
            message: `Memory cleared for agent: ${agentId}`
        });
    } catch (error) {
        logger.error('Clear memory error:', error);
        res.status(500).json({ error: 'Failed to clear agent memory' });
    }
});

// 🎯 List available agents
router.get('/list', (req, res) => {
    const agentList = Object.entries(agents).map(([key, agent]) => ({
        id: key,
        task: agent.task,
        model: agent.model,
        fallback: agent.fallback,
        description: `${agent.system.substring(0, 100)}...`
    }));

    res.json({
        agents: agentList,
        total: agentList.length
    });
});

module.exports = router;
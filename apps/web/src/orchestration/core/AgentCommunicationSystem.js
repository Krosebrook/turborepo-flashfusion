// =====================================================
// AGENT COMMUNICATION SYSTEM - FlashFusion Integration
// Real-time handoff and messaging between AI agents
// =====================================================

const EventEmitter = require('events');
const crypto = require('crypto');

class AgentCommunicationSystem extends EventEmitter {
    constructor() {
        super();
        this.messageQueue = new Map();
        this.handoffTimeouts = new Map();
        this.activeHandoffs = new Map();
        this.redis = null; // Will initialize based on environment
    }

    async initialize() {
        try {
            // Try to connect to Redis if available, fallback to in-memory
            if (process.env.REDIS_URL) {
                const Redis = require('redis');
                this.redis = Redis.createClient(process.env.REDIS_URL);
                await this.redis.connect();
                console.log('📡 Connected to Redis for real-time communication');
            } else {
                console.log('📡 Using in-memory communication (Redis not configured)');
            }
        } catch (error) {
            console.warn(
                '⚠️  Redis connection failed, using in-memory fallback:',
                error.message
            );
            this.redis = null;
        }
    }

    async sendMessage(fromAgent, toAgent, message, priority = 'normal') {
        const messageId = crypto.randomUUID();
        const messageData = {
            id: messageId,
            from: fromAgent,
            to: toAgent,
            content: message,
            priority,
            timestamp: Date.now(),
            status: 'pending'
        };

        // Store in local memory
        this.messageQueue.set(messageId, messageData);

        // Store in Redis if available
        if (this.redis) {
            try {
                await this.redis.setEx(
                    `ff:message:${messageId}`,
                    3600,
                    JSON.stringify(messageData)
                );
                await this.redis.publish(
                    'ff:agent:messages',
                    JSON.stringify({
                        type: 'new_message',
                        agent: toAgent,
                        messageId
                    })
                );
            } catch (error) {
                console.warn('Redis message storage failed:', error.message);
            }
        }

        this.emit('message:sent', messageData);
        return messageId;
    }

    async initiateHandoff(fromAgent, toAgent, deliverables, timeout = 300000) {
        const handoffId = crypto.randomUUID();
        const handoffData = {
            id: handoffId,
            from: fromAgent,
            to: toAgent,
            deliverables,
            status: 'pending',
            timestamp: Date.now(),
            timeout
        };

        this.activeHandoffs.set(handoffId, handoffData);

        // Set timeout for handoff
        const timeoutId = setTimeout(() => {
            this.handleHandoffTimeout(handoffId);
        }, timeout);

        this.handoffTimeouts.set(handoffId, timeoutId);

        // Store in Redis if available
        if (this.redis) {
            try {
                await this.redis.setEx(
                    `ff:handoff:${handoffId}`,
                    3600,
                    JSON.stringify(handoffData)
                );
                await this.redis.publish(
                    'ff:agent:handoffs',
                    JSON.stringify({
                        type: 'handoff_request',
                        handoffId,
                        agent: toAgent
                    })
                );
            } catch (error) {
                console.warn('Redis handoff storage failed:', error.message);
            }
        }

        this.emit('handoff:initiated', handoffData);
        return handoffId;
    }

    async validateDeliverables(handoffId, receivedDeliverables) {
        const handoffData = this.activeHandoffs.get(handoffId);
        if (!handoffData) {
            throw new Error('Handoff not found');
        }

        const validation = {
            complete: true,
            missing: [],
            errors: []
        };

        // Check each required deliverable
        for (const required of handoffData.deliverables) {
            if (!receivedDeliverables[required.name]) {
                validation.complete = false;
                validation.missing.push(required.name);
            } else if (required.validator) {
                try {
                    const isValid = await required.validator(
                        receivedDeliverables[required.name]
                    );
                    if (!isValid) {
                        validation.complete = false;
                        validation.errors.push(`${required.name} failed validation`);
                    }
                } catch (error) {
                    validation.complete = false;
                    validation.errors.push(
                        `${required.name} validation error: ${error.message}`
                    );
                }
            }
        }

        return validation;
    }

    async completeHandoff(handoffId, deliverables) {
        const validation = await this.validateDeliverables(handoffId, deliverables);

        if (!validation.complete) {
            throw new Error(
                `Handoff validation failed: ${JSON.stringify(validation)}`
            );
        }

        // Clear timeout
        const timeoutId = this.handoffTimeouts.get(handoffId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.handoffTimeouts.delete(handoffId);
        }

        // Update handoff status
        const handoffData = this.activeHandoffs.get(handoffId);
        handoffData.status = 'completed';
        handoffData.completedAt = Date.now();
        handoffData.deliverables = deliverables;

        // Update in Redis if available
        if (this.redis) {
            try {
                await this.redis.setEx(
                    `ff:handoff:${handoffId}`,
                    86400,
                    JSON.stringify(handoffData)
                );
            } catch (error) {
                console.warn('Redis handoff update failed:', error.message);
            }
        }

        this.activeHandoffs.delete(handoffId);
        this.emit('handoff:completed', handoffData);
        return handoffData;
    }

    async handleHandoffTimeout(handoffId) {
        const handoffData = this.activeHandoffs.get(handoffId);
        if (!handoffData) {
            return;
        }

        handoffData.status = 'timeout';
        handoffData.timeoutAt = Date.now();

        this.emit('handoff:timeout', handoffData);

        // Clean up
        this.activeHandoffs.delete(handoffId);
        this.handoffTimeouts.delete(handoffId);
    }

    async getMessage(messageId) {
    // Try local cache first
        let message = this.messageQueue.get(messageId);

        // Try Redis if not in local cache
        if (!message && this.redis) {
            try {
                const stored = await this.redis.get(`ff:message:${messageId}`);
                if (stored) {
                    message = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('Redis message retrieval failed:', error.message);
            }
        }

        return message;
    }

    async getHandoff(handoffId) {
    // Try local cache first
        let handoff = this.activeHandoffs.get(handoffId);

        // Try Redis if not in local cache
        if (!handoff && this.redis) {
            try {
                const stored = await this.redis.get(`ff:handoff:${handoffId}`);
                if (stored) {
                    handoff = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('Redis handoff retrieval failed:', error.message);
            }
        }

        return handoff;
    }

    getStatus() {
        return {
            activeHandoffs: this.activeHandoffs.size,
            pendingMessages: this.messageQueue.size,
            redisConnected: !!this.redis,
            timestamp: Date.now()
        };
    }
}

module.exports = AgentCommunicationSystem;
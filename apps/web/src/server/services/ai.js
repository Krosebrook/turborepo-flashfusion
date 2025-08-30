// server/services/ai.js
// JavaScript version of SecureAIService for orchestration integration

/**
 * Secure AI Service that handles multiple providers without exposing key patterns
 */
class SecureAIService {
    static SUPPORTED_PROVIDERS = ['openai', 'anthropic'];

    /**
   * Initialize AI client based on API key provider
   */
    static async initializeAIClient(userApiKey) {
        try {
            // Use environment API key if no user key provided
            const apiKey = userApiKey || this.getDefaultApiKey();

            if (!apiKey) {
                throw new Error('No API key available');
            }

            // Basic validation - avoid hardcoded patterns
            if (typeof apiKey !== 'string' || apiKey.length < 20) {
                throw new Error('Invalid API key format');
            }

            // Determine provider from key prefix
            const provider = this.getProviderFromApiKey(apiKey);

            if (provider === 'unknown') {
                throw new Error('Unsupported API key provider');
            }

            // Initialize appropriate client based on provider
            return this.createClientForProvider(provider, apiKey);
        } catch (error) {
            console.error('AI client initialization failed:', error.message);
            throw new Error('Failed to initialize AI client');
        }
    }

    /**
   * Create AI client for specific provider
   */
    static createClientForProvider(provider, apiKey) {
        switch (provider) {
        case 'openai':
            return this.createOpenAIClient(apiKey);
        case 'anthropic':
            return this.createAnthropicClient(apiKey);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
   * Create OpenAI client
   */
    static createOpenAIClient(apiKey) {
        try {
            const { OpenAI } = require('openai');

            return new OpenAI({
                apiKey: apiKey,
                maxRetries: 3,
                timeout: 30000
            });
        } catch (error) {
            throw new Error(`OpenAI client creation failed: ${error.message}`);
        }
    }

    /**
   * Create Anthropic client
   */
    static createAnthropicClient(apiKey) {
        try {
            const { Anthropic } = require('@anthropic-ai/sdk');

            return new Anthropic({
                apiKey: apiKey,
                maxRetries: 3,
                timeout: 30000
            });
        } catch (error) {
            throw new Error(`Anthropic client creation failed: ${error.message}`);
        }
    }

    /**
   * Get default API key from environment based on priority
   */
    static getDefaultApiKey() {
    // Try Anthropic first (as per framework preference)
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey && !anthropicKey.includes('your_')) {
            return anthropicKey;
        }

        // Fallback to OpenAI
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey && !openaiKey.includes('your_')) {
            return openaiKey;
        }

        return null;
    }

    /**
   * Determine provider from API key without hardcoded patterns
   */
    static getProviderFromApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return 'unknown';
        }

        // Use environment-based prefixes to avoid hardcoding
        const openaiPrefix = process.env.OPENAI_KEY_PREFIX || 'sk-';
        const anthropicPrefix = process.env.ANTHROPIC_KEY_PREFIX || 'sk-ant-';

        if (apiKey.startsWith(anthropicPrefix)) {
            return 'anthropic';
        } else if (apiKey.startsWith(openaiPrefix)) {
            return 'openai';
        }

        return 'unknown';
    }

    /**
   * Generate AI completion with automatic provider detection
   */
    static async generateCompletion(prompt, userApiKey, options = {}) {
        try {
            const client = await this.initializeAIClient(userApiKey);
            const apiKey = userApiKey || this.getDefaultApiKey();
            const provider = this.getProviderFromApiKey(apiKey);

            switch (provider) {
            case 'openai':
                return this.generateOpenAICompletion(client, prompt, options);
            case 'anthropic':
                return this.generateAnthropicCompletion(client, prompt, options);
            default:
                throw new Error('Unable to determine AI provider');
            }
        } catch (error) {
            console.error('AI completion failed:', error.message);
            throw error;
        }
    }

    /**
   * Generate OpenAI completion
   */
    static async generateOpenAICompletion(client, prompt, options) {
        const response = await client.chat.completions.create({
            model: options.model || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        });

        return {
            content: response.choices[0]?.message?.content || '',
            provider: 'openai',
            model: response.model,
            usage: response.usage
        };
    }

    /**
   * Generate Anthropic completion
   */
    static async generateAnthropicCompletion(client, prompt, options) {
        const response = await client.messages.create({
            model: options.model || 'claude-3-sonnet-20240229',
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            messages: [{ role: 'user', content: prompt }]
        });

        return {
            content: response.content[0]?.text || '',
            provider: 'anthropic',
            model: response.model,
            usage: response.usage
        };
    }

    /**
   * Health check for AI service
   */
    static async healthCheck() {
        const results = {
            status: 'healthy',
            providers: {},
            errors: []
        };

        // Test each available provider
        for (const provider of this.SUPPORTED_PROVIDERS) {
            try {
                const apiKey = this.getApiKeyForProvider(provider);
                if (apiKey) {
                    // Basic key validation without actual API call to save quota
                    const isValidFormat = this.validateKeyFormat(apiKey, provider);
                    results.providers[provider] = isValidFormat;
                    if (!isValidFormat) {
                        results.errors.push(`${provider}: Invalid key format`);
                    }
                } else {
                    results.providers[provider] = false;
                    results.errors.push(`${provider}: No API key configured`);
                }
            } catch (error) {
                results.providers[provider] = false;
                results.errors.push(`${provider}: ${error.message}`);
            }
        }

        // Determine overall status
        const healthyProviders = Object.values(results.providers).filter(
            Boolean
        ).length;
        if (healthyProviders === 0) {
            results.status = 'unhealthy';
        } else if (healthyProviders < this.SUPPORTED_PROVIDERS.length) {
            results.status = 'degraded';
        }

        return results;
    }

    /**
   * Get API key for specific provider
   */
    static getApiKeyForProvider(provider) {
        switch (provider) {
        case 'openai': {
            const openaiKey = process.env.OPENAI_API_KEY;
            return openaiKey && !openaiKey.includes('your_') ? openaiKey : null;
        }
        case 'anthropic': {
            const anthropicKey = process.env.ANTHROPIC_API_KEY;
            return anthropicKey && !anthropicKey.includes('your_')
                ? anthropicKey
                : null;
        }
        default:
            return null;
        }
    }

    /**
   * Validate key format for provider
   */
    static validateKeyFormat(apiKey, provider) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        const minLength = parseInt(process.env.MIN_API_KEY_LENGTH || '20');
        const maxLength = parseInt(process.env.MAX_API_KEY_LENGTH || '200');

        if (apiKey.length < minLength || apiKey.length > maxLength) {
            return false;
        }

        const detectedProvider = this.getProviderFromApiKey(apiKey);
        return detectedProvider === provider;
    }
}

module.exports = { SecureAIService };
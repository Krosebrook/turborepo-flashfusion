// server/services/ai.ts
// Secure implementation that avoids hardcoded API key patterns

import { SecureApiKeyService, type ApiKeyValidation } from './apiKeyService';

/**
 * Secure AI Service that handles multiple providers without exposing key patterns
 */
export class SecureAIService {
    private static readonly SUPPORTED_PROVIDERS = [
        'openai',
        'anthropic'
    ] as const;

    /**
   * Initialize AI client based on API key provider
   */
    public static async initializeAIClient(userApiKey?: string) {
        try {
            // Use environment API key if no user key provided
            const apiKey = userApiKey || this.getDefaultApiKey();

            if (!apiKey) {
                throw new Error('No API key available');
            }

            // Validate the API key securely
            const validation = SecureApiKeyService.validateApiKey(apiKey);

            if (!validation.isValid) {
                console.error('Invalid API key:', validation.error);
                throw new Error(`Invalid API key: ${validation.error}`);
            }

            // Initialize appropriate client based on validated provider
            return this.createClientForProvider(validation.provider, apiKey);
        } catch (error) {
            console.error('AI client initialization failed:', error);
            throw new Error('Failed to initialize AI client');
        }
    }

    /**
   * Create AI client for specific provider
   */
    private static createClientForProvider(
        provider: 'openai' | 'anthropic',
        apiKey: string
    ) {
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
    private static createOpenAIClient(apiKey: string) {
    // Import OpenAI dynamically to avoid loading if not needed
        const { OpenAI } = require('openai');

        return new OpenAI({
            apiKey: apiKey,
            maxRetries: 3,
            timeout: 30000
        });
    }

    /**
   * Create Anthropic client
   */
    private static createAnthropicClient(apiKey: string) {
    // Import Anthropic dynamically to avoid loading if not needed
        const { Anthropic } = require('@anthropic-ai/sdk');

        return new Anthropic({
            apiKey: apiKey,
            maxRetries: 3,
            timeout: 30000
        });
    }

    /**
   * Get default API key from environment based on priority
   */
    private static getDefaultApiKey(): string | null {
    // Try Anthropic first (as per your framework preference)
        const anthropicKey = SecureApiKeyService.getApiKeyFromEnv('anthropic');
        if (anthropicKey) {
            return anthropicKey;
        }

        // Fallback to OpenAI
        const openaiKey = SecureApiKeyService.getApiKeyFromEnv('openai');
        if (openaiKey) {
            return openaiKey;
        }

        return null;
    }

    /**
   * Determine provider from API key without hardcoded patterns
   */
    public static getProviderFromApiKey(
        apiKey: string
    ): 'openai' | 'anthropic' | 'unknown' {
        const validation = SecureApiKeyService.validateApiKey(apiKey);
        return validation.provider;
    }

    /**
   * Generate AI completion with automatic provider detection
   */
    public static async generateCompletion(
        prompt: string,
        userApiKey?: string,
        options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
    ) {
        try {
            const client = await this.initializeAIClient(userApiKey);
            const provider = this.getProviderFromApiKey(
                userApiKey || this.getDefaultApiKey() || ''
            );

            switch (provider) {
            case 'openai':
                return this.generateOpenAICompletion(client, prompt, options);
            case 'anthropic':
                return this.generateAnthropicCompletion(client, prompt, options);
            default:
                throw new Error('Unable to determine AI provider');
            }
        } catch (error) {
            console.error('AI completion failed:', error);
            throw error;
        }
    }

    /**
   * Generate OpenAI completion
   */
    private static async generateOpenAICompletion(
        client: any,
        prompt: string,
        options: any
    ) {
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
    private static async generateAnthropicCompletion(
        client: any,
        prompt: string,
        options: any
    ) {
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
   * Validate system configuration
   */
    public static validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    availableProviders: string[];
    } {
        const errors: string[] = [];
        const availableProviders: string[] = [];

        // Check if environment is properly configured
        if (!SecureApiKeyService.validateEnvironmentConfig()) {
            errors.push('Environment configuration invalid');
        }

        // Check available providers
        for (const provider of this.SUPPORTED_PROVIDERS) {
            const apiKey = SecureApiKeyService.getApiKeyFromEnv(provider);
            if (apiKey) {
                availableProviders.push(provider);
            }
        }

        if (availableProviders.length === 0) {
            errors.push('No valid API keys configured');
        }

        return {
            isValid: errors.length === 0,
            errors,
            availableProviders
        };
    }

    /**
   * Health check for AI service
   */
    public static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: Record<string, boolean>;
    errors: string[];
  }> {
        const results = {
            status: 'healthy' as const,
            providers: {} as Record<string, boolean>,
            errors: [] as string[]
        };

        // Test each available provider
        for (const provider of this.SUPPORTED_PROVIDERS) {
            try {
                const apiKey = SecureApiKeyService.getApiKeyFromEnv(provider);
                if (apiKey) {
                    const client = await this.initializeAIClient(apiKey);
                    results.providers[provider] = true;
                } else {
                    results.providers[provider] = false;
                }
            } catch (error) {
                results.providers[provider] = false;
                results.errors.push(
                    `${provider}: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`
                );
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
}

// Export legacy functions for backward compatibility
export async function initializeAI(userApiKey?: string) {
    return SecureAIService.initializeAIClient(userApiKey);
}

export function getAIProvider(apiKey: string) {
    return SecureAIService.getProviderFromApiKey(apiKey);
}

// Export the main service as default
export default SecureAIService;
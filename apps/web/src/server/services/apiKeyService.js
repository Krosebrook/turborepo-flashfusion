// server/services/apiKeyService.js
// JavaScript version of SecureApiKeyService

/**
 * Secure API key validation service
 */
class SecureApiKeyService {
    static KEY_CONFIGS = {
        openai: {
            prefix: process.env.OPENAI_KEY_PREFIX || 'sk-',
            minLength: parseInt(process.env.MIN_API_KEY_LENGTH || '20'),
            maxLength: parseInt(process.env.MAX_API_KEY_LENGTH || '200'),
            name: 'OpenAI'
        },
        anthropic: {
            prefix: process.env.ANTHROPIC_KEY_PREFIX || 'sk-ant-',
            minLength: parseInt(process.env.MIN_API_KEY_LENGTH || '20') + 4,
            maxLength: parseInt(process.env.MAX_API_KEY_LENGTH || '200'),
            name: 'Anthropic'
        }
    };

    /**
   * Validate API key format and determine provider
   */
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return {
                isValid: false,
                provider: 'unknown',
                error: 'API key is required and must be a string'
            };
        }

        // Check against each provider
        for (const [providerName, config] of Object.entries(this.KEY_CONFIGS)) {
            if (apiKey.startsWith(config.prefix)) {
                if (
                    apiKey.length >= config.minLength &&
          apiKey.length <= config.maxLength
                ) {
                    return {
                        isValid: true,
                        provider: providerName,
                        error: null
                    };
                } else {
                    return {
                        isValid: false,
                        provider: providerName,
                        error: `Invalid ${config.name} key length`
                    };
                }
            }
        }

        return {
            isValid: false,
            provider: 'unknown',
            error: 'Unrecognized API key format'
        };
    }

    /**
   * Get API key from environment for specified provider
   */
    static getApiKeyFromEnv(provider) {
        switch (provider.toLowerCase()) {
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
   * Validate environment configuration
   */
    static validateEnvironmentConfig() {
        try {
            // Check if required environment variables are set
            const requiredVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
            let hasValidKey = false;

            for (const varName of requiredVars) {
                const value = process.env[varName];
                if (value && !value.includes('your_')) {
                    hasValidKey = true;
                    break;
                }
            }

            return hasValidKey;
        } catch (error) {
            console.error('Environment validation failed:', error);
            return false;
        }
    }

    /**
   * Get all configured providers
   */
    static getConfiguredProviders() {
        const providers = [];

        for (const [providerName] of Object.entries(this.KEY_CONFIGS)) {
            const apiKey = this.getApiKeyFromEnv(providerName);
            if (apiKey) {
                providers.push(providerName);
            }
        }

        return providers;
    }

    /**
   * Mask API key for logging (show only first 8 and last 4 characters)
   */
    static maskApiKey(apiKey) {
        if (!apiKey || apiKey.length < 12) {
            return '***masked***';
        }

        const start = apiKey.substring(0, 8);
        const end = apiKey.substring(apiKey.length - 4);
        return `${start}...${end}`;
    }

    /**
   * Check if API key appears to be a placeholder
   */
    static isPlaceholderKey(apiKey) {
        if (!apiKey) {
            return true;
        }

        const placeholderPatterns = [
            'your_',
            'placeholder',
            'example',
            'test_key',
            'demo_key',
            'sk-1234567890abcdef'
        ];

        return placeholderPatterns.some((pattern) =>
            apiKey.toLowerCase().includes(pattern.toLowerCase())
        );
    }
}

module.exports = { SecureApiKeyService };
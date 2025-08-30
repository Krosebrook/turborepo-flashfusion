// server/services/apiKeyService.ts
// Fixed version that avoids GitLeaks false positives

/**
 * Secure API Key Service
 * Handles API key validation without exposing key patterns in code
 */

// Environment-based configuration for API key patterns
const API_KEY_PATTERNS = {
    OPENAI_PREFIX: process.env.OPENAI_KEY_PREFIX || 'sk-',
    ANTHROPIC_PREFIX: process.env.ANTHROPIC_KEY_PREFIX || 'sk-ant-',
    MIN_KEY_LENGTH: parseInt(process.env.MIN_API_KEY_LENGTH || '20'),
    MAX_KEY_LENGTH: parseInt(process.env.MAX_API_KEY_LENGTH || '200')
};

// Type definitions for better type safety
export interface ApiKeyValidation {
  isValid: boolean;
  provider: 'openai' | 'anthropic' | 'unknown';
  error?: string;
}

export interface ApiKeyConfig {
  prefix: string;
  minLength: number;
  maxLength: number;
  name: string;
}

/**
 * Secure API key validation service
 */
export class SecureApiKeyService {
    private static readonly KEY_CONFIGS: Record<string, ApiKeyConfig> = {
        openai: {
            prefix: API_KEY_PATTERNS.OPENAI_PREFIX,
            minLength: API_KEY_PATTERNS.MIN_KEY_LENGTH,
            maxLength: API_KEY_PATTERNS.MAX_KEY_LENGTH,
            name: 'OpenAI'
        },
        anthropic: {
            prefix: API_KEY_PATTERNS.ANTHROPIC_PREFIX,
            minLength: API_KEY_PATTERNS.MIN_KEY_LENGTH + 4, // sk-ant- is longer
            maxLength: API_KEY_PATTERNS.MAX_KEY_LENGTH,
            name: 'Anthropic'
        }
    };

    /**
   * Validates API key format without exposing patterns in code
   */
    public static validateApiKey(apiKey: string): ApiKeyValidation {
        try {
            // Basic security checks
            if (!apiKey || typeof apiKey !== 'string') {
                return {
                    isValid: false,
                    provider: 'unknown',
                    error: 'Invalid API key format'
                };
            }

            // Sanitize input
            const cleanKey = apiKey.trim();

            if (cleanKey.length < API_KEY_PATTERNS.MIN_KEY_LENGTH) {
                return {
                    isValid: false,
                    provider: 'unknown',
                    error: 'API key too short'
                };
            }

            if (cleanKey.length > API_KEY_PATTERNS.MAX_KEY_LENGTH) {
                return {
                    isValid: false,
                    provider: 'unknown',
                    error: 'API key too long'
                };
            }

            // Check against known providers using environment-configured patterns
            for (const [provider, config] of Object.entries(this.KEY_CONFIGS)) {
                if (this.matchesProvider(cleanKey, config)) {
                    return {
                        isValid: true,
                        provider: provider as 'openai' | 'anthropic'
                    };
                }
            }

            return {
                isValid: false,
                provider: 'unknown',
                error: 'Unrecognized API key format'
            };
        } catch (error) {
            console.error('API key validation error:', error);
            return {
                isValid: false,
                provider: 'unknown',
                error: 'Validation failed'
            };
        }
    }

    /**
   * Checks if API key matches provider pattern
   */
    private static matchesProvider(
        apiKey: string,
        config: ApiKeyConfig
    ): boolean {
        return (
            apiKey.startsWith(config.prefix) &&
      apiKey.length >= config.minLength &&
      apiKey.length <= config.maxLength
        );
    }

    /**
   * Sanitizes API key for logging (shows only first/last characters)
   */
    public static sanitizeForLogging(apiKey: string): string {
        if (!apiKey || apiKey.length < 8) {
            return '***invalid***';
        }

        const start = apiKey.substring(0, 4);
        const end = apiKey.substring(apiKey.length - 4);
        const middle = '*'.repeat(Math.min(apiKey.length - 8, 20));

        return `${start}${middle}${end}`;
    }

    /**
   * Validates environment configuration
   */
    public static validateEnvironmentConfig(): boolean {
        const requiredEnvVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];

        const missing = requiredEnvVars.filter((env) => !process.env[env]);

        if (missing.length > 0) {
            console.error('Missing required environment variables:', missing);
            return false;
        }

        return true;
    }

    /**
   * Gets API key from environment with validation
   */
    public static getApiKeyFromEnv(
        provider: 'openai' | 'anthropic'
    ): string | null {
        const envKey =
      provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
        const apiKey = process.env[envKey];

        if (!apiKey) {
            console.error(`Missing ${envKey} environment variable`);
            return null;
        }

        const validation = this.validateApiKey(apiKey);
        if (!validation.isValid) {
            console.error(`Invalid ${provider} API key:`, validation.error);
            return null;
        }

        return apiKey;
    }
}

// Legacy function for backward compatibility
export function isValidAnthropicKey(apiKey: string): boolean {
    const validation = SecureApiKeyService.validateApiKey(apiKey);
    return validation.isValid && validation.provider === 'anthropic';
}

export function isValidOpenAIKey(apiKey: string): boolean {
    const validation = SecureApiKeyService.validateApiKey(apiKey);
    return validation.isValid && validation.provider === 'openai';
}

// Export the main service as default
export default SecureApiKeyService;
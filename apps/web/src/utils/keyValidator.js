/**
 * Key Validator for FlashFusion
 * Validates API keys and credentials at runtime
 */

class KeyValidator {
    constructor() {
        this.validators = {
            OPENAI_API_KEY: {
                pattern: /^sk-[A-Za-z0-9]{32,}$/,
                message:
          'OpenAI key should start with "sk-" followed by alphanumeric characters'
            },
            ANTHROPIC_API_KEY: {
                pattern: /^sk-ant-api\d{2}-[A-Za-z0-9\-_]{32,}$/,
                message:
          'Anthropic key should start with "sk-ant-api" followed by version and key'
            },
            SUPABASE_URL: {
                pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
                message: 'Supabase URL should be https://[project].supabase.co'
            },
            SUPABASE_ANON_KEY: {
                pattern: /^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/,
                message: 'Supabase key should be a valid JWT token'
            },
            GITHUB_TOKEN: {
                pattern:
          /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59})$/,
                message: 'GitHub token should start with "ghp_" or "github_pat_"'
            },
            VERCEL_TOKEN: {
                pattern: /^[A-Za-z0-9]{24}$/,
                message: 'Vercel token should be 24 alphanumeric characters'
            },
            JWT_SECRET: {
                pattern: /^.{32,}$/,
                message: 'JWT secret should be at least 32 characters long'
            }
        };

        this.criticalKeys = [
            'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY'
        ];
    }

    /**
   * Validate a single key
   */
    validateKey(keyName, value) {
    // Check if key is empty or placeholder
        if (!value || value.includes('your_') || value.includes('_here')) {
            return {
                valid: false,
                error: `${keyName} is not configured (placeholder value detected)`
            };
        }

        // Check against specific validator if exists
        const validator = this.validators[keyName];
        if (validator && !validator.pattern.test(value)) {
            return {
                valid: false,
                error: `${keyName}: ${validator.message}`
            };
        }

        return { valid: true };
    }

    /**
   * Validate all environment variables
   */
    validateEnvironment(env = process.env) {
        const results = {
            valid: true,
            errors: [],
            warnings: [],
            validated: {},
            missing: []
        };

        // Check critical keys
        for (const key of this.criticalKeys) {
            if (!env[key]) {
                results.valid = false;
                results.missing.push(key);
                results.errors.push(`Missing critical key: ${key}`);
            } else {
                const validation = this.validateKey(key, env[key]);
                results.validated[key] = validation.valid;

                if (!validation.valid) {
                    results.valid = false;
                    results.errors.push(validation.error);
                }
            }
        }

        // Check optional keys
        for (const key in this.validators) {
            if (!this.criticalKeys.includes(key) && env[key]) {
                const validation = this.validateKey(key, env[key]);
                results.validated[key] = validation.valid;

                if (!validation.valid) {
                    results.warnings.push(validation.error);
                }
            }
        }

        return results;
    }

    /**
   * Mask sensitive key for logging
   */
    maskKey(value) {
        if (!value) {
            return 'not-set';
        }
        if (value.length <= 8) {
            return '***';
        }
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    /**
   * Check if keys need rotation (based on age)
   */
    checkRotationNeeded(lastRotationDate) {
        if (!lastRotationDate) {
            return true;
        }

        const daysSinceRotation = Math.floor(
            (Date.now() - new Date(lastRotationDate).getTime()) /
        (1000 * 60 * 60 * 24)
        );

        return daysSinceRotation > 30; // Recommend rotation every 30 days
    }

    /**
   * Generate validation report
   */
    generateReport(env = process.env) {
        const validation = this.validateEnvironment(env);
        const report = [];

        report.push('=== API Key Validation Report ===\n');

        if (validation.valid) {
            report.push('✅ All critical keys are valid\n');
        } else {
            report.push('❌ Critical validation errors found\n');
        }

        if (validation.missing.length > 0) {
            report.push('\n🚫 Missing Keys:');
            validation.missing.forEach((key) => {
                report.push(`   - ${key}`);
            });
        }

        if (validation.errors.length > 0) {
            report.push('\n❌ Errors:');
            validation.errors.forEach((error) => {
                report.push(`   - ${error}`);
            });
        }

        if (validation.warnings.length > 0) {
            report.push('\n⚠️  Warnings:');
            validation.warnings.forEach((warning) => {
                report.push(`   - ${warning}`);
            });
        }

        report.push('\n📊 Key Status:');
        Object.entries(validation.validated).forEach(([key, valid]) => {
            const status = valid ? '✅' : '❌';
            const masked = this.maskKey(env[key]);
            report.push(`   ${status} ${key}: ${masked}`);
        });

        return report.join('\n');
    }

    /**
   * Validate keys for specific service
   */
    async validateService(serviceName, config) {
        const results = {
            service: serviceName,
            keysValid: true,
            errors: []
        };

        const requiredKeys = config.requiredKeys || [];

        for (const key of requiredKeys) {
            const validation = this.validateKey(key, process.env[key]);
            if (!validation.valid) {
                results.keysValid = false;
                results.errors.push(validation.error);
            }
        }

        return results;
    }
}

module.exports = KeyValidator;
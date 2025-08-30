const ErrorHandler = require('./errorHandler');
const logger = require('./logger');

class ConfigManager {
    constructor() {
        this.config = new Map();
        this.validators = new Map();
        this.loaded = false;
    }

    load() {
        if (this.loaded) {return this.config;}

        try {
            // Core configuration
            this.setConfig('app', {
                name: process.env.APP_NAME || 'FlashFusion-Unified',
                version: process.env.APP_VERSION || '2.0.0',
                environment: process.env.NODE_ENV || 'development',
                port: parseInt(process.env.PORT || '3000'),
                host: process.env.HOST || 'localhost'
            });

            // Database configuration
            this.setConfig('database', {
                type: this.determineDatabaseType(),
                supabase: {
                    url: process.env.SUPABASE_URL,
                    anonKey: process.env.SUPABASE_ANON_KEY,
                    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
                },
                postgresql: {
                    url: process.env.DATABASE_URL || process.env.POSTGRES_URL,
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT || '5432'),
                    database: process.env.DB_NAME,
                    username: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    ssl: process.env.DB_SSL === 'true'
                }
            });

            // AI services configuration
            this.setConfig('ai', {
                anthropic: {
                    apiKey: process.env.ANTHROPIC_API_KEY,
                    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus',
                    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000')
                },
                openai: {
                    apiKey: process.env.OPENAI_API_KEY,
                    model: process.env.OPENAI_MODEL || 'gpt-4',
                    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000')
                }
            });

            // Security configuration
            this.setConfig('security', {
                jwtSecret: process.env.JWT_SECRET,
                jwtExpiry: process.env.JWT_EXPIRY || '24h',
                rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
                rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
                corsOrigins: this.parseCorsOrigins(),
                apiKeyValidation: {
                    minLength: parseInt(process.env.MIN_API_KEY_LENGTH || '20'),
                    maxLength: parseInt(process.env.MAX_API_KEY_LENGTH || '200')
                }
            });

            // Integration configuration
            this.setConfig('integrations', {
                notion: {
                    apiKey: process.env.NOTION_API_KEY,
                    databaseId: process.env.NOTION_DATABASE_ID
                },
                zapier: {
                    webhookUrl: process.env.ZAPIER_WEBHOOK_URL,
                    apiKey: process.env.ZAPIER_API_KEY
                },
                vercel: {
                    token: process.env.VERCEL_TOKEN,
                    projectId: process.env.VERCEL_PROJECT_ID
                }
            });

            // Logging configuration
            this.setConfig('logging', {
                level: process.env.LOG_LEVEL || 'info',
                file: process.env.LOG_FILE || 'logs/combined.log',
                maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
                maxSize: process.env.LOG_MAX_SIZE || '10m'
            });

            this.loaded = true;
            logger.info('Configuration loaded successfully');

        } catch (error) {
            logger.error('Failed to load configuration:', error);
            throw ErrorHandler.createApiError('Configuration loading failed', 500, 'CONFIG_ERROR');
        }

        return this.config;
    }

    setConfig(key, value) {
        this.config.set(key, value);
    }

    getConfig(key, defaultValue = null) {
        const value = this.config.get(key);
        return value !== undefined ? value : defaultValue;
    }

    get(keyPath, defaultValue = null) {
        const keys = keyPath.split('.');
        let value = this.config.get(keys[0]);

        for (let i = 1; i < keys.length && value; i++) {
            value = value[keys[i]];
        }

        return value !== undefined ? value : defaultValue;
    }

    validate() {
        const errors = [];

        // Validate required configurations
        const requiredConfigs = [
            'app.environment',
            'app.port'
        ];

        for (const configPath of requiredConfigs) {
            if (!this.get(configPath)) {
                errors.push(`Missing required configuration: ${configPath}`);
            }
        }

        // Validate AI service configuration
        const hasAnthropicKey = this.get('ai.anthropic.apiKey');
        const hasOpenAIKey = this.get('ai.openai.apiKey');

        if (!hasAnthropicKey && !hasOpenAIKey) {
            errors.push('At least one AI service API key must be configured');
        }

        // Validate database configuration
        const dbType = this.get('database.type');
        if (dbType === 'supabase') {
            if (!this.get('database.supabase.url') || !this.get('database.supabase.anonKey')) {
                errors.push('Supabase URL and anonymous key are required');
            }
        } else if (dbType === 'postgresql') {
            if (!this.get('database.postgresql.url') && !this.get('database.postgresql.host')) {
                errors.push('PostgreSQL connection URL or host configuration required');
            }
        }

        if (errors.length > 0) {
            throw ErrorHandler.createApiError(
                `Configuration validation failed: ${errors.join(', ')}`,
                500,
                'CONFIG_VALIDATION_ERROR'
            );
        }

        logger.info('Configuration validation passed');
        return true;
    }

    determineDatabaseType() {
        const hasPostgreSQL = process.env.POSTGRES_URL ||
                             process.env.DATABASE_URL ||
                             process.env.DB_HOST;
        const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

        if (hasPostgreSQL) {
            return 'postgresql';
        } else if (hasSupabase) {
            return 'supabase';
        } else {
            return 'none';
        }
    }

    parseCorsOrigins() {
        const origins = process.env.ALLOWED_ORIGINS;
        if (!origins) {
            return ['http://localhost:3000', 'http://localhost:3001'];
        }

        try {
            return JSON.parse(origins);
        } catch {
            return origins.split(',').map(origin => origin.trim());
        }
    }

    isDevelopment() {
        return this.get('app.environment') === 'development';
    }

    isProduction() {
        return this.get('app.environment') === 'production';
    }

    isTest() {
        return this.get('app.environment') === 'test';
    }

    getConnectionString(dbType = null) {
        const type = dbType || this.get('database.type');

        if (type === 'postgresql') {
            return this.get('database.postgresql.url') || this.buildPostgreSQLConnectionString();
        }

        return null;
    }

    buildPostgreSQLConnectionString() {
        const config = this.getConfig('database').postgresql;
        if (!config.host) {return null;}

        const ssl = config.ssl ? '?sslmode=require' : '';
        return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
    }

    refresh() {
        this.loaded = false;
        this.config.clear();
        return this.load();
    }
}

// Create global config manager
const configManager = new ConfigManager();

module.exports = {
    ConfigManager,
    configManager
};
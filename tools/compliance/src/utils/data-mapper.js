/**
 * Data Mapper - Scans and maps all data storage locations in FlashFusion
 */

const fs = require('fs-extra');
const path = require('path');

class DataMapper {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.sensitivePatterns = [
            /email/i,
            /password/i,
            /ssn|social.security/i,
            /credit.card|cc.number/i,
            /phone.number/i,
            /address/i,
            /first.name|last.name|full.name/i,
            /birth.date|dob/i,
            /ip.address/i,
            /user.id|customer.id/i,
            /api.key|secret/i,
            /token/i
        ];
    }

    async scanDataSources() {
        const dataSources = {
            databases: [],
            files: [],
            apiEndpoints: [],
            thirdPartyIntegrations: [],
            environmentVariables: [],
            cookies: [],
            localStorage: []
        };

        // Scan for database configurations
        dataSources.databases = await this.scanDatabases();
        
        // Scan for data files
        dataSources.files = await this.scanDataFiles();
        
        // Scan for API endpoints that handle sensitive data
        dataSources.apiEndpoints = await this.scanAPIEndpoints();
        
        // Scan for third-party integrations
        dataSources.thirdPartyIntegrations = await this.scanThirdPartyIntegrations();
        
        // Scan environment variables
        dataSources.environmentVariables = await this.scanEnvironmentVariables();
        
        // Scan for cookie usage
        dataSources.cookies = await this.scanCookieUsage();
        
        // Scan for localStorage usage
        dataSources.localStorage = await this.scanLocalStorageUsage();
        
        return dataSources;
    }

    async scanDatabases() {
        const databases = [];
        
        // Check for Supabase configuration
        const envFiles = await this.findEnvironmentFiles();
        for (const envFile of envFiles) {
            const content = await fs.readFile(envFile, 'utf-8');
            if (content.includes('SUPABASE_URL')) {
                databases.push({
                    type: 'supabase',
                    name: 'Supabase Database',
                    location: this.extractSupabaseRegion(content),
                    configFile: envFile,
                    containsSensitiveData: true,
                    dataTypes: [
                        { type: 'user_profiles', personal: true, category: 'identity' },
                        { type: 'authentication', personal: true, category: 'security' },
                        { type: 'application_data', personal: false, category: 'application' }
                    ],
                    compliance: {
                        gdpr: 'requires_assessment',
                        ccpa: 'requires_assessment',
                        encryption: 'unknown'
                    }
                });
            }
            
            if (content.includes('POSTGRES_URL') || content.includes('DATABASE_URL')) {
                databases.push({
                    type: 'postgresql',
                    name: 'PostgreSQL Database',
                    location: this.extractPostgresRegion(content),
                    configFile: envFile,
                    containsSensitiveData: true,
                    dataTypes: [
                        { type: 'structured_data', personal: true, category: 'mixed' },
                        { type: 'audit_logs', personal: false, category: 'security' }
                    ],
                    compliance: {
                        gdpr: 'requires_assessment',
                        ccpa: 'requires_assessment',
                        encryption: 'unknown'
                    }
                });
            }
        }
        
        return databases;
    }

    async scanDataFiles() {
        const dataFiles = [];
        
        // Scan for MCP audit logs
        const mcpFiles = await this.findFiles('**/*mcp*audit*.json');
        for (const file of mcpFiles) {
            const content = await fs.readFile(file, 'utf-8').catch(() => '');
            const containsSensitive = this.containsSensitiveData(content);
            
            dataFiles.push({
                type: 'audit_log',
                path: file,
                size: (await fs.stat(file)).size,
                containsSensitiveData: containsSensitive,
                dataTypes: [
                    { type: 'audit_trail', personal: false, category: 'security' },
                    { type: 'file_operations', personal: false, category: 'system' }
                ],
                compliance: {
                    retention: 'unknown',
                    access_control: 'local_file_system',
                    encryption: 'none'
                }
            });
        }
        
        // Scan for workflow data files
        const workflowFiles = await this.findFiles('**/workflows/**/*.json');
        for (const file of workflowFiles) {
            const content = await fs.readFile(file, 'utf-8').catch(() => '');
            const containsSensitive = this.containsSensitiveData(content);
            
            if (containsSensitive) {
                dataFiles.push({
                    type: 'workflow_data',
                    path: file,
                    size: (await fs.stat(file)).size,
                    containsSensitiveData: true,
                    dataTypes: [
                        { type: 'workflow_config', personal: true, category: 'application' }
                    ],
                    compliance: {
                        retention: 'unknown',
                        access_control: 'file_system',
                        encryption: 'none'
                    }
                });
            }
        }
        
        return dataFiles;
    }

    async scanAPIEndpoints() {
        const endpoints = [];
        
        // Scan for API route files
        const apiFiles = await this.findFiles('**/api/**/*.js');
        const routeFiles = await this.findFiles('**/routes/**/*.js');
        const allFiles = [...apiFiles, ...routeFiles];
        
        for (const file of allFiles) {
            const content = await fs.readFile(file, 'utf-8').catch(() => '');
            const routes = this.extractAPIRoutes(content);
            
            for (const route of routes) {
                if (this.containsSensitiveData(route.handler)) {
                    endpoints.push({
                        method: route.method,
                        path: route.path,
                        file: file,
                        handlesPersonalData: true,
                        dataTypes: this.identifyDataTypes(route.handler),
                        compliance: {
                            authentication: this.hasAuthentication(route.handler),
                            authorization: this.hasAuthorization(route.handler),
                            validation: this.hasValidation(route.handler),
                            logging: this.hasLogging(route.handler)
                        }
                    });
                }
            }
        }
        
        return endpoints;
    }

    async scanThirdPartyIntegrations() {
        const integrations = [];
        
        const envFiles = await this.findEnvironmentFiles();
        for (const envFile of envFiles) {
            const content = await fs.readFile(envFile, 'utf-8');
            
            // Check for various third-party services
            const services = [
                { name: 'Stripe', pattern: /STRIPE_/i, dataShared: ['payment_info', 'customer_data'] },
                { name: 'GitHub', pattern: /GITHUB_/i, dataShared: ['user_profiles', 'repository_data'] },
                { name: 'Google', pattern: /GOOGLE_/i, dataShared: ['analytics', 'authentication'] },
                { name: 'Twitter', pattern: /TWITTER_/i, dataShared: ['social_media'] },
                { name: 'LinkedIn', pattern: /LINKEDIN_/i, dataShared: ['professional_data'] },
                { name: 'Shopify', pattern: /SHOPIFY_/i, dataShared: ['ecommerce_data'] },
                { name: 'OpenAI', pattern: /OPENAI_/i, dataShared: ['ai_interactions'] },
                { name: 'Anthropic', pattern: /ANTHROPIC_/i, dataShared: ['ai_interactions'] }
            ];
            
            for (const service of services) {
                if (service.pattern.test(content)) {
                    integrations.push({
                        name: service.name,
                        configFile: envFile,
                        dataShared: service.dataShared,
                        hasDataProcessingAgreement: false, // Requires manual verification
                        compliance: {
                            gdpr: 'requires_manual_review',
                            ccpa: 'requires_manual_review',
                            dataTransfer: 'international'
                        }
                    });
                }
            }
        }
        
        return integrations;
    }

    async scanEnvironmentVariables() {
        const envVars = [];
        
        const envFiles = await this.findEnvironmentFiles();
        for (const envFile of envFiles) {
            const content = await fs.readFile(envFile, 'utf-8');
            const lines = content.split('\n');
            
            for (const line of lines) {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, value] = line.split('=');
                    if (this.isSensitiveEnvVar(key, value)) {
                        envVars.push({
                            key: key.trim(),
                            file: envFile,
                            type: this.classifyEnvVar(key),
                            hasValue: !!value && !value.includes('your_'),
                            compliance: {
                                encryption: 'plaintext',
                                access_control: 'file_system'
                            }
                        });
                    }
                }
            }
        }
        
        return envVars;
    }

    async scanCookieUsage() {
        const cookies = [];
        
        const jsFiles = await this.findFiles('**/*.{js,ts,jsx,tsx}');
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf-8').catch(() => '');
            if (content.includes('document.cookie') || content.includes('setCookie')) {
                const cookieUsage = this.extractCookieUsage(content);
                cookies.push({
                    file,
                    usage: cookieUsage,
                    compliance: {
                        consent: 'unknown',
                        essential: 'unknown',
                        expiration: 'unknown'
                    }
                });
            }
        }
        
        return cookies;
    }

    async scanLocalStorageUsage() {
        const localStorage = [];
        
        const jsFiles = await this.findFiles('**/*.{js,ts,jsx,tsx}');
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf-8').catch(() => '');
            if (content.includes('localStorage') || content.includes('sessionStorage')) {
                const storageUsage = this.extractStorageUsage(content);
                localStorage.push({
                    file,
                    usage: storageUsage,
                    compliance: {
                        consent: 'unknown',
                        encryption: 'none',
                        retention: 'unknown'
                    }
                });
            }
        }
        
        return localStorage;
    }

    // Helper methods
    async findEnvironmentFiles() {
        const files = [];
        const patterns = ['.env', '.env.local', '.env.example', '.env.production'];
        
        for (const pattern of patterns) {
            const file = path.join(this.rootPath, pattern);
            if (await fs.pathExists(file)) {
                files.push(file);
            }
            
            // Also check in apps/web
            const webFile = path.join(this.rootPath, 'apps/web', pattern);
            if (await fs.pathExists(webFile)) {
                files.push(webFile);
            }
        }
        
        return files;
    }

    async findFiles(pattern) {
        // Simple glob-like implementation
        const files = [];
        
        const scanDir = async (dir) => {
            try {
                const entries = await fs.readdir(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                        await scanDir(fullPath);
                    } else if (stat.isFile()) {
                        if (this.matchesPattern(fullPath, pattern)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Ignore permission errors
            }
        };
        
        await scanDir(this.rootPath);
        return files;
    }

    matchesPattern(filePath, pattern) {
        // Simple pattern matching
        const fileName = path.basename(filePath);
        const dir = path.dirname(filePath);
        
        if (pattern.includes('**/')) {
            const pathPattern = pattern.replace('**/', '');
            return fileName.includes(pathPattern.replace('*', ''));
        }
        
        return fileName.includes(pattern.replace('*', ''));
    }

    containsSensitiveData(content) {
        return this.sensitivePatterns.some(pattern => pattern.test(content));
    }

    extractSupabaseRegion(content) {
        const match = content.match(/SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
        return match ? 'Supabase (Region Unknown)' : 'Unknown';
    }

    extractPostgresRegion(content) {
        // Try to extract region from connection string
        if (content.includes('amazonaws.com')) {
            const match = content.match(/(us|eu|ap)-([a-z]+-\d+)/);
            return match ? `AWS ${match[0]}` : 'AWS (Region Unknown)';
        }
        return 'Unknown';
    }

    extractAPIRoutes(content) {
        const routes = [];
        const routePatterns = [
            /\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi
        ];

        for (const pattern of routePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                routes.push({
                    method: match[1].toUpperCase(),
                    path: match[2],
                    handler: content
                });
            }
        }

        return routes;
    }

    identifyDataTypes(content) {
        const types = [];
        if (this.sensitivePatterns.some(p => p.test(content))) {
            types.push({ type: 'personal_data', category: 'personal' });
        }
        return types;
    }

    hasAuthentication(content) {
        return /auth|jwt|token|session/i.test(content);
    }

    hasAuthorization(content) {
        return /authorize|permission|role|admin/i.test(content);
    }

    hasValidation(content) {
        return /validate|sanitize|schema/i.test(content);
    }

    hasLogging(content) {
        return /log|audit|track/i.test(content);
    }

    isSensitiveEnvVar(key, value) {
        const sensitiveKeys = /API_KEY|SECRET|PASSWORD|TOKEN|PRIVATE/i;
        return sensitiveKeys.test(key) || this.containsSensitiveData(value || '');
    }

    classifyEnvVar(key) {
        if (/API_KEY/i.test(key)) return 'api_key';
        if (/SECRET/i.test(key)) return 'secret';
        if (/PASSWORD/i.test(key)) return 'password';
        if (/TOKEN/i.test(key)) return 'token';
        return 'unknown';
    }

    extractCookieUsage(content) {
        // Extract cookie operations
        const usage = [];
        const cookieRegex = /document\.cookie\s*=\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = cookieRegex.exec(content)) !== null) {
            usage.push({ operation: 'set', value: match[1] });
        }
        return usage;
    }

    extractStorageUsage(content) {
        const usage = [];
        const storageRegex = /(local|session)Storage\.(get|set|remove)Item\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = storageRegex.exec(content)) !== null) {
            usage.push({
                type: match[1] + 'Storage',
                operation: match[2] + 'Item',
                key: match[3]
            });
        }
        return usage;
    }
}

module.exports = { DataMapper };
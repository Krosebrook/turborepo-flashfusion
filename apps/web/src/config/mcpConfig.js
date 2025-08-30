/**
 * MCP Server Configuration
 * Centralized configuration for all MCP servers
 */

const path = require('path');

const MCP_CONFIG = {
    // Base configuration
    basePath: path.join(__dirname, '../../mcp-servers'),
    defaultTimeout: 30000,
    maxRetries: 3,

    // Server definitions
    servers: {
        everything: {
            path: 'src/everything',
            type: 'typescript',
            description: 'Reference server with prompts, resources, and tools',
            startCommand: ['npm', 'start'],
            healthCheck: '/health',
            priority: 'low',
            autoStart: false
        },
        fetch: {
            path: 'src/fetch',
            type: 'python',
            description: 'Web content fetching and conversion',
            startCommand: ['python', '-m', 'mcp_server_fetch'],
            healthCheck: '/ping',
            priority: 'high',
            autoStart: true
        },
        filesystem: {
            path: 'src/filesystem',
            type: 'typescript',
            description: 'Secure file operations with access controls',
            startCommand: ['npm', 'start'],
            healthCheck: '/status',
            priority: 'high',
            autoStart: true
        },
        git: {
            path: 'src/git',
            type: 'python',
            description: 'Git repository tools and operations',
            startCommand: ['python', '-m', 'mcp_server_git'],
            healthCheck: '/health',
            priority: 'medium',
            autoStart: false
        },
        memory: {
            path: 'src/memory',
            type: 'typescript',
            description: 'Knowledge graph-based persistent memory',
            startCommand: ['npm', 'start'],
            healthCheck: '/memory/status',
            priority: 'high',
            autoStart: true
        },
        sequentialthinking: {
            path: 'src/sequentialthinking',
            type: 'typescript',
            description: 'Dynamic problem-solving through thought sequences',
            startCommand: ['npm', 'start'],
            healthCheck: '/thinking/status',
            priority: 'medium',
            autoStart: false
        },
        time: {
            path: 'src/time',
            type: 'python',
            description: 'Time and timezone conversion capabilities',
            startCommand: ['python', '-m', 'mcp_server_time'],
            healthCheck: '/time/now',
            priority: 'low',
            autoStart: false
        }
    },

    // Environment-specific overrides
    environments: {
        development: {
            logLevel: 'debug',
            enableMetrics: true,
            maxConcurrentServers: 3
        },
        production: {
            logLevel: 'info',
            enableMetrics: false,
            maxConcurrentServers: 5
        },
        test: {
            logLevel: 'error',
            enableMetrics: false,
            maxConcurrentServers: 1
        }
    }
};

module.exports = MCP_CONFIG;
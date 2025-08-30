/**
 * Model Context Protocol (MCP) Service Integration
 * Refactored for better performance, error handling, and maintainability
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const MCPServerInstance = require('../core/mcpServer');
const MCPLogger = require('../utils/mcpLogger');
const MCP_CONFIG = require('../config/mcpConfig');

class MCPService extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = { ...MCP_CONFIG, ...options };
        this.environment = process.env.NODE_ENV || 'development';
        this.envConfig = this.config.environments[this.environment] || {};
        this.logger = new MCPLogger(this.envConfig.logLevel || 'info');
        this.servers = new Map();
        this.connectionPool = new Map();
        this.isInitialized = false;
        this.metrics = {
            totalRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            serversStarted: 0,
            serverRestarts: 0
        };
    }

    /**
   * Initialize MCP service and create server instances
   */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('SERVICE', 'Already initialized');
            return true;
        }

        try {
            this.logger.info('SERVICE', 'Initializing MCP Service', {
                environment: this.environment,
                maxConcurrentServers: this.envConfig.maxConcurrentServers
            });

            // Verify MCP servers directory exists
            const mcpExists = await this.checkMCPServersExists();
            if (!mcpExists) {
                throw new Error('MCP servers directory not found');
            }

            // Create server instances
            await this.createServerInstances();

            // Install dependencies
            await this.installDependencies();

            // Auto-start priority servers
            await this.autoStartServers();

            this.isInitialized = true;
            this.logger.info('SERVICE', 'MCP Service initialized successfully');
            this.emit('initialized');

            return true;
        } catch (error) {
            this.logger.error('SERVICE', 'Initialization failed', {
                error: error.message
            });
            this.emit('error', error);
            return false;
        }
    }

    /**
   * Check if MCP servers directory exists
   */
    async checkMCPServersExists() {
        try {
            await fs.access(this.config.basePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
   * Create server instances for all configured servers
   */
    async createServerInstances() {
        for (const [name, config] of Object.entries(this.config.servers)) {
            const serverConfig = {
                ...config,
                basePath: this.config.basePath,
                maxRetries: this.config.maxRetries
            };

            const server = new MCPServerInstance(name, serverConfig, this.logger);

            // Forward events
            server.on('started', () => {
                this.metrics.serversStarted++;
                this.emit('serverStarted', name);
            });

            server.on('stopped', () => this.emit('serverStopped', name));
            server.on('error', (error) => {
                this.metrics.serverRestarts++;
                this.emit('serverError', name, error);
            });

            this.servers.set(name, server);
        }

        this.logger.info(
            'SERVICE',
            `Created ${this.servers.size} server instances`
        );
    }

    /**
   * Auto-start servers marked for automatic startup
   */
    async autoStartServers() {
        const autoStartServers = Array.from(this.servers.entries())
            .filter(([_, server]) => server.config.autoStart)
            .sort(
                ([_, a], [__, b]) =>
                    this.getPriorityValue(b.config.priority) -
          this.getPriorityValue(a.config.priority)
            );

        for (const [name, server] of autoStartServers) {
            try {
                await server.start();
                this.logger.info('SERVICE', `Auto-started server: ${name}`);
            } catch (error) {
                this.logger.error('SERVICE', `Failed to auto-start ${name}`, {
                    error: error.message
                });
            }
        }
    }

    /**
   * Get numeric priority value for sorting
   */
    getPriorityValue(priority) {
        const values = { high: 3, medium: 2, low: 1 };
        return values[priority] || 1;
    }

    /**
   * Install dependencies for MCP servers
   */
    async installDependencies() {
        const typescriptServers = Array.from(this.servers.entries())
            .filter(([_, server]) => server.config.type === 'typescript')
            .map(([name, server]) => ({
                name,
                path: require('path').join(this.config.basePath, server.config.path)
            }));

        const installPromises = typescriptServers.map(async (server) => {
            try {
                this.logger.info('SETUP', `Installing dependencies for ${server.name}`);
                await this.runCommand('npm', ['install'], { cwd: server.path });
                this.logger.info('SETUP', `Dependencies installed for ${server.name}`);
            } catch (error) {
                this.logger.warn(
                    'SETUP',
                    `Failed to install dependencies for ${server.name}`,
                    { error: error.message }
                );
            }
        });

        await Promise.all(installPromises);
    }

    /**
   * Start an MCP server
   */
    async startServer(serverName, options = {}) {
        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`Unknown MCP server: ${serverName}`);
            }

            if (server.status === 'running') {
                this.logger.warn('SERVICE', `Server ${serverName} already running`);
                return server.getInfo();
            }

            // Check concurrent server limit
            const runningCount = Array.from(this.servers.values()).filter(
                (s) => s.status === 'running'
            ).length;

            if (runningCount >= (this.envConfig.maxConcurrentServers || 5)) {
                throw new Error('Maximum concurrent servers limit reached');
            }

            this.logger.info('SERVICE', `Starting server: ${serverName}`);
            await server.start(options);

            return server.getInfo();
        } catch (error) {
            this.logger.error('SERVICE', `Failed to start ${serverName}`, {
                error: error.message
            });
            throw error;
        }
    }

    /**
   * Stop an MCP server
   */
    async stopServer(serverName, force = false) {
        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`Unknown MCP server: ${serverName}`);
            }

            if (server.status === 'stopped') {
                this.logger.warn('SERVICE', `Server ${serverName} already stopped`);
                return true;
            }

            this.logger.info('SERVICE', `Stopping server: ${serverName}`);
            await server.stop(force);

            return true;
        } catch (error) {
            this.logger.error('SERVICE', `Failed to stop ${serverName}`, {
                error: error.message
            });
            throw error;
        }
    }

    /**
   * Get comprehensive status of all MCP servers
   */
    getServerStatus() {
        const servers = {};
        const runningServers = [];
        const availableServers = [];

        for (const [name, server] of this.servers) {
            const info = server.getInfo();
            servers[name] = info;
            availableServers.push(name);

            if (info.status === 'running') {
                runningServers.push(name);
            }
        }

        return {
            available: availableServers,
            running: runningServers,
            total: availableServers.length,
            healthy: runningServers.length,
            environment: this.environment,
            initialized: this.isInitialized,
            metrics: { ...this.metrics },
            servers
        };
    }

    /**
   * Send request to MCP server with metrics tracking
   */
    async sendRequest(serverName, method, params = {}, timeout = null) {
        const startTime = Date.now();
        this.metrics.totalRequests++;

        try {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`Unknown MCP server: ${serverName}`);
            }

            const requestTimeout = timeout || this.config.defaultTimeout;
            const result = await server.sendRequest(method, params, requestTimeout);

            // Update metrics
            const responseTime = Date.now() - startTime;
            this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime + responseTime) / 2;

            this.emit('requestCompleted', { serverName, method, responseTime });
            return result;
        } catch (error) {
            this.metrics.failedRequests++;
            this.emit('requestFailed', { serverName, method, error: error.message });
            throw error;
        }
    }

    /**
   * Utility function to run shell commands with timeout
   */
    runCommand(command, args, options = {}) {
        const { spawn } = require('child_process');
        const timeout = options.timeout || 60000;

        return new Promise((resolve, reject) => {
            const process = spawn(command, args, {
                ...options,
                stdio: options.stdio || 'pipe'
            });

            let stdout = '';
            let stderr = '';
            let timeoutHandle;

            if (timeout > 0) {
                timeoutHandle = setTimeout(() => {
                    process.kill('SIGKILL');
                    reject(new Error(`Command timeout after ${timeout}ms`));
                }, timeout);
            }

            if (process.stdout) {
                process.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }

            if (process.stderr) {
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            process.on('close', (code) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }

                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });

            process.on('error', (error) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                reject(error);
            });
        });
    }

    /**
   * Stop all active MCP servers
   */
    async stopAllServers(force = false) {
        this.logger.info('SERVICE', 'Stopping all MCP servers');

        const stopPromises = Array.from(this.servers.keys()).map((name) =>
            this.stopServer(name, force).catch((error) =>
                this.logger.error('SERVICE', `Failed to stop ${name}`, {
                    error: error.message
                })
            )
        );

        await Promise.all(stopPromises);
        this.logger.info('SERVICE', 'All MCP servers stopped');
        this.emit('allServersStopped');
    }

    /**
   * Get server health information
   */
    async getServerHealth(serverName) {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`Unknown MCP server: ${serverName}`);
        }

        return await server.getHealth();
    }

    /**
   * Get service metrics
   */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.isInitialized ? Date.now() - this.initTime : 0,
            serversCount: this.servers.size,
            runningServers: Array.from(this.servers.values()).filter(
                (s) => s.status === 'running'
            ).length
        };
    }

    /**
   * Restart a server
   */
    async restartServer(serverName, options = {}) {
        await this.stopServer(serverName, true);
        // Wait a moment for cleanup
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await this.startServer(serverName, options);
    }

    /**
   * Shutdown the entire MCP service
   */
    async shutdown() {
        this.logger.info('SERVICE', 'Shutting down MCP Service');
        await this.stopAllServers(true);
        this.isInitialized = false;
        this.emit('shutdown');
    }
}

module.exports = MCPService;
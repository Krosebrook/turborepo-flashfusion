/**
 * MCP Server Instance Manager
 * Handles individual server lifecycle and communication
 */

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const MCPLogger = require('../utils/mcpLogger');

class MCPServerInstance extends EventEmitter {
    constructor(name, config, logger = null) {
        super();
        this.name = name;
        this.config = config;
        this.logger = logger || new MCPLogger();
        this.process = null;
        this.status = 'stopped';
        this.startTime = null;
        this.requestQueue = new Map();
        this.requestId = 0;
        this.retryCount = 0;
        this.maxRetries = config.maxRetries || 3;
    }

    /**
   * Start the MCP server process
   */
    async start(options = {}) {
        if (this.status === 'running' || this.status === 'starting') {
            this.logger.warn('SERVER', `${this.name} already running/starting`);
            return this;
        }

        try {
            this.status = 'starting';
            this.emit('starting');

            const serverPath = require('path').join(
                this.config.basePath,
                this.config.path
            );
            const [command, ...args] = this.config.startCommand;

            this.process = spawn(command, args, {
                cwd: serverPath,
                stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...options.env }
            });

            this.setupProcessHandlers();
            this.startTime = new Date();

            // Wait for server to be ready
            await this.waitForReady();

            this.status = 'running';
            this.retryCount = 0;
            this.logger.serverStarted(this.name, this.config);
            this.emit('started');

            return this;
        } catch (error) {
            this.status = 'error';
            this.logger.serverError(this.name, error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
   * Stop the MCP server process
   */
    async stop(force = false) {
        if (this.status === 'stopped') {
            return true;
        }

        try {
            this.status = 'stopping';
            this.emit('stopping');

            if (this.process) {
                // Graceful shutdown first
                this.process.kill(force ? 'SIGKILL' : 'SIGTERM');

                if (!force) {
                    // Wait for graceful shutdown, then force if needed
                    setTimeout(() => {
                        if (this.process && !this.process.killed) {
                            this.process.kill('SIGKILL');
                        }
                    }, 5000);
                }
            }

            this.status = 'stopped';
            this.process = null;
            this.startTime = null;
            this.requestQueue.clear();

            this.logger.serverStopped(this.name);
            this.emit('stopped');

            return true;
        } catch (error) {
            this.logger.serverError(this.name, error);
            throw error;
        }
    }

    /**
   * Send request to MCP server
   */
    async sendRequest(method, params = {}, timeout = 30000) {
        if (this.status !== 'running') {
            throw new Error(
                `Server ${this.name} is not running (status: ${this.status})`
            );
        }

        const requestId = ++this.requestId;
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params
        };

        this.logger.requestSent(this.name, method, requestId);

        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.requestQueue.delete(requestId);
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);

            this.requestQueue.set(requestId, { resolve, reject, timeoutHandle });

            try {
                this.process.stdin.write(`${JSON.stringify(request)}\n`);
            } catch (error) {
                this.requestQueue.delete(requestId);
                clearTimeout(timeoutHandle);
                reject(error);
            }
        });
    }

    /**
   * Get server health status
   */
    async getHealth() {
        try {
            if (this.status !== 'running') {
                return { status: this.status, healthy: false };
            }

            // Try to send a ping request
            await this.sendRequest('ping', {}, 5000);

            return {
                status: this.status,
                healthy: true,
                uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
                pid: this.process?.pid
            };
        } catch (error) {
            return {
                status: this.status,
                healthy: false,
                error: error.message
            };
        }
    }

    /**
   * Setup process event handlers
   */
    setupProcessHandlers() {
        if (!this.process) {
            return;
        }

        this.process.on('spawn', () => {
            this.logger.debug('SERVER', `Process spawned for ${this.name}`);
        });

        this.process.on('error', (error) => {
            this.status = 'error';
            this.logger.serverError(this.name, error);
            this.emit('error', error);
            this.handleRestart();
        });

        this.process.on('exit', (code, signal) => {
            this.status = 'stopped';
            this.logger.info('SERVER', `${this.name} exited`, { code, signal });
            this.emit('exit', code, signal);

            if (code !== 0 && this.retryCount < this.maxRetries) {
                this.handleRestart();
            }
        });

        // Handle stdout for responses
        if (this.process.stdout) {
            this.process.stdout.on('data', (data) => {
                this.handleServerOutput(data.toString());
            });
        }

        // Handle stderr for errors
        if (this.process.stderr) {
            this.process.stderr.on('data', (data) => {
                this.logger.warn('SERVER', `${this.name} stderr`, {
                    output: data.toString()
                });
            });
        }
    }

    /**
   * Handle server output and match responses to requests
   */
    handleServerOutput(output) {
        const lines = output.split('\n').filter((line) => line.trim());

        for (const line of lines) {
            try {
                const response = JSON.parse(line);

                if (response.id && this.requestQueue.has(response.id)) {
                    const { resolve, reject, timeoutHandle } = this.requestQueue.get(
                        response.id
                    );
                    clearTimeout(timeoutHandle);
                    this.requestQueue.delete(response.id);

                    if (response.error) {
                        this.logger.responseReceived(this.name, response.id, false);
                        reject(new Error(response.error.message || 'Server error'));
                    } else {
                        this.logger.responseReceived(this.name, response.id, true);
                        resolve(response.result);
                    }
                }
            } catch (error) {
                // Not JSON or malformed - log and continue
                this.logger.debug('SERVER', `Non-JSON output from ${this.name}`, {
                    output: line
                });
            }
        }
    }

    /**
   * Wait for server to be ready
   */
    async waitForReady(maxWait = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            if (this.process && this.process.pid) {
                // Give server a moment to initialize
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        throw new Error(`Server ${this.name} failed to start within ${maxWait}ms`);
    }

    /**
   * Handle automatic restart on failure
   */
    async handleRestart() {
        if (this.retryCount >= this.maxRetries) {
            this.logger.error('SERVER', `${this.name} max retries exceeded`);
            return;
        }

        this.retryCount++;
        this.logger.info('SERVER', `Attempting restart of ${this.name}`, {
            attempt: this.retryCount,
            maxRetries: this.maxRetries
        });

        // Wait before restart
        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        setTimeout(() => {
            this.start().catch((error) => {
                this.logger.serverError(this.name, error);
            });
        }, delay);
    }

    /**
   * Get server info
   */
    getInfo() {
        return {
            name: this.name,
            status: this.status,
            type: this.config.type,
            description: this.config.description,
            priority: this.config.priority,
            startTime: this.startTime,
            retryCount: this.retryCount,
            pid: this.process?.pid,
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
        };
    }
}

module.exports = MCPServerInstance;
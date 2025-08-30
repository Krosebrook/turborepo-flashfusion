/**
 * MCP API Endpoints for FlashFusion
 * Refactored with middleware, error handling, and connection pooling
 */

const MCPService = require('../src/services/mcpService');
const MCPMiddleware = require('../src/middleware/mcpMiddleware');

// Initialize services
const mcpService = new MCPService({
    environment: process.env.NODE_ENV || 'development'
});

const middleware = new MCPMiddleware({
    maxRequestsPerMinute: 120,
    enableMetrics: true,
    logLevel: process.env.MCP_LOG_LEVEL || 'info'
});

// Global initialization state
let isInitialized = false;
let initializationPromise = null;

// Initialize service once
async function ensureInitialized() {
    if (isInitialized) return true;
    
    if (initializationPromise) {
        return await initializationPromise;
    }
    
    initializationPromise = mcpService.initialize();
    isInitialized = await initializationPromise;
    initializationPromise = null;
    
    return isInitialized;
}

// Cleanup interval for middleware
setInterval(() => {
    middleware.cleanup();
}, 60000); // Clean up every minute

module.exports = async (req, res) => {
    // Apply middleware stack
    const middlewares = middleware.getAllMiddleware();
    
    // Apply each middleware
    for (const mw of middlewares) {
        await new Promise((resolve, reject) => {
            mw(req, res, (error) => {
                if (error) reject(error);
                else resolve();
            });
        }).catch(error => {
            return res.mcpError('Middleware error: ' + error.message, 500);
        });
        
        // If response was sent by middleware, return
        if (res.headersSent) return;
    }

    try {
        const initialized = await ensureInitialized();
        if (!initialized) {
            return res.mcpError('MCP Service initialization failed', 503);
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname.replace('/api/mcp', '');

        // GET /api/mcp/status - Get status of all MCP servers
        if (req.method === 'GET' && path === '/status') {
            const status = mcpService.getServerStatus();
            return res.mcpSuccess(status, 'Server status retrieved');
        }

        // GET /api/mcp/metrics - Get service metrics
        if (req.method === 'GET' && path === '/metrics') {
            const metrics = mcpService.getMetrics();
            return res.mcpSuccess(metrics, 'Metrics retrieved');
        }

        // GET /api/mcp/health/:serverName - Get specific server health
        if (req.method === 'GET' && path.startsWith('/health/')) {
            const serverName = path.replace('/health/', '');
            try {
                const health = await mcpService.getServerHealth(serverName);
                return res.mcpSuccess(health, `Health status for ${serverName}`);
            } catch (error) {
                return res.mcpError(error.message, 404);
            }
        }

        // POST /api/mcp/start - Start an MCP server
        if (req.method === 'POST' && path === '/start') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                let serverName = 'unknown';
                try {
                    const parsedBody = JSON.parse(body || '{}');
                    serverName = parsedBody.serverName;
                    const options = parsedBody.options || {};
                    
                    if (!serverName) {
                        return res.mcpError('serverName is required', 400);
                    }

                    const serverInfo = await mcpService.startServer(serverName, options);
                    return res.mcpSuccess(serverInfo, `Server ${serverName} started successfully`);

                } catch (error) {
                    return res.mcpError(error.message, 500, {
                        serverName: serverName || 'unknown'
                    });
                }
            });
            return;
        }

        // POST /api/mcp/restart - Restart an MCP server
        if (req.method === 'POST' && path === '/restart') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                let serverName = 'unknown';
                try {
                    const parsedBody = JSON.parse(body || '{}');
                    serverName = parsedBody.serverName;
                    const options = parsedBody.options || {};
                    
                    if (!serverName) {
                        return res.mcpError('serverName is required', 400);
                    }

                    const serverInfo = await mcpService.restartServer(serverName, options);
                    return res.mcpSuccess(serverInfo, `Server ${serverName} restarted successfully`);

                } catch (error) {
                    return res.mcpError(error.message, 500, {
                        serverName: serverName || 'unknown'
                    });
                }
            });
            return;
        }

        // POST /api/mcp/stop - Stop an MCP server
        if (req.method === 'POST' && path === '/stop') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                let serverName = 'unknown';
                try {
                    const parsedBody = JSON.parse(body || '{}');
                    serverName = parsedBody.serverName;
                    const force = parsedBody.force || false;
                    
                    if (!serverName) {
                        return res.mcpError('serverName is required', 400);
                    }

                    const stopped = await mcpService.stopServer(serverName, force);
                    return res.mcpSuccess(
                        { stopped, serverName, force },
                        `Server ${serverName} stopped successfully`
                    );

                } catch (error) {
                    return res.mcpError(error.message, 500, {
                        serverName: serverName || 'unknown'
                    });
                }
            });
            return;
        }

        // POST /api/mcp/stop-all - Stop all MCP servers
        if (req.method === 'POST' && path === '/stop-all') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { force = false } = JSON.parse(body || '{}');
                    
                    await mcpService.stopAllServers(force);
                    return res.mcpSuccess(
                        { force },
                        'All servers stopped successfully'
                    );

                } catch (error) {
                    return res.mcpError(error.message, 500);
                }
            });
            return;
        }

        // POST /api/mcp/request - Send request to MCP server
        if (req.method === 'POST' && path === '/request') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                let serverName = 'unknown';
                let method = 'unknown';
                try {
                    const parsedBody = JSON.parse(body || '{}');
                    serverName = parsedBody.serverName;
                    method = parsedBody.method;
                    const params = parsedBody.params || {};
                    const timeout = parsedBody.timeout;
                    
                    if (!serverName || !method) {
                        return res.mcpError('serverName and method are required', 400);
                    }

                    const response = await mcpService.sendRequest(serverName, method, params, timeout);
                    return res.mcpSuccess(
                        response,
                        `Request to ${serverName}.${method} completed`
                    );

                } catch (error) {
                    return res.mcpError(error.message, 500, {
                        serverName: serverName || 'unknown',
                        method: method || 'unknown'
                    });
                }
            });
            return;
        }

        // GET /api/mcp/servers - List available servers
        if (req.method === 'GET' && path === '/servers') {
            const status = mcpService.getServerStatus();
            const servers = Object.entries(status.servers).map(([name, info]) => ({
                name,
                type: info.type || 'unknown',
                description: info.description || '',
                status: info.status,
                priority: info.priority,
                uptime: info.uptime,
                active: info.status === 'running'
            }));

            return res.mcpSuccess({ servers, summary: {
                total: status.total,
                running: status.healthy,
                available: status.available.length
            }}, 'Server list retrieved');
        }

        // Default response for unknown paths
        return res.mcpError('Endpoint not found', 404, {
            availableEndpoints: [
                'GET /api/mcp/status - Get server status',
                'GET /api/mcp/servers - List available servers',
                'GET /api/mcp/metrics - Get service metrics',
                'GET /api/mcp/health/:serverName - Get server health',
                'POST /api/mcp/start - Start a server',
                'POST /api/mcp/stop - Stop a server',
                'POST /api/mcp/restart - Restart a server',
                'POST /api/mcp/stop-all - Stop all servers',
                'POST /api/mcp/request - Send request to server'
            ],
            requestedPath: path
        });

    } catch (error) {
        // Apply error handling middleware
        middleware.errorHandler()(error, req, res, () => {});
    }
};

// Graceful shutdown handler
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down MCP service gracefully...');
    try {
        await mcpService.shutdown();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down MCP service gracefully...');
    try {
        await mcpService.shutdown();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
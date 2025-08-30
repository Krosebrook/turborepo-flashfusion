/**
 * MCP Logger Utility
 * Centralized logging for MCP operations
 */

class MCPLogger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, component, message, data = null) {
        const timestamp = new Date().toISOString();
        const baseMsg = `[${timestamp}] [MCP-${level.toUpperCase()}] [${component}] ${message}`;

        if (data) {
            return `${baseMsg} ${JSON.stringify(data)}`;
        }
        return baseMsg;
    }

    error(component, message, data = null) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', component, message, data));
        }
    }

    warn(component, message, data = null) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', component, message, data));
        }
    }

    info(component, message, data = null) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', component, message, data));
        }
    }

    debug(component, message, data = null) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', component, message, data));
        }
    }

    serverStarted(serverName, config) {
        this.info('SERVER', `Started ${serverName}`, {
            type: config.type,
            priority: config.priority
        });
    }

    serverStopped(serverName, reason = 'normal') {
        this.info('SERVER', `Stopped ${serverName}`, { reason });
    }

    serverError(serverName, error) {
        this.error('SERVER', `Error in ${serverName}`, {
            error: error.message,
            stack: error.stack
        });
    }

    requestSent(serverName, method, requestId) {
        this.debug('REQUEST', `Sent to ${serverName}`, {
            method,
            requestId
        });
    }

    responseReceived(serverName, requestId, success) {
        this.debug('RESPONSE', `From ${serverName}`, {
            requestId,
            success
        });
    }
}

module.exports = MCPLogger;
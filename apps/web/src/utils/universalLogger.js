/**
 * Universal Logger - Works EVERYWHERE, NEVER FAILS
 * This logger is designed to work in ALL environments without any file system operations
 */

class UniversalLogger {
    constructor() {
        this.isVercel = process.env.VERCEL || process.env.NOW_REGION;
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.logs = []; // In-memory log storage for Vercel
    }

    // Core logging method that NEVER throws errors
    log(level, message, ...args) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data: args.length > 0 ? args : undefined
            };

            // Always log to console (works everywhere)
            const consoleMethod = console[level] || console.log;
            consoleMethod(
                `[${timestamp}] [${level.toUpperCase()}] ${message}`,
                ...args
            );

            // Store in memory for Vercel (no file system)
            if (this.isVercel) {
                this.logs.push(logEntry);
                // Keep only last 1000 logs to prevent memory issues
                if (this.logs.length > 1000) {
                    this.logs.shift();
                }
            }

            // Return success
            return true;
        } catch (error) {
            // Even if something fails, never throw
            console.error('Logger error (non-fatal):', error.message);
            return false;
        }
    }

    // Convenience methods that map to console
    error(message, ...args) {
        return this.log('error', message, ...args);
    }

    warn(message, ...args) {
        return this.log('warn', message, ...args);
    }

    info(message, ...args) {
        return this.log('info', message, ...args);
    }

    debug(message, ...args) {
        return this.log('debug', message, ...args);
    }

    // Get recent logs (useful for debugging in Vercel)
    getRecentLogs(count = 100) {
        return this.logs.slice(-count);
    }

    // Clear in-memory logs
    clearLogs() {
        this.logs = [];
    }

    // Safe child logger (returns same instance)
    child() {
        return this;
    }

    // Winston compatibility methods (no-ops that never fail)
    add() {
        return this;
    }
    remove() {
        return this;
    }
    configure() {
        return this;
    }
    level = 'info';
    transports = [];
}

// Create singleton instance
const logger = new UniversalLogger();

// Export both the instance and the class
module.exports = logger;
module.exports.UniversalLogger = UniversalLogger;

// Winston compatibility
module.exports.createLogger = () => logger;
module.exports.format = {
    combine: () => {},
    timestamp: () => {},
    errors: () => {},
    splat: () => {},
    json: () => {},
    colorize: () => {},
    simple: () => {},
    printf: () => {}
};
module.exports.transports = {
    Console: class Console {},
    File: class File {},
    Http: class Http {}
};
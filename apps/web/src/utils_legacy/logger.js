// =====================================================
// WINSTON LOGGER CONFIGURATION
// Structured logging for production systems
// =====================================================

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};

winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ` ${JSON.stringify(meta)}`;
        }
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Custom format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    defaultMeta: {
        service: 'flashfusion-orchestrator',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
    // Error logs - separate file for errors only
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Combined logs - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),

        // Console output
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: fileFormat
        })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: fileFormat
        })
    ]
});

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId: req.id
    };

    if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
    } else {
        logger.info('HTTP Request', logData);
    }
};

// Add orchestration-specific logging methods
logger.logOrchestration = (action, data) => {
    logger.info(`Orchestration: ${action}`, {
        action,
        ...data,
        timestamp: new Date().toISOString()
    });
};

logger.logAgentActivity = (agent, activity, data) => {
    logger.info(`Agent Activity: ${agent}`, {
        agent,
        activity,
        ...data,
        timestamp: new Date().toISOString()
    });
};

logger.logHandoff = (from, to, data) => {
    logger.info(`Handoff: ${from} -> ${to}`, {
        from,
        to,
        ...data,
        timestamp: new Date().toISOString()
    });
};

logger.logPerformance = (metric, value, metadata = {}) => {
    logger.info(`Performance: ${metric}`, {
        metric,
        value,
        ...metadata,
        timestamp: new Date().toISOString()
    });
};

// Add security logging
logger.logSecurity = (event, data) => {
    logger.warn(`Security Event: ${event}`, {
        event,
        ...data,
        timestamp: new Date().toISOString()
    });
};

// Add audit logging
logger.logAudit = (action, user, resource, data = {}) => {
    logger.info(`Audit: ${action}`, {
        action,
        user,
        resource,
        ...data,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;
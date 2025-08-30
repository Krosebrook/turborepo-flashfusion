/**
 * MCP Request Middleware
 * Handles request validation, rate limiting, and response formatting
 */

const MCPLogger = require('../utils/mcpLogger');

class MCPMiddleware {
    constructor(options = {}) {
        this.logger = new MCPLogger(options.logLevel || 'info');
        this.rateLimiter = new Map(); // Simple in-memory rate limiter
        this.maxRequestsPerMinute = options.maxRequestsPerMinute || 60;
        this.enableMetrics = options.enableMetrics !== false;
    }

    /**
     * Request validation middleware
     */
    validateRequest() {
        return (req, res, next) => {
            try {
                // Validate content type for POST requests
                if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
                    return res.status(400).json({
                        error: 'Content-Type must be application/json',
                        timestamp: new Date().toISOString()
                    });
                }

                // Add request ID for tracking
                req.mcpRequestId = Date.now().toString(36) + Math.random().toString(36).substr(2);

                this.logger.debug('MIDDLEWARE', 'Request validated', {
                    method: req.method,
                    url: req.url,
                    requestId: req.mcpRequestId
                });

                next();
            } catch (error) {
                this.logger.error('MIDDLEWARE', 'Request validation failed', { error: error.message });
                res.status(500).json({
                    error: 'Request validation failed',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * Rate limiting middleware
     */
    rateLimit() {
        return (req, res, next) => {
            try {
                const clientId = req.ip || 'unknown';
                const now = Date.now();
                const windowStart = now - 60000; // 1 minute window

                // Get or create client record
                if (!this.rateLimiter.has(clientId)) {
                    this.rateLimiter.set(clientId, []);
                }

                const requests = this.rateLimiter.get(clientId);

                // Remove old requests outside the window
                const recentRequests = requests.filter(timestamp => timestamp > windowStart);

                // Check rate limit
                if (recentRequests.length >= this.maxRequestsPerMinute) {
                    this.logger.warn('MIDDLEWARE', 'Rate limit exceeded', {
                        clientId,
                        requests: recentRequests.length
                    });

                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        retryAfter: 60,
                        timestamp: new Date().toISOString()
                    });
                }

                // Add current request
                recentRequests.push(now);
                this.rateLimiter.set(clientId, recentRequests);

                // Add rate limit headers
                res.setHeader('X-RateLimit-Limit', this.maxRequestsPerMinute);
                res.setHeader('X-RateLimit-Remaining', this.maxRequestsPerMinute - recentRequests.length);
                res.setHeader('X-RateLimit-Reset', new Date(now + 60000).toISOString());

                next();
            } catch (error) {
                this.logger.error('MIDDLEWARE', 'Rate limiting failed', { error: error.message });
                next(); // Continue on rate limiter error
            }
        };
    }

    /**
     * Request logging middleware
     */
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Log request
            this.logger.info('REQUEST', 'Incoming request', {
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                requestId: req.mcpRequestId
            });

            // Override res.end to log response
            const originalEnd = res.end;
            res.end = (...args) => {
                const duration = Date.now() - startTime;

                this.logger.info('RESPONSE', 'Request completed', {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    requestId: req.mcpRequestId
                });

                originalEnd.apply(res, args);
            };

            next();
        };
    }

    /**
     * Error handling middleware
     */
    errorHandler() {
        return (error, req, res, _next) => {
            this.logger.error('MIDDLEWARE', 'Request error', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                requestId: req.mcpRequestId
            });

            // Don't expose internal errors in production
            const isDevelopment = process.env.NODE_ENV === 'development';

            res.status(error.status || 500).json({
                error: error.message || 'Internal server error',
                requestId: req.mcpRequestId,
                timestamp: new Date().toISOString(),
                ...(isDevelopment && { stack: error.stack })
            });
        };
    }

    /**
     * Response formatting middleware
     */
    responseFormatter() {
        return (req, res, next) => {
            // Add helper method for consistent JSON responses
            res.mcpSuccess = (data, message = 'Success') => {
                res.json({
                    success: true,
                    message,
                    data,
                    requestId: req.mcpRequestId,
                    timestamp: new Date().toISOString()
                });
            };

            res.mcpError = (message, status = 500, details = null) => {
                res.status(status).json({
                    success: false,
                    error: message,
                    details,
                    requestId: req.mcpRequestId,
                    timestamp: new Date().toISOString()
                });
            };

            next();
        };
    }

    /**
     * CORS middleware
     */
    cors() {
        return (req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }

            next();
        };
    }

    /**
     * Security headers middleware
     */
    securityHeaders() {
        return (req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            res.setHeader('Content-Security-Policy', 'default-src \'self\'');

            next();
        };
    }

    /**
     * Get all middleware as an array
     */
    getAllMiddleware() {
        return [
            this.cors(),
            this.securityHeaders(),
            this.validateRequest(),
            this.rateLimit(),
            this.requestLogger(),
            this.responseFormatter()
        ];
    }

    /**
     * Cleanup rate limiter entries
     */
    cleanup() {
        const now = Date.now();
        const windowStart = now - 60000;

        for (const [clientId, requests] of this.rateLimiter.entries()) {
            const recentRequests = requests.filter(timestamp => timestamp > windowStart);

            if (recentRequests.length === 0) {
                this.rateLimiter.delete(clientId);
            } else {
                this.rateLimiter.set(clientId, recentRequests);
            }
        }
    }
}

module.exports = MCPMiddleware;
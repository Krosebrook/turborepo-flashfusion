const logger = require('./logger');

class ErrorHandler {
    static createApiError(message, statusCode = 500, errorCode = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.errorCode = errorCode;
        error.timestamp = new Date().toISOString();
        return error;
    }

    static async handleAsync(asyncFn, context = 'operation') {
        try {
            return await asyncFn();
        } catch (error) {
            logger.error(`Error in ${context}:`, {
                message: error.message,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    static wrapAsync(asyncFn, context = 'operation') {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                logger.error(`Error in ${context}:`, {
                    message: error.message,
                    stack: error.stack,
                    context,
                    args: args.length,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        };
    }

    static createServiceErrorHandler(serviceName) {
        return {
            async execute(operation, operationName = 'unknown') {
                try {
                    return await operation();
                } catch (error) {
                    logger.error(`${serviceName} error:`, {
                        operation: operationName,
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    });

                    if (error.statusCode) {
                        throw error;
                    }

                    throw ErrorHandler.createApiError(
                        `${serviceName} ${operationName} failed: ${error.message}`,
                        500,
                        `${serviceName.toUpperCase()}_ERROR`
                    );
                }
            },

            createError(message, statusCode = 500) {
                return ErrorHandler.createApiError(
                    `${serviceName}: ${message}`,
                    statusCode,
                    `${serviceName.toUpperCase()}_ERROR`
                );
            }
        };
    }

    static expressErrorHandler(serviceName) {
        return (error, req, res, _next) => {
            logger.error(`${serviceName} API Error:`, {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                timestamp: new Date().toISOString()
            });

            const statusCode = error.statusCode || 500;
            const message = process.env.NODE_ENV === 'development'
                ? error.message
                : 'Something went wrong';

            res.status(statusCode).json({
                success: false,
                error: message,
                errorCode: error.errorCode,
                timestamp: new Date().toISOString(),
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        };
    }

    static handleDatabaseError(error) {
        if (error.code === '23505') {
            return ErrorHandler.createApiError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
        }

        if (error.code === '23503') {
            return ErrorHandler.createApiError('Foreign key constraint violation', 400, 'CONSTRAINT_VIOLATION');
        }

        if (error.code === 'ECONNREFUSED') {
            return ErrorHandler.createApiError('Database connection refused', 503, 'DB_CONNECTION_ERROR');
        }

        return ErrorHandler.createApiError(`Database error: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    static handleValidationErrors(errors) {
        const formattedErrors = errors.map(err => ({
            field: err.path || err.param,
            message: err.msg || err.message,
            value: err.value
        }));

        const error = ErrorHandler.createApiError('Validation failed', 400, 'VALIDATION_ERROR');
        error.details = formattedErrors;
        return error;
    }
}

module.exports = ErrorHandler;
/**
 * FlashFusion Security Middleware
 * Express middleware for implementing comprehensive security measures
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SecurityHeaders, AuthenticationManager, RateLimitManager, AuditLogger } from '../utils/supabase-security-fixes.js';

/**
 * Security Headers Middleware
 */
export function securityHeadersMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
          "https://js.stripe.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://api.anthropic.com",
          "https://api.openai.com",
          "https://api.stripe.com"
        ],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
}

/**
 * Rate Limiting Middleware
 */
export function createRateLimitMiddleware(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    handler: async (req, res) => {
      // Log rate limit violations
      await AuditLogger.logSecurityEvent(
        'rate_limit_exceeded',
        req.user?.id || 'anonymous',
        'high',
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }
      );

      res.status(429).json({
        error: message,
        retryAfter: windowMs / 1000
      });
    }
  });
}

/**
 * Authentication Middleware
 */
export async function authenticationMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const user = await AuthenticationManager.validateSession(token);
    req.user = user;

    // Log authentication events
    if (user) {
      await AuditLogger.logEvent(
        'auth_validated',
        user.id,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        }
      );
    }

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    // Log failed authentication
    await AuditLogger.logSecurityEvent(
      'auth_validation_failed',
      'unknown',
      'medium',
      {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    req.user = null;
    next();
  }
}

/**
 * Authorization Middleware - Requires Authentication
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }
  next();
}

/**
 * Admin Authorization Middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  // Check if user has admin role
  // This would typically check against your user_roles table
  if (!req.user.app_metadata?.role === 'admin' && !req.user.user_metadata?.role === 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'FORBIDDEN'
    });
  }

  next();
}

/**
 * Input Validation Middleware
 */
export function validateInput(schema) {
  return (req, res, next) => {
    try {
      const { DataValidator } = require('../utils/supabase-security-fixes.js');
      
      // Validate and sanitize request body
      if (schema.body && req.body) {
        req.body = DataValidator.validateAndSanitize(req.body, schema.body);
      }

      // Validate query parameters
      if (schema.query && req.query) {
        req.query = DataValidator.validateAndSanitize(req.query, schema.query);
      }

      // Validate URL parameters
      if (schema.params && req.params) {
        req.params = DataValidator.validateAndSanitize(req.params, schema.params);
      }

      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

/**
 * Audit Logging Middleware
 */
export function auditMiddleware(eventType) {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the event after response is sent
      setImmediate(async () => {
        try {
          await AuditLogger.logEvent(
            eventType,
            req.user?.id || 'anonymous',
            {
              method: req.method,
              path: req.path,
              query: req.query,
              body: req.method !== 'GET' ? req.body : undefined,
              statusCode: res.statusCode,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              responseTime: Date.now() - req.startTime
            },
            req.ip
          );
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });

      originalSend.call(this, data);
    };

    req.startTime = Date.now();
    next();
  };
}

/**
 * Error Handling Middleware
 */
export function errorHandlingMiddleware(err, req, res, next) {
  console.error('Request error:', err);

  // Log security-related errors
  if (err.code === 'EBADCSRFTOKEN' || err.status === 403) {
    AuditLogger.logSecurityEvent(
      'security_error',
      req.user?.id || 'anonymous',
      'high',
      {
        error: err.message,
        stack: err.stack,
        ip: req.ip,
        endpoint: req.path
      }
    );
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  };

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json(errorResponse);
}

/**
 * Request Logging Middleware
 */
export function requestLoggingMiddleware(req, res, next) {
  const start = Date.now();
  
  console.log(`${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

/**
 * CORS Configuration
 */
export function corsMiddleware() {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://flashfusion.ai',
    'https://www.flashfusion.ai',
    'https://app.flashfusion.ai',
    'https://flashfusion-unified.vercel.app'
  ];

  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  };
}

/**
 * Security Middleware Suite - Apply all security measures
 */
export function applySecurityMiddleware(app) {
  // Request logging
  app.use(requestLoggingMiddleware);
  
  // CORS
  app.use(corsMiddleware());
  
  // Security headers
  app.use(securityHeadersMiddleware());
  
  // Authentication (sets req.user)
  app.use(authenticationMiddleware);
  
  // Rate limiting
  app.use('/api/', createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
  }));

  // Stricter rate limiting for auth endpoints
  app.use('/api/auth/', createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 auth requests per 15 minutes
  }));

  console.log('✅ Security middleware applied successfully');
}

export default {
  applySecurityMiddleware,
  securityHeadersMiddleware,
  createRateLimitMiddleware,
  authenticationMiddleware,
  requireAuth,
  requireAdmin,
  validateInput,
  auditMiddleware,
  errorHandlingMiddleware,
  requestLoggingMiddleware,
  corsMiddleware
};
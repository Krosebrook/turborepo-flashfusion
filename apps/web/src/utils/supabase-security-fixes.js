/**
 * FlashFusion Supabase Security & Performance Layer
 * Comprehensive security and performance utilities for Supabase integration
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Initialize Supabase client with security configurations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create clients
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'flashfusion-unified'
    }
  }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

/**
 * Security Headers Manager
 */
export class SecurityHeaders {
  static getSecurityHeaders() {
    return {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.openai.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
      `.replace(/\s+/g, ' ').trim(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }

  static applyHeaders(response) {
    const headers = this.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
    return response;
  }
}

/**
 * Data Validator with comprehensive validation rules
 */
export class DataValidator {
  static validateSchema(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip other validations if field is not required and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }

      // String validations
      if (rules.type === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Number validations
      if (rules.type === 'number') {
        if (rules.min && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max && value > rules.max) {
          errors.push(`${field} must be no more than ${rules.max}`);
        }
      }

      // Array validations
      if (rules.type === 'object' && Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${field} must have no more than ${rules.maxItems} items`);
        }
      }

      // Email validation
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    return input;
  }

  static validateAndSanitize(data, schema) {
    // First sanitize the data
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = this.sanitizeInput(value);
    }

    // Then validate
    this.validateSchema(sanitized, schema);
    return sanitized;
  }
}

/**
 * Rate Limiting Manager
 */
export class RateLimitManager {
  static async checkRateLimit(userId, action, timeWindow = 60000, maxRequests = 60) {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
        target_user_id: userId,
        action_name: action,
        time_window_ms: timeWindow,
        max_requests: maxRequests
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail safe - allow request if rate limit check fails
      return true;
    }
  }

  static async recordRequest(userId, action, metadata = {}) {
    try {
      await supabaseAdmin.from('rate_limit_logs').insert({
        user_id: userId,
        action: action,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to record rate limit:', error);
    }
  }
}

/**
 * Authentication Manager with enhanced security
 */
export class AuthenticationManager {
  static async signUp(email, password, userData = {}) {
    try {
      // Validate input
      DataValidator.validateSchema({ email, password, ...userData }, {
        email: { required: true, type: 'string', email: true, maxLength: 255 },
        password: { required: true, type: 'string', minLength: 8, maxLength: 128 },
        name: { type: 'string', maxLength: 100 }
      });

      // Check rate limit
      const canProceed = await RateLimitManager.checkRateLimit(
        email, 'signup', 300000, 3 // 3 attempts per 5 minutes
      );

      if (!canProceed) {
        throw new Error('Too many signup attempts. Please try again later.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Record the attempt
      await RateLimitManager.recordRequest(email, 'signup', { success: true });

      return data;
    } catch (error) {
      await RateLimitManager.recordRequest(email, 'signup', { success: false, error: error.message });
      throw error;
    }
  }

  static async signIn(email, password) {
    try {
      // Check rate limit
      const canProceed = await RateLimitManager.checkRateLimit(
        email, 'signin', 300000, 5 // 5 attempts per 5 minutes
      );

      if (!canProceed) {
        throw new Error('Too many signin attempts. Please try again later.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Record successful attempt
      await RateLimitManager.recordRequest(email, 'signin', { success: true });

      return data;
    } catch (error) {
      await RateLimitManager.recordRequest(email, 'signin', { success: false, error: error.message });
      throw error;
    }
  }

  static async validateSession(token) {
    try {
      if (!token) return null;

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) return null;

      // Additional session validation
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session) return null;

      return user;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }

  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw error;
    }
  }
}

/**
 * Performance Optimizer for Supabase queries
 */
export class SupabasePerformanceOptimizer {
  static async optimizedSelect(table, filters = {}, options = {}) {
    try {
      let query = supabase.from(table).select(options.select || '*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.operator) {
          switch (value.operator) {
            case 'gte':
              query = query.gte(key, value.value);
              break;
            case 'lte':
              query = query.lte(key, value.value);
              break;
            case 'like':
              query = query.like(key, value.value);
              break;
            case 'ilike':
              query = query.ilike(key, value.value);
              break;
            default:
              query = query.eq(key, value.value);
          }
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Optimized select failed:', error);
      throw error;
    }
  }

  static async batchInsert(table, records, chunkSize = 100) {
    try {
      const results = [];
      
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from(table)
          .insert(chunk)
          .select();

        if (error) throw error;
        results.push(...data);
      }

      return results;
    } catch (error) {
      console.error('Batch insert failed:', error);
      throw error;
    }
  }
}

/**
 * Realtime Security Manager
 */
export class RealtimeSecurityManager {
  static subscribeToSecureChannel(table, userId, filters = {}) {
    return supabase
      .channel(`secure_${table}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Additional security check on the client side
          if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
            console.log('Secure realtime update:', payload);
          }
        }
      )
      .subscribe();
  }
}

/**
 * Audit Logger
 */
export class AuditLogger {
  static async logEvent(eventType, userId, details = {}, ipAddress = null) {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        event_type: eventType,
        user_id: userId,
        details: details,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  static async logSecurityEvent(eventType, userId, severity = 'medium', details = {}) {
    await this.logEvent(`security_${eventType}`, userId, {
      ...details,
      severity: severity,
      category: 'security'
    });
  }
}

/**
 * Encryption Utilities
 */
export class EncryptionUtils {
  static encrypt(text) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from('flashfusion', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  static decrypt(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('flashfusion', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
}

/**
 * Initialize security systems
 */
export async function initializeSecureSupabase() {
  try {
    console.log('🔐 Initializing FlashFusion Security Layer...');

    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Test database connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is ok
      console.warn('Database connection test failed:', error.message);
    }

    console.log('✅ FlashFusion Security Layer initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize security layer:', error);
    throw error;
  }
}

// Export the configured client as default
export default supabase;
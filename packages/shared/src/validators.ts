/**
 * Validation schemas and utilities
 */

import { VALIDATION_RULES } from './constants';

// Simple validation functions (no external dependencies for now)

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = VALIDATION_RULES.password;
  
  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }
  
  if (password.length > rules.maxLength) {
    errors.push(`Password must be no more than ${rules.maxLength} characters long`);
  }
  
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = VALIDATION_RULES.username;
  
  if (username.length < rules.minLength) {
    errors.push(`Username must be at least ${rules.minLength} characters long`);
  }
  
  if (username.length > rules.maxLength) {
    errors.push(`Username must be no more than ${rules.maxLength} characters long`);
  }
  
  if (!rules.pattern.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  }).map(field => String(field));
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate object against a schema
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validator?: (value: T[K]) => boolean;
  };
};

export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: ValidationSchema<T>
): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    const fieldErrors: string[] = [];
    
    // Required field check
    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${key} is required`);
      continue;
    }
    
    // Skip further validation if field is not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        fieldErrors.push(`${key} must be of type ${rules.type}`);
      }
    }
    
    // String-specific validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`${key} must be at least ${rules.minLength} characters long`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`${key} must be no more than ${rules.maxLength} characters long`);
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(`${key} format is invalid`);
      }
    }
    
    // Custom validator
    if (rules.validator && !rules.validator(value)) {
      fieldErrors.push(`${key} is invalid`);
    }
    
    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
/**
 * Application constants and configuration values
 */

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/api/users',
  AUTH: '/api/auth',
  WORKFLOWS: '/api/workflows',
  AGENTS: '/api/agents',
  EXECUTIONS: '/api/executions',
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTHENTICATION_FAILED: 'AUTH_001',
  AUTHORIZATION_FAILED: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  
  // Validation errors
  VALIDATION_FAILED: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_REQUIRED_FIELD: 'VAL_003',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'SRV_001',
  SERVICE_UNAVAILABLE: 'SRV_002',
  DATABASE_ERROR: 'SRV_003',
  
  // Agent errors
  AGENT_EXECUTION_FAILED: 'AGT_001',
  WORKFLOW_NOT_FOUND: 'AGT_002',
  AGENT_TIMEOUT: 'AGT_003',
} as const;

// Default pagination settings
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

// Validation rules
export const VALIDATION_RULES = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  email: {
    maxLength: 254,
  },
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
} as const;

// Application limits
export const APP_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxUploadFiles: 5,
  maxWorkflowSteps: 50,
  maxConcurrentExecutions: 10,
} as const;

// Theme configuration
export const THEME_CONFIG = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
} as const;

// Date and time formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
} as const;

// Environment-specific constants
export const ENVIRONMENT = {
  development: {
    apiTimeout: 30000,
    retryAttempts: 3,
    logLevel: 'debug',
  },
  staging: {
    apiTimeout: 15000,
    retryAttempts: 3,
    logLevel: 'info',
  },
  production: {
    apiTimeout: 10000,
    retryAttempts: 2,
    logLevel: 'error',
  },
} as const;
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  bcryptRounds?: number;
  apiKeyLength?: number;
}

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    max: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  helmet: {
    contentSecurityPolicy?: boolean;
    crossOriginEmbedderPolicy?: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success: boolean;
}
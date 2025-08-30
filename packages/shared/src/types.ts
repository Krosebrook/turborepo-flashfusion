/**
 * Common TypeScript types and interfaces for FlashFusion applications
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
export interface User extends BaseEntity {
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  preferences: UserPreferences;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Agent and workflow types
export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  dependencies?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';

export interface AgentExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Database entity types
export interface DatabaseEntity extends BaseEntity {
  version: number;
  deletedAt?: Date;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  integrations: IntegrationConfig;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface IntegrationConfig {
  anthropic?: {
    apiKey: string;
    model: string;
  };
  supabase?: {
    url: string;
    key: string;
  };
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export interface BaseConfig {
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  logLevel: LogLevel;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
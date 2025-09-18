import { z } from 'zod';

// API Key validation schemas
const apiKeySchema = z.string().min(10).max(200);

/**
 * Validates API key format
 */
export function validateApiKey(apiKey: string): boolean {
  try {
    apiKeySchema.parse(apiKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes API key for logging (shows only first/last 4 characters)
 */
export function sanitizeApiKey(apiKey: string): string {
  if (apiKey.length < 8) {
    return '***';
  }
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
import { FlashFusionApiClient } from './FlashFusionApiClient';
import { ApiClientConfig } from '../types/client';

/**
 * Factory function to create a configured API client instance
 */
export function createApiClient(config: ApiClientConfig): FlashFusionApiClient {
  return new FlashFusionApiClient(config);
}

/**
 * Create API client with environment variables
 */
export function createApiClientFromEnv(): FlashFusionApiClient {
  const baseURL = process.env.FLASHFUSION_API_URL || 'http://localhost:3001';
  const apiKey = process.env.FLASHFUSION_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ No API key found in environment variables. Some features may be limited.');
  }

  return createApiClient({
    baseURL,
    apiKey,
    timeout: parseInt(process.env.FLASHFUSION_API_TIMEOUT || '30000'),
  });
}
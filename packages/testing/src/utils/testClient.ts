import { TestEnvironment } from '../types';

/**
 * Create a test API client with test configuration
 */
export function createTestClient(env: TestEnvironment): any {
  // In a real implementation, this would return FlashFusionApiClient
  return {
    baseURL: env.apiBaseUrl,
    apiKey: process.env.TEST_API_KEY || 'test-key',
    timeout: 5000,
    // Mock implementation
    healthCheck: async () => ({ status: 'ok' }),
    createAgentTask: async (task: any) => ({ ...task, id: 'mock-id' })
  };
}

/**
 * Create test client with authentication
 */
export function createAuthenticatedTestClient(env: TestEnvironment, _apiKey: string): any {
  return createTestClient(env);
}
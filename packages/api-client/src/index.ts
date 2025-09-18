// API Client Library
export { FlashFusionApiClient } from './client/FlashFusionApiClient';
export { createApiClient } from './client/factory';

// Types
export type { 
  ApiClientConfig,
  ApiResponse,
  RequestOptions 
} from './types/client';

export type {
  AgentTask,
  AgentResult,
  WorkflowConfig,
  ProjectContext
} from './types/api';

// Utilities
export { validateApiKey } from './utils/validation';
export { ApiError } from './utils/errors';
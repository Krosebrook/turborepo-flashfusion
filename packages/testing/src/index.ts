// Testing utilities
export { createTestClient } from './utils/testClient';
export { setupTestEnvironment, cleanupTestEnvironment } from './utils/setup';
export { waitFor, waitForElement } from './utils/async';

// Mock utilities
export { createMockAgent } from './mocks/agent';
export { createMockApiClient } from './mocks/apiClient';
export { createMockWorkflow } from './mocks/workflow';

// Test fixtures (commented out until we have the files)
// export { userFixtures } from './fixtures/user';
// export { projectFixtures } from './fixtures/project';
// export { workflowFixtures } from './fixtures/workflow';

// Test helpers
export { renderWithProviders } from './utils/render';
export { createMockServer } from './utils/mockServer';

// Types
export type { 
  TestEnvironment,
  MockOptions,
  TestFixture 
} from './types';
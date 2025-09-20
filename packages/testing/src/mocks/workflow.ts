/**
 * Create a mock workflow for testing
 */
export function createMockWorkflow() {
  return {
    id: 'mock-workflow-1',
    name: 'Mock Workflow',
    description: 'A workflow for testing',
    steps: [
      {
        id: 'step-1',
        type: 'agent',
        config: { agentType: 'mock' },
        dependencies: []
      }
    ],
    triggers: [
      {
        type: 'manual',
        config: {}
      }
    ],
    execute: async () => ({
      executionId: 'mock-execution-1',
      status: 'success' as const,
      result: { message: 'Mock workflow completed' }
    })
  };
}
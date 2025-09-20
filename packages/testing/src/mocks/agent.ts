/**
 * Create a mock agent for testing
 */
export function createMockAgent() {
  return {
    id: 'mock-agent-1',
    name: 'Mock Agent',
    type: 'test',
    execute: async (task: any) => ({
      taskId: task.id,
      agentId: 'mock-agent-1',
      status: 'success' as const,
      output: { result: 'mock result' },
      executionTime: 100,
      timestamp: new Date().toISOString()
    }),
    canHandle: () => true
  };
}
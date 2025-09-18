/**
 * Create a mock API client for testing
 */
export function createMockApiClient() {
  return {
    healthCheck: async () => ({
      data: { status: 'ok', timestamp: new Date().toISOString() },
      status: 200,
      statusText: 'OK',
      headers: {}
    }),
    createAgentTask: async (task: any) => ({
      data: { ...task, id: 'mock-task-1' },
      status: 201,
      statusText: 'Created',
      headers: {}
    }),
    getAgentTask: async (taskId: string) => ({
      data: { id: taskId, status: 'completed' },
      status: 200,
      statusText: 'OK',
      headers: {}
    })
  };
}
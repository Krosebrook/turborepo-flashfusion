/**
 * Create a mock server for testing
 */
export function createMockServer() {
  return {
    start: async (port: number = 3001) => {
      console.log(`Mock server started on port ${port}`);
    },
    stop: async () => {
      console.log('Mock server stopped');
    },
    reset: () => {
      console.log('Mock server reset');
    }
  };
}
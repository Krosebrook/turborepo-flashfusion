// FlashFusion Testing Utilities
// Common testing utilities and helpers

export const createMockApiClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  createMockApiClient,
  createMockUser,
  waitFor,
};
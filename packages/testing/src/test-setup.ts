import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.FLASHFUSION_API_URL = 'http://localhost:3001';
process.env.TEST_USE_MOCKS = 'true';
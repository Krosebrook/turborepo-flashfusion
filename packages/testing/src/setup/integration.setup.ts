// Integration test setup
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup integration test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Initialize test containers if needed
  console.log('Setting up integration test environment...');
});

afterAll(async () => {
  // Cleanup test environment
  console.log('Cleaning up integration test environment...');
});
import { TestDatabase } from '../types';

export function mockDatabase(overrides: Partial<TestDatabase> = {}): TestDatabase {
  return {
    type: 'mock',
    isConnected: true,
    pool: {
      query: async (sql: string, params?: any[]) => {
        // Mock successful query response
        return {
          rows: [],
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
        };
      },
      connect: async () => ({
        query: async (sql: string, params?: any[]) => ({
          rows: [],
          rowCount: 0
        }),
        release: () => {}
      }),
      end: async () => {}
    },
    ...overrides
  };
}

export function mockPostgreSQLDatabase(overrides: Partial<TestDatabase> = {}): TestDatabase {
  return mockDatabase({
    type: 'postgresql',
    connectionString: 'postgresql://test:test@localhost:5432/test_db',
    ...overrides
  });
}

export function mockSupabaseDatabase(overrides: Partial<TestDatabase> = {}): TestDatabase {
  return mockDatabase({
    type: 'supabase',
    connectionString: 'https://test.supabase.co',
    ...overrides
  });
}
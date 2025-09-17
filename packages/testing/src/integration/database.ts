import { createTestDatabase, TestDatabaseManager } from '../utils/test-database';
import { TestDatabase } from '../types';

export interface TestDatabaseSetup {
  database: TestDatabaseManager;
  cleanup: () => Promise<void>;
}

export async function setupTestDB(type: 'postgresql' | 'supabase' | 'mock' = 'mock'): Promise<TestDatabaseSetup> {
  let connectionString: string | undefined;
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;

  // Set up test database connection based on type
  switch (type) {
    case 'postgresql':
      connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_flashfusion';
      break;
    case 'supabase':
      supabaseUrl = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co';
      supabaseKey = process.env.TEST_SUPABASE_KEY || 'test-key';
      break;
    case 'mock':
      // Mock database doesn't need real connection
      break;
  }

  const database = createTestDatabase({
    type,
    connectionString,
    supabaseUrl,
    supabaseKey
  });

  try {
    await database.connect();
    
    // Set up test schema/tables if needed
    if (type === 'postgresql' && database.getClient()) {
      await setupTestTables(database);
    }

    return {
      database,
      cleanup: async () => {
        if (type === 'postgresql') {
          await cleanupTestTables(database);
        }
        await database.disconnect();
      }
    };
  } catch (error) {
    console.warn(`Failed to connect to ${type} database, falling back to mock:`, error);
    
    // Fallback to mock database
    const mockDatabase = createTestDatabase({ type: 'mock' });
    await mockDatabase.connect();
    
    return {
      database: mockDatabase,
      cleanup: async () => {
        await mockDatabase.disconnect();
      }
    };
  }
}

async function setupTestTables(database: TestDatabaseManager): Promise<void> {
  const createTables = `
    CREATE TABLE IF NOT EXISTS test_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_workflows (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      configuration JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_agents (
      id SERIAL PRIMARY KEY,
      agent_id VARCHAR(100) UNIQUE NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'idle',
      capabilities JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await database.query(createTables);
}

async function cleanupTestTables(database: TestDatabaseManager): Promise<void> {
  const dropTables = `
    DROP TABLE IF EXISTS test_agents;
    DROP TABLE IF EXISTS test_workflows;
    DROP TABLE IF EXISTS test_users;
  `;

  try {
    await database.query(dropTables);
  } catch (error) {
    console.warn('Error cleaning up test tables:', error);
  }
}
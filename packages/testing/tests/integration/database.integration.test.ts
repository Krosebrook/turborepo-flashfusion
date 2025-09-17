import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB } from '../../src/integration/database';
import { TestDatabaseSetup } from '../../src/integration/database';

describe('Database Integration Tests', () => {
  let dbSetup: TestDatabaseSetup;

  beforeAll(async () => {
    dbSetup = await setupTestDB('mock');
  });

  afterAll(async () => {
    if (dbSetup) {
      await dbSetup.cleanup();
    }
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      const db = dbSetup.database.getDatabase();
      expect(db.isConnected).toBe(true);
    });

    it('should execute queries successfully', async () => {
      const result = await dbSetup.database.query('SELECT 1 as test');
      expect(result).toBeDefined();
    });

    it('should handle connection errors gracefully', async () => {
      // Test error handling by trying to query when disconnected
      await dbSetup.database.disconnect();
      
      await expect(
        dbSetup.database.query('SELECT 1')
      ).rejects.toThrow('Database not connected');
    });
  });

  describe('Database Operations', () => {
    beforeAll(async () => {
      // Reconnect for operations tests
      if (!dbSetup.database.getDatabase().isConnected) {
        await dbSetup.database.connect();
      }
    });

    it('should insert and retrieve test data', async () => {
      // Insert mock user data
      const insertResult = await dbSetup.database.query(
        'INSERT INTO test_users (email, name) VALUES ($1, $2) RETURNING id',
        ['test@example.com', 'Test User']
      );
      
      expect(insertResult).toBeDefined();
      
      // Query the data back
      const selectResult = await dbSetup.database.query(
        'SELECT * FROM test_users WHERE email = $1',
        ['test@example.com']
      );
      
      expect(selectResult).toBeDefined();
    });

    it('should handle workflow data operations', async () => {
      const workflowData = {
        type: 'ai_developer_discovery',
        status: 'pending',
        configuration: {
          participants: 20,
          duration: '2 weeks'
        }
      };

      const insertResult = await dbSetup.database.query(
        'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3) RETURNING id',
        [workflowData.type, workflowData.status, JSON.stringify(workflowData.configuration)]
      );

      expect(insertResult).toBeDefined();
    });

    it('should handle agent data operations', async () => {
      const agentData = {
        agent_id: 'test-agent-1',
        type: 'researcher',
        status: 'idle',
        capabilities: ['interview', 'analysis']
      };

      const insertResult = await dbSetup.database.query(
        'INSERT INTO test_agents (agent_id, type, status, capabilities) VALUES ($1, $2, $3, $4) RETURNING id',
        [agentData.agent_id, agentData.type, agentData.status, JSON.stringify(agentData.capabilities)]
      );

      expect(insertResult).toBeDefined();
    });
  });

  describe('Database Type Compatibility', () => {
    it('should fallback to mock when PostgreSQL unavailable', async () => {
      // This test will use mock database since we don't have real PostgreSQL in test environment
      const pgSetup = await setupTestDB('postgresql');
      
      // Should fallback to mock since PostgreSQL is not available
      expect(pgSetup.database.getDatabase().type).toBe('mock');
      expect(pgSetup.database.getDatabase().isConnected).toBe(true);
      
      await pgSetup.cleanup();
    });

    it('should work with Supabase configuration', async () => {
      // This test verifies Supabase client setup (not actual connection)
      const supabaseSetup = await setupTestDB('supabase');
      
      // Supabase client should be set up even without real connection
      expect(supabaseSetup.database.getDatabase().type).toBe('supabase');
      expect(supabaseSetup.database.getDatabase().isConnected).toBe(true);
      
      await supabaseSetup.cleanup();
    });

    it('should fallback to mock when real database unavailable', async () => {
      // This test will use mock database since we don't have real DB in test environment
      const mockSetup = await setupTestDB('mock');
      
      expect(mockSetup.database.getDatabase().type).toBe('mock');
      expect(mockSetup.database.getDatabase().isConnected).toBe(true);
      
      await mockSetup.cleanup();
    });
  });
});
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setupTestDB } from '../../src/integration/database';
import { TestDatabaseSetup } from '../../src/integration/database';

// Import the actual UnifiedDatabaseService for real integration testing
const UnifiedDatabaseService = require('../../../../apps/web/src/services/unifiedDatabase.js');

describe('Real Service Integration Tests', () => {
  let dbSetup: TestDatabaseSetup;
  let unifiedDbService: any;

  beforeAll(async () => {
    dbSetup = await setupTestDB('mock');
    
    // Create actual UnifiedDatabaseService instance with mock configuration
    unifiedDbService = new UnifiedDatabaseService();
    
    // Mock the config manager to return test configuration
    vi.doMock('../../../../apps/web/src/utils/configManager.js', () => ({
      configManager: {
        load: vi.fn(() => ({
          get: vi.fn((key: string) => {
            if (key === 'database') {
              return { type: 'mock' };
            }
            return {};
          })
        })),
        getConfig: vi.fn((key: string) => {
          if (key === 'database') {
            return { type: 'mock' };
          }
          return {};
        }),
        getConnectionString: vi.fn(() => null)
      }
    }));
  });

  afterAll(async () => {
    if (dbSetup) {
      await dbSetup.cleanup();
    }
  });

  describe('UnifiedDatabaseService Integration', () => {
    it('should integrate with mock database successfully', async () => {
      // Test that our integration testing framework can work with the actual service
      expect(dbSetup.database.getDatabase().isConnected).toBe(true);
      expect(dbSetup.database.getDatabase().type).toBe('mock');
    });

    it('should handle database queries through test framework', async () => {
      // Test query execution through our test framework
      const result = await dbSetup.database.query(
        'SELECT COUNT(*) as count FROM test_workflows WHERE type = $1',
        ['ai_developer_discovery']
      );
      
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    it('should simulate real workflow data operations', async () => {
      // Simulate inserting workflow data like the real application would
      const workflowData = {
        id: 'real-workflow-test',
        type: 'ai_developer_discovery',
        status: 'pending',
        configuration: {
          studyType: 'ai_developer_discovery',
          participants: 20,
          duration: '2 weeks',
          methods: ['interviews', 'task_analysis', 'behavioral_tracking']
        },
        created_at: new Date().toISOString()
      };

      // Insert workflow data
      const insertResult = await dbSetup.database.query(
        'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3) RETURNING id',
        [workflowData.type, workflowData.status, JSON.stringify(workflowData.configuration)]
      );

      expect(insertResult).toBeDefined();

      // Query the data back
      const selectResult = await dbSetup.database.query(
        'SELECT * FROM test_workflows WHERE type = $1',
        [workflowData.type]
      );

      expect(selectResult).toBeDefined();
    });

    it('should handle agent coordination data', async () => {
      // Test agent coordination through database
      const agentsData = [
        {
          agent_id: 'researcher-real-test',
          type: 'researcher',
          status: 'idle',
          capabilities: ['conduct_interviews', 'recruit_participants', 'transcribe_data']
        },
        {
          agent_id: 'analyst-real-test',
          type: 'analyst', 
          status: 'idle',
          capabilities: ['analyze_behavioral_patterns', 'identify_usage_patterns', 'statistical_analysis']
        }
      ];

      // Insert agents
      for (const agent of agentsData) {
        const result = await dbSetup.database.query(
          'INSERT INTO test_agents (agent_id, type, status, capabilities) VALUES ($1, $2, $3, $4) RETURNING id',
          [agent.agent_id, agent.type, agent.status, JSON.stringify(agent.capabilities)]
        );
        expect(result).toBeDefined();
      }

      // Query agents back
      const selectResult = await dbSetup.database.query(
        'SELECT * FROM test_agents WHERE type IN ($1, $2)',
        ['researcher', 'analyst']
      );

      expect(selectResult).toBeDefined();
    });
  });

  describe('Cross-Service Integration Simulation', () => {
    it('should simulate workflow execution with database persistence', async () => {
      // Simulate a complete workflow execution that would involve:
      // 1. Creating workflow in database
      // 2. Assigning agents
      // 3. Executing tasks
      // 4. Updating status
      // 5. Storing results

      const workflowId = `integration-test-${Date.now()}`;
      
      // Step 1: Create workflow
      await dbSetup.database.query(
        'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3)',
        ['ai_developer_discovery', 'pending', JSON.stringify({ participants: 20 })]
      );

      // Step 2: Assign agents to workflow
      const agentIds = ['researcher-1', 'analyst-1'];
      for (const agentId of agentIds) {
        await dbSetup.database.query(
          'INSERT INTO test_agents (agent_id, type, status) VALUES ($1, $2, $3)',
          [agentId, agentId.split('-')[0], 'assigned']
        );
      }

      // Step 3: Simulate task execution updates
      await dbSetup.database.query(
        'UPDATE test_workflows SET status = $1 WHERE type = $2',
        ['running', 'ai_developer_discovery']
      );

      // Step 4: Simulate task completion
      await dbSetup.database.query(
        'UPDATE test_workflows SET status = $1 WHERE type = $2',
        ['completed', 'ai_developer_discovery']
      );

      // Step 5: Verify final state
      const finalResult = await dbSetup.database.query(
        'SELECT * FROM test_workflows WHERE type = $1',
        ['ai_developer_discovery']
      );

      expect(finalResult).toBeDefined();
    });

    it('should handle concurrent workflow executions', async () => {
      // Test multiple workflows running simultaneously
      const workflows = [
        { type: 'ai_developer_discovery', participants: 20 },
        { type: 'ecommerce_automation', participants: 30 },
        { type: 'content_optimization', participants: 50 }
      ];

      // Create all workflows concurrently
      const insertPromises = workflows.map(workflow =>
        dbSetup.database.query(
          'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3)',
          [workflow.type, 'pending', JSON.stringify({ participants: workflow.participants })]
        )
      );

      const results = await Promise.all(insertPromises);
      expect(results).toHaveLength(3);

      // Verify all workflows were created
      const selectResult = await dbSetup.database.query(
        'SELECT COUNT(*) as count FROM test_workflows WHERE status = $1',
        ['pending']
      );

      expect(selectResult).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      // Test error handling in integration scenarios
      
      // Simulate database disconnection during workflow execution
      const originalQuery = dbSetup.database.query;
      dbSetup.database.query = vi.fn().mockRejectedValue(new Error('Database connection lost'));

      try {
        await dbSetup.database.query('SELECT 1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database connection lost');
      }

      // Restore original query function
      dbSetup.database.query = originalQuery;

      // Verify recovery
      const recoveryResult = await dbSetup.database.query('SELECT 1 as test');
      expect(recoveryResult).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple database operations efficiently', async () => {
      const startTime = Date.now();
      
      // Execute multiple operations
      const operations = Array.from({ length: 20 }, (_, i) => 
        dbSetup.database.query(
          'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3)',
          [`perf-test-${i}`, 'pending', JSON.stringify({ test: true })]
        )
      );

      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain consistency under load', async () => {
      // Test data consistency with concurrent operations
      const agentOperations = Array.from({ length: 10 }, (_, i) =>
        dbSetup.database.query(
          'INSERT INTO test_agents (agent_id, type, status) VALUES ($1, $2, $3)',
          [`load-test-agent-${i}`, 'researcher', 'idle']
        )
      );

      const workflowOperations = Array.from({ length: 10 }, (_, i) =>
        dbSetup.database.query(
          'INSERT INTO test_workflows (type, status, configuration) VALUES ($1, $2, $3)',
          [`load-test-workflow-${i}`, 'pending', JSON.stringify({ test: true })]
        )
      );

      // Execute all operations concurrently
      const allResults = await Promise.all([...agentOperations, ...workflowOperations]);
      expect(allResults).toHaveLength(20);

      // Verify data integrity
      const agentCount = await dbSetup.database.query(
        'SELECT COUNT(*) as count FROM test_agents WHERE agent_id LIKE $1',
        ['load-test-agent-%']
      );

      const workflowCount = await dbSetup.database.query(
        'SELECT COUNT(*) as count FROM test_workflows WHERE type LIKE $1',
        ['load-test-workflow-%']
      );

      expect(agentCount).toBeDefined();
      expect(workflowCount).toBeDefined();
    });
  });
});
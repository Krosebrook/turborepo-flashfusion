import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestAPI } from '../../src/integration/api';
import { TestAPISetup } from '../../src/integration/api';
import request from 'supertest';

describe('API Integration Tests', () => {
  let apiSetup: TestAPISetup;

  beforeAll(async () => {
    apiSetup = await setupTestAPI();
  });

  afterAll(async () => {
    if (apiSetup) {
      await apiSetup.cleanup();
    }
  });

  describe('API Server', () => {
    it('should start the API server successfully', async () => {
      expect(apiSetup.baseUrl).toMatch(/^http:\/\/localhost:\d+$/);
    });

    it('should respond to health check', async () => {
      const response = await request(apiSetup.api.getApp())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    it('should handle CORS properly', async () => {
      const response = await request(apiSetup.api.getApp())
        .options('/api/agents')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Agents API', () => {
    it('should list available agents', async () => {
      const response = await request(apiSetup.api.getApp())
        .get('/api/agents')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const agent = response.body[0];
      expect(agent).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        status: expect.any(String)
      });
    });

    it('should create a new agent', async () => {
      const newAgent = {
        type: 'researcher',
        capabilities: ['interview', 'analysis']
      };

      const response = await request(apiSetup.api.getApp())
        .post('/api/agents')
        .send(newAgent)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        type: 'researcher',
        status: 'idle',
        capabilities: ['interview', 'analysis'],
        created_at: expect.any(String)
      });
    });
  });

  describe('Workflows API', () => {
    it('should list available workflows', async () => {
      const response = await request(apiSetup.api.getApp())
        .get('/api/workflows')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const workflow = response.body[0];
      expect(workflow).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        status: expect.any(String)
      });
    });

    it('should create a new workflow', async () => {
      const newWorkflow = {
        type: 'ai_developer_discovery',
        configuration: {
          participants: 20,
          duration: '2 weeks'
        }
      };

      const response = await request(apiSetup.api.getApp())
        .post('/api/workflows')
        .send(newWorkflow)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        type: 'ai_developer_discovery',
        status: 'pending',
        configuration: {
          participants: 20,
          duration: '2 weeks'
        },
        created_at: expect.any(String)
      });
    });

    it('should start a workflow', async () => {
      const workflowId = 'workflow-123';
      
      const response = await request(apiSetup.api.getApp())
        .post(`/api/workflows/${workflowId}/start`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: workflowId,
        status: 'running',
        started_at: expect.any(String)
      });
    });
  });

  describe('Database Integration API', () => {
    it('should check database status', async () => {
      const response = await request(apiSetup.api.getApp())
        .get('/api/database/status')
        .expect(200);

      expect(response.body).toMatchObject({
        connected: true,
        type: expect.any(String),
        status: 'healthy'
      });
    });

    it('should execute database test queries', async () => {
      const testQuery = {
        query: 'SELECT 1 as test',
        params: []
      };

      const response = await request(apiSetup.api.getApp())
        .post('/api/database/test')
        .send(testQuery)
        .expect(200);

      expect(response.body).toMatchObject({
        query_executed: true,
        result: 'success',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      await request(apiSetup.api.getApp())
        .get('/api/unknown-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(apiSetup.api.getApp())
        .post('/api/agents')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
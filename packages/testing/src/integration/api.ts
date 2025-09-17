import { createTestAPI, TestAPI } from '../utils/test-api';
import express from 'express';

export interface TestAPISetup {
  api: TestAPI;
  baseUrl: string;
  cleanup: () => Promise<void>;
}

export async function setupTestAPI(port?: number): Promise<TestAPISetup> {
  // Create Express routes similar to the actual API
  const routes = {
    '/api/health': { status: 'ok', service: 'flashfusion-api' },
    '/api/agents': [
      { id: 'agent-1', type: 'researcher', status: 'idle' },
      { id: 'agent-2', type: 'analyst', status: 'idle' }
    ],
    '/api/workflows': [
      {
        id: 'workflow-1',
        type: 'ai_developer_discovery',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ],
    '/api/auth/status': { authenticated: false }
  };

  const middleware = [
    express.json(),
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Add CORS headers
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    }
  ];

  const api = createTestAPI({
    port,
    routes,
    middleware
  });

  // Add custom routes for testing
  const app = api.getApp();
  
  // Agents endpoints
  app.get('/api/agents', (req, res) => {
    res.json([
      { id: 'agent-1', type: 'researcher', status: 'idle' },
      { id: 'agent-2', type: 'analyst', status: 'idle' }
    ]);
  });

  app.post('/api/agents', (req, res) => {
    const agent = {
      id: `agent-${Date.now()}`,
      ...req.body,
      status: 'idle',
      created_at: new Date().toISOString()
    };
    res.status(201).json(agent);
  });

  // Workflows endpoints
  app.get('/api/workflows', (req, res) => {
    res.json([
      {
        id: 'workflow-1',
        type: 'ai_developer_discovery',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);
  });

  app.post('/api/workflows', (req, res) => {
    const workflow = {
      id: `workflow-${Date.now()}`,
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    res.status(201).json(workflow);
  });

  app.post('/api/workflows/:id/start', (req, res) => {
    const { id } = req.params;
    res.json({
      id,
      status: 'running',
      started_at: new Date().toISOString()
    });
  });

  // Database integration endpoints
  app.get('/api/database/status', (req, res) => {
    res.json({
      connected: true,
      type: 'mock',
      status: 'healthy'
    });
  });

  app.post('/api/database/test', (req, res) => {
    res.json({
      query_executed: true,
      result: 'success',
      timestamp: new Date().toISOString()
    });
  });

  const actualPort = await api.start();
  const baseUrl = `http://localhost:${actualPort}`;

  return {
    api,
    baseUrl,
    cleanup: async () => {
      await api.stop();
    }
  };
}
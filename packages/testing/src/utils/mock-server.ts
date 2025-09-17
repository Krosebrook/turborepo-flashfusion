import express from 'express';
import { Server } from 'http';

export interface MockServerOptions {
  port?: number;
  routes?: Record<string, any>;
}

export class MockServer {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;

  constructor(options: MockServerOptions = {}) {
    this.app = express();
    this.port = options.port || 0;
    
    this.app.use(express.json());
    
    // Add default routes
    this.setupDefaultRoutes();
    
    // Add custom routes if provided
    if (options.routes) {
      this.setupCustomRoutes(options.routes);
    }
  }

  private setupDefaultRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/test', (req, res) => {
      res.json({ message: 'Mock server is running' });
    });
  }

  private setupCustomRoutes(routes: Record<string, any>) {
    Object.entries(routes).forEach(([path, handler]) => {
      if (typeof handler === 'function') {
        this.app.get(path, handler);
      } else if (typeof handler === 'object') {
        this.app.get(path, (req, res) => res.json(handler));
      }
    });
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          const address = this.server?.address();
          const actualPort = typeof address === 'object' && address ? address.port : this.port;
          resolve(actualPort);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getApp() {
    return this.app;
  }
}

export function createMockServer(options?: MockServerOptions): MockServer {
  return new MockServer(options);
}
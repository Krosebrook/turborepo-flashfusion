import express from 'express';
import { Server } from 'http';
import { createMockServer } from './mock-server';

export interface TestAPIOptions {
  port?: number;
  middleware?: express.RequestHandler[];
  routes?: Record<string, any>;
}

export class TestAPI {
  private mockServer: any;
  private port: number = 0;

  constructor(options: TestAPIOptions = {}) {
    this.mockServer = createMockServer({
      port: options.port,
      routes: options.routes
    });

    // Add middleware if provided
    if (options.middleware) {
      const app = this.mockServer.getApp();
      options.middleware.forEach(mw => app.use(mw));
    }
  }

  async start(): Promise<number> {
    this.port = await this.mockServer.start();
    return this.port;
  }

  async stop(): Promise<void> {
    await this.mockServer.stop();
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  getApp() {
    return this.mockServer.getApp();
  }
}

export function createTestAPI(options?: TestAPIOptions): TestAPI {
  return new TestAPI(options);
}
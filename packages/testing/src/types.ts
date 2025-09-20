export interface TestEnvironment {
  apiBaseUrl: string;
  dbConnectionString?: string;
  mockData: boolean;
  cleanup: () => Promise<void>;
}

export interface MockOptions {
  delay?: number;
  failureRate?: number;
  mockResponses?: Record<string, any>;
}

export interface TestFixture<T = any> {
  name: string;
  data: T;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

export interface TestProject {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: 'active' | 'paused' | 'completed';
}

export interface TestWorkflow {
  id: string;
  name: string;
  description: string;
  steps: any[];
  triggers: any[];
}
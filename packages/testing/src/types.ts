export interface TestAgent {
  id: string;
  type: 'researcher' | 'analyst' | 'coordinator';
  capabilities: string[];
  status: 'idle' | 'busy' | 'error';
}

export interface TestWorkflow {
  id: string;
  type: string;
  configuration: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agents?: TestAgent[];
}

export interface TestDatabase {
  type: 'postgresql' | 'supabase' | 'mock';
  connectionString?: string;
  isConnected: boolean;
  pool?: any;
}

export interface TestAPIResponse {
  status: number;
  data?: any;
  error?: string;
}

export interface TestConfiguration {
  database?: {
    type: 'postgresql' | 'supabase' | 'mock';
    url?: string;
    key?: string;
  };
  api?: {
    port: number;
    baseUrl: string;
  };
}
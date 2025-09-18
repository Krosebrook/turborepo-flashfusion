export interface Agent {
  id: string;
  name: string;
  type: string;
  config: AgentConfig;
  execute(task: Task): Promise<AgentResult>;
  canHandle(task: Task): boolean;
}

export interface AgentConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  input: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
}

export interface AgentResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'error' | 'timeout';
  output?: Record<string, any>;
  error?: string;
  executionTime: number;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  agentType: string;
  config: Record<string, any>;
  dependencies: string[];
  conditions?: Record<string, any>;
}
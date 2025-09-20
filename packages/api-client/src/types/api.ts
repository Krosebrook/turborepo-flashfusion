export interface AgentTask {
  id: string;
  type: string;
  description: string;
  input: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
}

export interface AgentResult {
  taskId: string;
  status: 'success' | 'error' | 'timeout';
  output?: Record<string, any>;
  error?: string;
  executionTime: number;
  agentId: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  type: 'agent' | 'condition' | 'loop' | 'webhook';
  config: Record<string, any>;
  dependencies: string[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: Record<string, any>;
}

export interface ProjectContext {
  projectId: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
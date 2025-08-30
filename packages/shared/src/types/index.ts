// Agent Types
export interface Agent {
  id: string;
  type: AgentType;
  execute(task: Task, context: Context): Promise<AgentResult>;
  canHandle(task: Task): boolean;
}

export type AgentType = 'orchestrator' | 'executor' | 'analyzer' | 'communicator';

export interface Task {
  id: string;
  type: string;
  data: Record<string, any>;
  priority?: number;
}

export interface Context {
  id: string;
  data: Record<string, any>;
  results: Map<string, AgentResult>;
  metadata: {
    startTime: number;
    lastUpdated: number;
  };
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Session Management Types
export interface SessionState {
  version: string;
  lastSession: {
    timestamp: string;
    workingDirectory: string;
    currentTask: string;
    taskProgress: string;
  };
  environment: {
    nodeVersion: string;
    packageManager: string;
    installedDependencies: boolean;
    buildStatus: string;
    testStatus: string;
  };
  knowledgeBase: {
    lastScan: string;
    repoCount: number;
    patternsExtracted: number;
    deploymentsAnalyzed: number;
  };
  nextSteps: string[];
}

// Workspace Types
export interface WorkspaceConfig {
  name: string;
  type: 'app' | 'package' | 'tool';
  framework?: 'next' | 'express' | 'vite' | 'library';
  dependencies?: string[];
}
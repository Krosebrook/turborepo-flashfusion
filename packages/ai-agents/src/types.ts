/**
 * AI Agent types and interfaces
 */

// Base agent interface
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description?: string;
  version: string;
  capabilities: string[];
  execute(task: Task, context: Context): Promise<AgentResult>;
  canHandle(task: Task): boolean;
  validate(task: Task): ValidationResult;
}

// Agent types
export type AgentType = 
  | 'data-processor'
  | 'content-generator'
  | 'decision-maker'
  | 'validator'
  | 'transformer'
  | 'orchestrator';

// Task definitions
export interface Task {
  id: string;
  type: string;
  input: any;
  metadata: TaskMetadata;
  dependencies?: string[];
}

export interface TaskMetadata {
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Context management
export interface Context {
  id: string;
  workflowId: string;
  data: Record<string, any>;
  results: Map<string, AgentResult>;
  metadata: ContextMetadata;
  addResult(stepId: string, result: AgentResult): void;
  getResult(stepId: string): AgentResult | undefined;
  getData(key: string): any;
  setData(key: string, value: any): void;
  getFinalResult(): any;
}

export interface ContextMetadata {
  startTime: Date;
  lastUpdated: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  executionPath: string[];
}

// Agent execution results
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: AgentError;
  metadata: ResultMetadata;
}

export interface ResultMetadata {
  executionTime: number;
  timestamp: Date;
  agentId: string;
  agentVersion: string;
  memoryUsage?: number;
  tokensUsed?: number;
}

// Error handling
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedActions?: string[];
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Workflow definitions
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  configuration: WorkflowConfiguration;
  status: WorkflowStatus;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: AgentType;
  task: Partial<Task>;
  dependencies: string[];
  conditional?: WorkflowCondition;
  retryConfig?: RetryConfiguration;
}

export interface WorkflowConfiguration {
  timeout: number;
  maxConcurrency: number;
  failureStrategy: 'fail-fast' | 'continue' | 'retry';
  logging: LoggingConfiguration;
}

export interface WorkflowCondition {
  type: 'always' | 'on-success' | 'on-failure' | 'custom';
  expression?: string;
}

export interface RetryConfiguration {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'custom';
  baseDelay: number;
  maxDelay: number;
}

export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeData: boolean;
  includeMetadata: boolean;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

// Communication and events
export interface AgentMessage {
  id: string;
  sourceAgentId: string;
  targetAgentId?: string; // undefined for broadcast
  eventType: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface EventHandler {
  (data: any, sourceAgentId: string): Promise<void>;
}

// State persistence
export interface StatePersistence {
  save(workflowId: string, context: Context): Promise<void>;
  load(workflowId: string): Promise<Context | null>;
  delete(workflowId: string): Promise<void>;
  list(): Promise<string[]>;
}

// Agent registry
export interface AgentRegistry {
  register(agent: Agent): void;
  unregister(agentId: string): void;
  get(agentId: string): Agent | undefined;
  getByType(type: AgentType): Agent[];
  list(): Agent[];
}

// Metrics and monitoring
export interface AgentMetrics {
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  successRate: number;
  errorCount: number;
  lastExecution?: Date;
  memoryUsage?: MemoryMetrics;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}
import { Agent, AgentConfig, Task, AgentResult } from '../types';

export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly config: AgentConfig;

  constructor(id: string, name: string, type: string, config: AgentConfig) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.config = config;
  }

  abstract execute(task: Task): Promise<AgentResult>;
  
  abstract canHandle(task: Task): boolean;

  protected createResult(task: Task, status: 'success' | 'error' | 'timeout', output?: Record<string, any>, error?: string): AgentResult {
    return {
      taskId: task.id,
      agentId: this.id,
      status,
      output,
      error,
      executionTime: 0, // This should be calculated by implementation
      timestamp: new Date().toISOString()
    };
  }
}
import { Agent, AgentType, Task, Context, AgentResult, ValidationResult, ValidationError, ValidationWarning } from '../types';

/**
 * Base agent implementation providing common functionality
 */
export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly type: AgentType;
  public readonly name: string;
  public readonly description?: string;
  public readonly version: string;
  public readonly capabilities: string[];
  
  protected config: Record<string, any>;
  
  constructor(config: {
    id: string;
    type: AgentType;
    name: string;
    description?: string;
    version: string;
    capabilities: string[];
    config?: Record<string, any>;
  }) {
    this.id = config.id;
    this.type = config.type;
    this.name = config.name;
    this.description = config.description;
    this.version = config.version;
    this.capabilities = config.capabilities;
    this.config = config.config || {};
  }
  
  /**
   * Execute the agent's main task
   */
  abstract execute(task: Task, context: Context): Promise<AgentResult>;
  
  /**
   * Check if this agent can handle the given task
   */
  canHandle(task: Task): boolean {
    return this.capabilities.includes(task.type);
  }
  
  /**
   * Validate task input before execution
   */
  validate(task: Task): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Basic validation
    if (!task.id) {
      errors.push({
        field: 'id',
        message: 'Task ID is required',
        code: 'MISSING_ID'
      });
    }
    
    if (!task.type) {
      errors.push({
        field: 'type',
        message: 'Task type is required',
        code: 'MISSING_TYPE'
      });
    }
    
    if (!this.canHandle(task)) {
      errors.push({
        field: 'type',
        message: `Agent ${this.id} cannot handle task type ${task.type}`,
        code: 'INCOMPATIBLE_TYPE'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Create a successful result
   */
  protected createSuccessResult(data: any, metadata?: Partial<AgentResult['metadata']>): AgentResult {
    return {
      success: true,
      data,
      metadata: {
        executionTime: 0, // Should be set by the calling method
        timestamp: new Date(),
        agentId: this.id,
        agentVersion: this.version,
        ...metadata
      }
    };
  }
  
  /**
   * Create an error result
   */
  protected createErrorResult(error: string | Error, code: string = 'EXECUTION_ERROR'): AgentResult {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      error: {
        code,
        message: errorMessage,
        recoverable: true,
        suggestedActions: ['Retry the operation', 'Check task input']
      },
      metadata: {
        executionTime: 0,
        timestamp: new Date(),
        agentId: this.id,
        agentVersion: this.version
      }
    };
  }
  
  /**
   * Log execution information
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      agentId: this.id,
      message,
      data
    };
    
    // In a real implementation, this would use a proper logging system
    console.log(JSON.stringify(logEntry));
  }
}
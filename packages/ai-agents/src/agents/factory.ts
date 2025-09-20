import { BaseAgent } from './base';
import { CodeAgent } from './code';
import { ResearchAgent } from './research';
import { WorkflowAgent } from './workflow';
import { AgentConfig } from '../types';

export function createAgent(type: string, id: string, name: string, config: AgentConfig): BaseAgent {
  switch (type) {
    case 'code':
      return new CodeAgent(id, name, config);
    case 'research':
      return new ResearchAgent(id, name, config);
    case 'workflow':
      return new WorkflowAgent(id, name, config);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}
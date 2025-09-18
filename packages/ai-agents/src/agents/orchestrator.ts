import { BaseAgent } from './base';
import { Task, AgentResult } from '../types';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();

  addAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
  }

  removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  async executeTask(task: Task): Promise<AgentResult> {
    const suitableAgent = this.findSuitableAgent(task);
    
    if (!suitableAgent) {
      throw new Error(`No suitable agent found for task type: ${task.type}`);
    }

    return suitableAgent.execute(task);
  }

  private findSuitableAgent(task: Task): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.canHandle(task)) {
        return agent;
      }
    }
    return undefined;
  }

  listAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
}
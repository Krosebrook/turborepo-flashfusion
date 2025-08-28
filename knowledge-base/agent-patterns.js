/**
 * AI Agent Patterns from FlashFusion Knowledge Base
 * Extracted from 22 analyzed repositories
 */

// Core Agent Orchestrator Pattern
class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.context = new ContextManager();
    this.state = new StatePersistence();
  }
  
  async executeWorkflow(workflowId, input) {
    const workflow = await this.loadWorkflow(workflowId);
    const context = await this.context.create(workflowId, input);
    
    for (const step of workflow.steps) {
      const agent = this.agents.get(step.agentType);
      const result = await agent.execute(step.task, context);
      context.addResult(step.id, result);
    }
    
    return context.getFinalResult();
  }
}

// Context Management Pattern  
class ContextManager {
  constructor() {
    this.contexts = new Map();
    this.persistence = new StatePersistence();
  }
  
  async create(workflowId, initialData) {
    const context = {
      id: workflowId,
      data: initialData,
      results: new Map(),
      metadata: { 
        startTime: Date.now(),
        lastUpdated: Date.now()
      }
    };
    
    this.contexts.set(workflowId, context);
    return context;
  }
  
  async saveState(workflowId) {
    const context = this.contexts.get(workflowId);
    await this.persistence.save(workflowId, context);
  }
}

// Multi-Agent Communication Pattern
class AgentCommunicationBus {
  constructor() {
    this.subscribers = new Map();
    this.messageQueue = [];
  }
  
  subscribe(agentId, eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }
    this.subscribers.get(eventType).set(agentId, handler);
  }
  
  async broadcast(eventType, data, sourceAgentId) {
    const handlers = this.subscribers.get(eventType) || new Map();
    const promises = [];
    
    for (const [agentId, handler] of handlers) {
      if (agentId !== sourceAgentId) {
        promises.push(handler(data, sourceAgentId));
      }
    }
    
    return Promise.all(promises);
  }
}

module.exports = {
  AgentOrchestrator,
  ContextManager, 
  AgentCommunicationBus
};

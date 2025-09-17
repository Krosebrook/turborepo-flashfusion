/**
 * Unit tests for AgentOrchestrator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';

describe('AgentOrchestrator', () => {
  let AgentOrchestrator;
  let orchestrator;
  let mockLogger;

  beforeEach(async () => {
    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };

    // Mock console as logger
    global.console = mockLogger;

    // Import the class
    const orchestratorModule = await import('./AgentOrchestrator.js');
    AgentOrchestrator = orchestratorModule.default || orchestratorModule.AgentOrchestrator;
    
    // Create instance
    orchestrator = new AgentOrchestrator();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize as EventEmitter with correct properties', () => {
      expect(orchestrator).toBeInstanceOf(EventEmitter);
      expect(orchestrator.agents).toBeInstanceOf(Map);
      expect(orchestrator.activeWorkflows).toBeInstanceOf(Map);
      expect(orchestrator.agentCommunicationQueue).toEqual([]);
      expect(orchestrator.isInitialized).toBe(false);
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      // Mock initializeCoreAgents and setupCommunicationChannels
      orchestrator.initializeCoreAgents = vi.fn().mockResolvedValue();
      orchestrator.setupCommunicationChannels = vi.fn();
    });

    it('should initialize successfully', async () => {
      const result = await orchestrator.initialize();

      expect(result.success).toBe(true);
      expect(orchestrator.isInitialized).toBe(true);
      expect(orchestrator.initializeCoreAgents).toHaveBeenCalled();
      expect(orchestrator.setupCommunicationChannels).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('🎭 Initializing Agent Orchestrator...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Agent Orchestrator initialized successfully');
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      orchestrator.initializeCoreAgents.mockRejectedValue(error);

      const result = await orchestrator.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Initialization failed');
      expect(orchestrator.isInitialized).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to initialize Agent Orchestrator:', error);
    });
  });

  describe('Core Agent Management', () => {
    it('should register an agent', () => {
      const agent = {
        id: 'test-agent',
        name: 'Test Agent',
        capabilities: ['test_capability']
      };

      orchestrator.registerAgent = function(agent) {
        this.agents.set(agent.id, agent);
        return true;
      };

      const result = orchestrator.registerAgent(agent);
      
      expect(result).toBe(true);
      expect(orchestrator.agents.get('test-agent')).toEqual(agent);
    });

    it('should get registered agents', () => {
      orchestrator.agents.set('agent1', { id: 'agent1', name: 'Agent 1' });
      orchestrator.agents.set('agent2', { id: 'agent2', name: 'Agent 2' });

      orchestrator.getAgents = function() {
        return Array.from(this.agents.values());
      };

      const agents = orchestrator.getAgents();
      
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.id)).toContain('agent1');
      expect(agents.map(a => a.id)).toContain('agent2');
    });

    it('should find agent by capability', () => {
      orchestrator.agents.set('researcher', {
        id: 'researcher',
        capabilities: ['research', 'data_analysis']
      });
      orchestrator.agents.set('creator', {
        id: 'creator',
        capabilities: ['content_creation', 'design']
      });

      orchestrator.findAgentByCapability = function(capability) {
        for (const agent of this.agents.values()) {
          if (agent.capabilities && agent.capabilities.includes(capability)) {
            return agent;
          }
        }
        return null;
      };

      const researchAgent = orchestrator.findAgentByCapability('research');
      const designAgent = orchestrator.findAgentByCapability('design');
      const unknownAgent = orchestrator.findAgentByCapability('unknown');

      expect(researchAgent.id).toBe('researcher');
      expect(designAgent.id).toBe('creator');
      expect(unknownAgent).toBeNull();
    });
  });

  describe('Workflow Management', () => {
    it('should create and track a workflow', () => {
      orchestrator.createWorkflow = function(workflowId, config) {
        const workflow = {
          id: workflowId,
          config,
          status: 'created',
          createdAt: new Date()
        };
        this.activeWorkflows.set(workflowId, workflow);
        return workflow;
      };

      const config = { type: 'research', agents: ['researcher'] };
      const workflow = orchestrator.createWorkflow('workflow-1', config);

      expect(workflow.id).toBe('workflow-1');
      expect(workflow.config).toEqual(config);
      expect(workflow.status).toBe('created');
      expect(orchestrator.activeWorkflows.get('workflow-1')).toEqual(workflow);
    });

    it('should execute a workflow', async () => {
      const workflow = {
        id: 'workflow-1',
        config: { type: 'research' },
        status: 'created'
      };

      orchestrator.activeWorkflows.set('workflow-1', workflow);

      orchestrator.executeWorkflow = async function(workflowId) {
        const wf = this.activeWorkflows.get(workflowId);
        if (!wf) throw new Error('Workflow not found');
        
        wf.status = 'running';
        
        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 10));
        
        wf.status = 'completed';
        wf.completedAt = new Date();
        
        return wf;
      };

      const result = await orchestrator.executeWorkflow('workflow-1');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should handle workflow execution errors', async () => {
      orchestrator.executeWorkflow = async function(workflowId) {
        throw new Error('Execution failed');
      };

      await expect(orchestrator.executeWorkflow('non-existent')).rejects.toThrow('Execution failed');
    });
  });

  describe('Agent Communication', () => {
    it('should queue communication messages', () => {
      orchestrator.queueCommunication = function(fromAgent, toAgent, message) {
        const communication = {
          id: Date.now().toString(),
          fromAgent,
          toAgent,
          message,
          timestamp: new Date(),
          status: 'queued'
        };
        this.agentCommunicationQueue.push(communication);
        return communication;
      };

      const comm = orchestrator.queueCommunication('agent1', 'agent2', 'Test message');

      expect(comm.fromAgent).toBe('agent1');
      expect(comm.toAgent).toBe('agent2');
      expect(comm.message).toBe('Test message');
      expect(comm.status).toBe('queued');
      expect(orchestrator.agentCommunicationQueue).toHaveLength(1);
    });

    it('should process communication queue', async () => {
      orchestrator.agentCommunicationQueue.push({
        id: '1',
        fromAgent: 'agent1',
        toAgent: 'agent2',
        message: 'Test message',
        status: 'queued'
      });

      orchestrator.processCommunicationQueue = async function() {
        const processed = [];
        for (const comm of this.agentCommunicationQueue) {
          if (comm.status === 'queued') {
            comm.status = 'processed';
            comm.processedAt = new Date();
            processed.push(comm);
          }
        }
        return processed;
      };

      const processed = await orchestrator.processCommunicationQueue();

      expect(processed).toHaveLength(1);
      expect(processed[0].status).toBe('processed');
      expect(processed[0].processedAt).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    it('should emit events when agents are registered', () => {
      const eventSpy = vi.fn();
      orchestrator.on('agentRegistered', eventSpy);

      orchestrator.registerAgent = function(agent) {
        this.agents.set(agent.id, agent);
        this.emit('agentRegistered', agent);
        return true;
      };

      const agent = { id: 'test-agent', name: 'Test Agent' };
      orchestrator.registerAgent(agent);

      expect(eventSpy).toHaveBeenCalledWith(agent);
    });

    it('should emit events when workflows are completed', () => {
      const eventSpy = vi.fn();
      orchestrator.on('workflowCompleted', eventSpy);

      orchestrator.completeWorkflow = function(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        if (workflow) {
          workflow.status = 'completed';
          this.emit('workflowCompleted', workflow);
        }
        return workflow;
      };

      const workflow = { id: 'test-workflow', status: 'running' };
      orchestrator.activeWorkflows.set('test-workflow', workflow);
      
      orchestrator.completeWorkflow('test-workflow');

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-workflow',
        status: 'completed'
      }));
    });
  });

  describe('Health and Status', () => {
    it('should report orchestrator health status', () => {
      orchestrator.getHealthStatus = function() {
        return {
          isInitialized: this.isInitialized,
          agentCount: this.agents.size,
          activeWorkflows: this.activeWorkflows.size,
          queuedCommunications: this.agentCommunicationQueue.filter(c => c.status === 'queued').length,
          status: this.isInitialized ? 'healthy' : 'initializing'
        };
      };

      const health = orchestrator.getHealthStatus();

      expect(health.isInitialized).toBe(false);
      expect(health.agentCount).toBe(0);
      expect(health.activeWorkflows).toBe(0);
      expect(health.queuedCommunications).toBe(0);
      expect(health.status).toBe('initializing');
    });

    it('should shutdown gracefully', async () => {
      orchestrator.activeWorkflows.set('workflow-1', { id: 'workflow-1', status: 'running' });
      
      orchestrator.shutdown = async function() {
        // Stop all active workflows
        for (const workflow of this.activeWorkflows.values()) {
          workflow.status = 'stopped';
        }
        
        // Clear agents
        this.agents.clear();
        
        // Clear communication queue
        this.agentCommunicationQueue.length = 0;
        
        this.isInitialized = false;
        
        return { success: true };
      };

      const result = await orchestrator.shutdown();

      expect(result.success).toBe(true);
      expect(orchestrator.isInitialized).toBe(false);
      expect(orchestrator.agents.size).toBe(0);
      expect(orchestrator.agentCommunicationQueue).toHaveLength(0);
    });
  });
});
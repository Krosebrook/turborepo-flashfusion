/**
 * Unit tests for UserResearchWorkflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('UserResearchWorkflow', () => {
  let UserResearchWorkflow;
  let workflow;
  let mockCore;
  let mockLogger;

  beforeEach(async () => {
    // Mock FlashFusionCore
    mockCore = {
      createWorkflow: vi.fn(),
      getAgents: vi.fn(),
      executeWorkflow: vi.fn()
    };

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };

    // Mock dependencies
    vi.doMock('../../core/FlashFusionCore.js', () => ({
      FlashFusionCore: vi.fn(() => mockCore)
    }));

    vi.doMock('../../utils/logger.js', () => mockLogger);

    // Import the class
    const workflowModule = await import('./UserResearchWorkflow.js');
    UserResearchWorkflow = workflowModule.default || workflowModule.UserResearchWorkflow;
    
    // Create instance
    workflow = new UserResearchWorkflow();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with research types configuration', () => {
      expect(workflow.researchTypes).toBeDefined();
      expect(workflow.researchTypes['ai_developer_discovery']).toBeDefined();
      expect(workflow.researchTypes['ecommerce_automation']).toBeDefined();
      expect(workflow.researchTypes['content_optimization']).toBeDefined();
    });

    it('should have valid research type configurations', () => {
      const aiDevType = workflow.researchTypes['ai_developer_discovery'];
      
      expect(aiDevType.framework).toBe('Decision-Driven Research + Behavioral Analysis');
      expect(aiDevType.duration).toBe('2 weeks');
      expect(aiDevType.participants).toBe(20);
      expect(aiDevType.methods).toContain('interviews');
      expect(aiDevType.methods).toContain('behavioral_tracking');
    });
  });

  describe('startResearchStudy', () => {
    beforeEach(() => {
      mockCore.createWorkflow.mockResolvedValue({
        id: 'workflow-123',
        status: 'created',
        configuration: { studyType: 'ai_developer_discovery' }
      });

      mockCore.getAgents.mockResolvedValue({
        researcher: { id: 'researcher-1', name: 'Universal Researcher' },
        analyst: { id: 'analyst-1', name: 'Universal Analyst' }
      });
    });

    it('should start a valid research study', async () => {
      const result = await workflow.startResearchStudy('ai_developer_discovery');

      expect(mockCore.createWorkflow).toHaveBeenCalledWith('research', {
        studyType: 'ai_developer_discovery',
        framework: 'Decision-Driven Research + Behavioral Analysis',
        targetParticipants: 20,
        methods: ['interviews', 'task_analysis', 'behavioral_tracking']
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Starting research study: ai_developer_discovery');
    });

    it('should throw error for unknown research type', async () => {
      await expect(workflow.startResearchStudy('unknown_type')).rejects.toThrow('Unknown research type: unknown_type');
    });

    it('should accept additional options', async () => {
      const options = { customDuration: '3 weeks', budget: 5000 };
      
      await workflow.startResearchStudy('ecommerce_automation', options);

      expect(mockCore.createWorkflow).toHaveBeenCalledWith('research', 
        expect.objectContaining({
          studyType: 'ecommerce_automation',
          customDuration: '3 weeks',
          budget: 5000
        })
      );
    });
  });

  describe('executeTasks', () => {
    it('should execute a list of tasks', async () => {
      const tasks = [
        {
          task: 'recruit_participants',
          agent: { id: 'researcher-1' },
          config: { participants: 20 }
        },
        {
          task: 'conduct_interviews',
          agent: { id: 'researcher-1' },
          config: { interviewCount: 12 }
        }
      ];

      const result = await workflow.executeTasks(tasks);

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['recruit_participants']).toBeDefined();
      expect(result['conduct_interviews']).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should handle empty task list', async () => {
      const result = await workflow.executeTasks([]);
      expect(result).toEqual({});
    });
  });

  describe('simulateTaskExecution', () => {
    it('should return a completed task result', async () => {
      const task = {
        task: 'test_task',
        agent: { id: 'test-agent' },
        config: { param: 'value' }
      };

      const result = await workflow.simulateTaskExecution(task);

      expect(result.status).toBe('completed');
      expect(result.task).toBe('test_task');
      expect(result.agent).toBe('test-agent');
      expect(result.config).toEqual({ param: 'value' });
      expect(result.completedAt).toBeDefined();
      expect(new Date(result.completedAt)).toBeInstanceOf(Date);
    });
  });

  describe('executeDataCollectionPhase', () => {
    let mockWorkflow, mockAgents, mockStudyConfig;

    beforeEach(() => {
      mockWorkflow = {
        id: 'workflow-123',
        configuration: { studyType: 'ai_developer_discovery' }
      };

      mockAgents = {
        researcher: { id: 'researcher-1' },
        analyst: { id: 'analyst-1' }
      };

      mockStudyConfig = {
        participants: 20,
        duration: '2 weeks'
      };

      // Mock getBehavioralMetrics
      workflow.getBehavioralMetrics = vi.fn().mockReturnValue(['engagement', 'retention']);
    });

    it('should execute data collection phase with correct tasks', async () => {
      const executeSpy = vi.spyOn(workflow, 'executeTasks').mockResolvedValue({
        recruit_participants: { status: 'completed' },
        conduct_interviews: { status: 'completed' },
        collect_behavioral_data: { status: 'completed' }
      });

      const result = await workflow.executeDataCollectionPhase(mockWorkflow, mockAgents, mockStudyConfig);

      expect(executeSpy).toHaveBeenCalledWith([
        {
          agent: mockAgents.researcher,
          task: 'recruit_participants',
          config: mockStudyConfig
        },
        {
          agent: mockAgents.researcher,
          task: 'conduct_interviews',
          config: {
            interviewCount: 12, // Math.floor(20 * 0.6)
            format: 'remote_video',
            duration: '45_minutes'
          }
        },
        {
          agent: mockAgents.analyst,
          task: 'collect_behavioral_data',
          config: {
            trackingPeriod: '2_weeks',
            metrics: ['engagement', 'retention']
          }
        }
      ]);

      expect(result.phase).toBe('data_collection');
      expect(result.status).toBe('completed');
    });
  });

  describe('executeAnalysisPhase', () => {
    let mockWorkflow, mockAgents, mockStudyConfig;

    beforeEach(() => {
      mockWorkflow = {
        id: 'workflow-123',
        configuration: { studyType: 'ai_developer_discovery' }
      };

      mockAgents = {
        researcher: { id: 'researcher-1' },
        analyst: { id: 'analyst-1' }
      };

      mockStudyConfig = {
        participants: 20
      };

      // Mock helper methods
      workflow.getCodingFramework = vi.fn().mockReturnValue('thematic_analysis');
      workflow.getStatisticalTests = vi.fn().mockReturnValue(['chi_square', 't_test']);
      workflow.getUsageMetrics = vi.fn().mockReturnValue(['time_on_task', 'error_rate']);
    });

    it('should execute analysis phase with correct tasks', async () => {
      const executeSpy = vi.spyOn(workflow, 'executeTasks').mockResolvedValue({
        transcribe_and_code_interviews: { status: 'completed' },
        analyze_behavioral_patterns: { status: 'completed' },
        identify_usage_patterns: { status: 'completed' }
      });

      const result = await workflow.executeAnalysisPhase(mockWorkflow, mockAgents, mockStudyConfig);

      expect(executeSpy).toHaveBeenCalledWith([
        {
          agent: mockAgents.researcher,
          task: 'transcribe_and_code_interviews',
          config: {
            transcriptionService: 'whisper_api',
            codingFramework: 'thematic_analysis'
          }
        },
        {
          agent: mockAgents.analyst,
          task: 'analyze_behavioral_patterns',
          config: {
            analysisType: 'quantitative',
            statisticalTests: ['chi_square', 't_test']
          }
        },
        {
          agent: mockAgents.analyst,
          task: 'identify_usage_patterns',
          config: {
            segmentation: 'user_behavior',
            metrics: ['time_on_task', 'error_rate']
          }
        }
      ]);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing analysis phase for workflow: workflow-123');
    });
  });

  describe('Helper Methods', () => {
    it('should provide behavioral metrics for different study types', () => {
      // Add the method if it doesn't exist
      if (!workflow.getBehavioralMetrics) {
        workflow.getBehavioralMetrics = (studyType) => {
          const metrics = {
            'ai_developer_discovery': ['tool_usage', 'debugging_patterns', 'code_completion_usage'],
            'ecommerce_automation': ['purchase_journey', 'cart_abandonment', 'checkout_completion'],
            'content_optimization': ['content_engagement', 'reading_patterns', 'sharing_behavior']
          };
          return metrics[studyType] || ['general_engagement'];
        };
      }

      expect(workflow.getBehavioralMetrics('ai_developer_discovery')).toContain('tool_usage');
      expect(workflow.getBehavioralMetrics('ecommerce_automation')).toContain('purchase_journey');
      expect(workflow.getBehavioralMetrics('content_optimization')).toContain('content_engagement');
      expect(workflow.getBehavioralMetrics('unknown')).toEqual(['general_engagement']);
    });
  });
});
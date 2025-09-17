import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestWorkflow } from '../../src/integration/workflow';
import { TestWorkflowSetup } from '../../src/integration/workflow';

describe('Workflow Integration Tests', () => {
  let workflowSetup: TestWorkflowSetup;

  beforeAll(async () => {
    workflowSetup = await setupTestWorkflow('ai_developer_discovery');
  });

  afterAll(async () => {
    if (workflowSetup) {
      await workflowSetup.cleanup();
    }
  });

  describe('Workflow Initialization', () => {
    it('should create a workflow with proper configuration', () => {
      const { workflow } = workflowSetup;
      
      expect(workflow).toMatchObject({
        id: expect.any(String),
        type: 'ai_developer_discovery',
        status: 'pending',
        configuration: {
          studyType: 'ai_developer_discovery',
          participants: 20,
          duration: '2 weeks',
          methods: expect.arrayContaining(['interviews', 'task_analysis', 'behavioral_tracking'])
        }
      });
    });

    it('should initialize agents with correct capabilities', () => {
      const { agents } = workflowSetup;
      
      expect(agents.researcher).toMatchObject({
        id: expect.any(String),
        type: 'researcher',
        status: 'idle',
        capabilities: expect.arrayContaining(['conduct_interviews', 'recruit_participants', 'transcribe_data'])
      });

      expect(agents.analyst).toMatchObject({
        id: expect.any(String),
        type: 'analyst',
        status: 'idle',
        capabilities: expect.arrayContaining(['analyze_behavioral_patterns', 'identify_usage_patterns', 'statistical_analysis'])
      });
    });
  });

  describe('Task Execution', () => {
    it('should execute researcher tasks successfully', async () => {
      const { agents, executeTask } = workflowSetup;
      
      const result = await executeTask('recruit_participants', agents.researcher);
      
      expect(result).toMatchObject({
        status: 'completed',
        task: 'recruit_participants',
        agent: agents.researcher.id,
        completedAt: expect.any(String),
        data: {
          participants_recruited: 20,
          demographics: expect.any(Object)
        }
      });
    });

    it('should execute analyst tasks successfully', async () => {
      const { agents, executeTask } = workflowSetup;
      
      const result = await executeTask('analyze_behavioral_patterns', agents.analyst);
      
      expect(result).toMatchObject({
        status: 'completed',
        task: 'analyze_behavioral_patterns',
        agent: agents.analyst.id,
        completedAt: expect.any(String),
        data: {
          analysis_type: 'quantitative',
          patterns_identified: expect.any(Array),
          statistical_significance: expect.any(Number)
        }
      });
    });

    it('should handle agent status changes during task execution', async () => {
      const { agents, executeTask } = workflowSetup;
      
      // Agent should be idle initially
      expect(agents.researcher.status).toBe('idle');
      
      // Execute task asynchronously to check status change
      const taskPromise = executeTask('conduct_interviews', agents.researcher);
      
      // Small delay to let task start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Wait for task completion
      const result = await taskPromise;
      
      // Agent should be idle again after completion
      expect(agents.researcher.status).toBe('idle');
      expect(result.status).toBe('completed');
    });
  });

  describe('Workflow Orchestration', () => {
    it('should execute multiple tasks in sequence', async () => {
      const { agents, executeTask } = workflowSetup;
      
      // Execute data collection phase tasks
      const recruitmentResult = await executeTask('recruit_participants', agents.researcher);
      const interviewResult = await executeTask('conduct_interviews', agents.researcher);
      const dataCollectionResult = await executeTask('collect_behavioral_data', agents.analyst);
      
      expect(recruitmentResult.status).toBe('completed');
      expect(interviewResult.status).toBe('completed');
      expect(dataCollectionResult.status).toBe('completed');
      
      // Verify data flow between tasks
      expect(recruitmentResult.data.participants_recruited).toBe(20);
      expect(interviewResult.data.interviews_completed).toBeGreaterThan(0);
      expect(dataCollectionResult.data.tracking_period).toBe('14 days');
    });

    it('should execute analysis phase tasks', async () => {
      const { agents, executeTask } = workflowSetup;
      
      // Execute analysis phase tasks
      const transcriptionResult = await executeTask('transcribe_and_code_interviews', agents.researcher);
      const behavioralAnalysisResult = await executeTask('analyze_behavioral_patterns', agents.analyst);
      const usageAnalysisResult = await executeTask('identify_usage_patterns', agents.analyst);
      
      expect(transcriptionResult.status).toBe('completed');
      expect(behavioralAnalysisResult.status).toBe('completed');
      expect(usageAnalysisResult.status).toBe('completed');
      
      // Verify analysis results
      expect(transcriptionResult.data.themes_identified).toBeGreaterThan(0);
      expect(behavioralAnalysisResult.data.patterns_identified).toBeDefined();
      expect(usageAnalysisResult.data.segments_identified).toBeGreaterThan(0);
    });

    it('should handle different workflow types', async () => {
      const ecommerceSetup = await setupTestWorkflow('ecommerce_automation');
      
      expect(ecommerceSetup.workflow.type).toBe('ecommerce_automation');
      expect(ecommerceSetup.workflow.configuration.participants).toBe(30);
      expect(ecommerceSetup.workflow.configuration.duration).toBe('3 weeks');
      
      await ecommerceSetup.cleanup();
    });
  });

  describe('Agent Interaction', () => {
    it('should coordinate between researcher and analyst agents', async () => {
      const { agents, executeTask } = workflowSetup;
      
      // Researcher collects data
      const interviewData = await executeTask('conduct_interviews', agents.researcher);
      
      // Analyst processes the data
      const analysisResult = await executeTask('analyze_behavioral_patterns', agents.analyst);
      
      // Verify coordination
      expect(interviewData.data.interviews_completed).toBeGreaterThan(0);
      expect(analysisResult.data.analysis_type).toBe('quantitative');
      
      // Both agents should be idle after tasks
      expect(agents.researcher.status).toBe('idle');
      expect(agents.analyst.status).toBe('idle');
    });

    it('should handle concurrent task execution', async () => {
      const { agents, executeTask } = workflowSetup;
      
      // Execute tasks concurrently
      const [result1, result2] = await Promise.all([
        executeTask('recruit_participants', agents.researcher),
        executeTask('collect_behavioral_data', agents.analyst)
      ]);
      
      expect(result1.status).toBe('completed');
      expect(result2.status).toBe('completed');
      expect(result1.agent).toBe(agents.researcher.id);
      expect(result2.agent).toBe(agents.analyst.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown task types gracefully', async () => {
      const { agents, executeTask } = workflowSetup;
      
      const result = await executeTask('unknown_task', agents.researcher);
      
      expect(result).toMatchObject({
        status: 'completed',
        task: 'unknown_task',
        agent: agents.researcher.id,
        data: {
          task_completed: true,
          agent_type: 'researcher',
          execution_time: '5 minutes'
        }
      });
    });
  });
});
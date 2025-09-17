import { mockWorkflow, mockEcommerceWorkflow } from '../mocks/workflow';
import { mockResearcherAgent, mockAnalystAgent } from '../mocks/agent';
import { TestWorkflow, TestAgent } from '../types';

export interface TestWorkflowSetup {
  workflow: TestWorkflow;
  agents: {
    researcher: TestAgent;
    analyst: TestAgent;
  };
  executeTask: (taskName: string, agent: TestAgent) => Promise<any>;
  cleanup: () => Promise<void>;
}

export async function setupTestWorkflow(workflowType: string = 'ai_developer_discovery'): Promise<TestWorkflowSetup> {
  const researcher = mockResearcherAgent({ 
    id: 'test-researcher-1',
    status: 'idle'
  });
  
  const analyst = mockAnalystAgent({ 
    id: 'test-analyst-1',
    status: 'idle'
  });

  let workflow;
  if (workflowType === 'ecommerce_automation') {
    workflow = mockEcommerceWorkflow({
      id: `test-workflow-${Date.now()}`,
      status: 'pending',
      agents: [researcher, analyst]
    });
  } else {
    workflow = mockWorkflow({
      id: `test-workflow-${Date.now()}`,
      type: workflowType,
      status: 'pending',
      agents: [researcher, analyst]
    });
  }

  // Mock task execution function
  const executeTask = async (taskName: string, agent: TestAgent) => {
    // Simulate task execution delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    agent.status = 'busy';
    
    // Mock task results based on task name and agent type
    const result = {
      status: 'completed',
      task: taskName,
      agent: agent.id,
      config: {},
      completedAt: new Date().toISOString(),
      data: generateMockTaskData(taskName, agent.type)
    };

    agent.status = 'idle';
    
    return result;
  };

  return {
    workflow,
    agents: {
      researcher,
      analyst
    },
    executeTask,
    cleanup: async () => {
      // Reset agent states
      researcher.status = 'idle';
      analyst.status = 'idle';
      workflow.status = 'pending';
    }
  };
}

function generateMockTaskData(taskName: string, agentType: string) {
  const mockData: Record<string, any> = {
    recruit_participants: {
      participants_recruited: 20,
      demographics: {
        age_range: '25-45',
        experience_level: 'intermediate_to_expert',
        tools_used: ['VSCode', 'GitHub', 'Docker']
      }
    },
    conduct_interviews: {
      interviews_completed: 12,
      total_duration: '540 minutes',
      key_themes: ['workflow_efficiency', 'tool_integration', 'collaboration_pain_points']
    },
    collect_behavioral_data: {
      tracking_period: '14 days',
      metrics_collected: ['screen_time', 'tool_usage', 'task_completion_rates'],
      data_points: 1456
    },
    transcribe_and_code_interviews: {
      transcription_accuracy: 0.95,
      coding_framework: 'thematic_analysis',
      themes_identified: 8,
      quotes_extracted: 45
    },
    analyze_behavioral_patterns: {
      analysis_type: 'quantitative',
      patterns_identified: ['peak_productivity_hours', 'tool_switching_frequency'],
      statistical_significance: 0.05
    },
    identify_usage_patterns: {
      segmentation: 'user_behavior',
      segments_identified: 3,
      usage_patterns: ['power_user', 'casual_user', 'collaborative_user']
    }
  };

  return mockData[taskName] || {
    task_completed: true,
    agent_type: agentType,
    execution_time: '5 minutes'
  };
}
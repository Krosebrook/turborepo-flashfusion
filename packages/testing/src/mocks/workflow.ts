import { TestWorkflow } from '../types';
import { mockResearcherAgent, mockAnalystAgent } from './agent';

export function mockWorkflow(overrides: Partial<TestWorkflow> = {}): TestWorkflow {
  return {
    id: 'test-workflow-1',
    type: 'ai_developer_discovery',
    configuration: {
      studyType: 'ai_developer_discovery',
      participants: 20,
      duration: '2 weeks',
      methods: ['interviews', 'task_analysis', 'behavioral_tracking']
    },
    status: 'pending',
    agents: [
      mockResearcherAgent({ id: 'researcher-1' }),
      mockAnalystAgent({ id: 'analyst-1' })
    ],
    ...overrides
  };
}

export function mockUserResearchWorkflow(overrides: Partial<TestWorkflow> = {}): TestWorkflow {
  return mockWorkflow({
    type: 'ai_developer_discovery',
    configuration: {
      studyType: 'ai_developer_discovery',
      participants: 20,
      duration: '2 weeks',
      methods: ['interviews', 'task_analysis', 'behavioral_tracking']
    },
    ...overrides
  });
}

export function mockEcommerceWorkflow(overrides: Partial<TestWorkflow> = {}): TestWorkflow {
  return mockWorkflow({
    type: 'ecommerce_automation',
    configuration: {
      studyType: 'ecommerce_automation',
      participants: 30,
      duration: '3 weeks',
      methods: ['jtbd_interviews', 'journey_mapping', 'diary_studies']
    },
    ...overrides
  });
}
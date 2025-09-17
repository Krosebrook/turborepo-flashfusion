import { TestAgent } from '../types';

export function mockAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return {
    id: 'test-agent-1',
    type: 'researcher',
    capabilities: ['interview', 'analysis', 'reporting'],
    status: 'idle',
    ...overrides
  };
}

export function mockResearcherAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return mockAgent({
    type: 'researcher',
    capabilities: ['conduct_interviews', 'recruit_participants', 'transcribe_data'],
    ...overrides
  });
}

export function mockAnalystAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return mockAgent({
    type: 'analyst',
    capabilities: ['analyze_behavioral_patterns', 'identify_usage_patterns', 'statistical_analysis'],
    ...overrides
  });
}

export function mockCoordinatorAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return mockAgent({
    type: 'coordinator',
    capabilities: ['workflow_management', 'task_orchestration', 'progress_tracking'],
    ...overrides
  });
}
/**
 * @fileoverview AI Agent patterns and implementations
 * @author FlashFusion Development Team
 * @version 1.0.0
 */

// Export all agent patterns
export * from './patterns';

// Export agent implementations (when created)
// export * from './agents';

// Export types
export * from './types';

// Re-export the original patterns for backward compatibility
export {
  AgentOrchestrator,
  ContextManager,
  AgentCommunicationBus
} from '../agent-patterns';

// Default export
export default {
  version: '1.0.0',
  name: '@flashfusion/ai-agents'
};
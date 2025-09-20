import { AgentConfig } from '../types';

export function validateAgentConfig(config: AgentConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    errors.push('Max tokens must be greater than 0');
  }

  if (config.timeout !== undefined && config.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
import { BaseConfig } from '../types/common';

/**
 * Validate configuration object
 */
export function validateConfig(config: Partial<BaseConfig>): BaseConfig {
  const defaults: BaseConfig = {
    environment: 'development',
    debug: false,
    logLevel: 'info'
  };

  return {
    environment: config.environment || defaults.environment,
    debug: config.debug ?? defaults.debug,
    logLevel: config.logLevel || defaults.logLevel
  };
}
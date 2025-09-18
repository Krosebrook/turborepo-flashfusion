import { LogLevel } from '../types/common';

/**
 * Create a logger instance with specified log level
 */
export function createLogger(level: LogLevel = 'info') {
  const shouldLog = (messageLevel: LogLevel): boolean => {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(messageLevel) >= levels.indexOf(level);
  };

  return {
    debug: (message: string, ...args: any[]) => {
      if (shouldLog('debug')) {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog('info')) {
        console.info(`[INFO] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog('warn')) {
        console.warn(`[WARN] ${message}`, ...args);
      }
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog('error')) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  };
}
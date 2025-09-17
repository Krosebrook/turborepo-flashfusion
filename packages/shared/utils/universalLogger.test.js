/**
 * Unit tests for UniversalLogger
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock process.env before importing the logger
const originalEnv = process.env;

describe('UniversalLogger', () => {
  let logger;
  let UniversalLogger;
  let consoleSpy;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    };

    // Clear module cache and re-import
    vi.resetModules();
  });

  afterEach(() => {
    // Restore environment and console
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    beforeEach(async () => {
      const loggerModule = await import('./universalLogger.js');
      logger = loggerModule.default;
      UniversalLogger = loggerModule.UniversalLogger;
    });

    it('should log info messages', () => {
      const result = logger.info('Test message', { data: 'test' });
      
      expect(result).toBe(true);
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.info.mock.calls[0][0]).toContain('[INFO] Test message');
    });

    it('should log error messages', () => {
      const result = logger.error('Error message', new Error('test'));
      
      expect(result).toBe(true);
      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.error.mock.calls[0][0]).toContain('[ERROR] Error message');
    });

    it('should log warn messages', () => {
      const result = logger.warn('Warning message');
      
      expect(result).toBe(true);
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.warn.mock.calls[0][0]).toContain('[WARN] Warning message');
    });

    it('should log debug messages', () => {
      const result = logger.debug('Debug message');
      
      expect(result).toBe(true);
      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.debug.mock.calls[0][0]).toContain('[DEBUG] Debug message');
    });

    it('should handle logging with multiple arguments', () => {
      logger.info('Message with data', { key: 'value' }, [1, 2, 3]);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Message with data'),
        { key: 'value' },
        [1, 2, 3]
      );
    });
  });

  describe('Vercel Environment', () => {
    beforeEach(async () => {
      process.env.VERCEL = 'true';
      const loggerModule = await import('./universalLogger.js');
      logger = loggerModule.default;
    });

    it('should store logs in memory when on Vercel', () => {
      logger.info('Vercel test message');
      
      const recentLogs = logger.getRecentLogs(1);
      expect(recentLogs).toHaveLength(1);
      expect(recentLogs[0].message).toBe('Vercel test message');
      expect(recentLogs[0].level).toBe('info');
    });

    it('should limit memory logs to 1000 entries', () => {
      // Add more than 1000 logs
      for (let i = 0; i < 1100; i++) {
        logger.info(`Message ${i}`);
      }
      
      const recentLogs = logger.getRecentLogs(2000);
      expect(recentLogs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear logs when requested', () => {
      logger.info('Test message');
      expect(logger.getRecentLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getRecentLogs()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const loggerModule = await import('./universalLogger.js');
      logger = loggerModule.default;
    });

    it('should handle errors gracefully and not throw', () => {
      // Mock console to throw an error
      consoleSpy.info.mockImplementation(() => {
        throw new Error('Console error');
      });

      expect(() => {
        const result = logger.info('Test message');
        expect(result).toBe(false);
      }).not.toThrow();
    });
  });

  describe('Winston Compatibility', () => {
    beforeEach(async () => {
      const loggerModule = await import('./universalLogger.js');
      logger = loggerModule.default;
    });

    it('should provide child logger method', () => {
      const child = logger.child();
      expect(child).toBe(logger);
    });

    it('should provide winston-compatible methods', () => {
      expect(typeof logger.add).toBe('function');
      expect(typeof logger.remove).toBe('function');
      expect(typeof logger.configure).toBe('function');
      expect(logger.level).toBeDefined();
      expect(logger.transports).toBeDefined();
    });
  });

  describe('UniversalLogger Class', () => {
    it('should be instantiable', async () => {
      const loggerModule = await import('./universalLogger.js');
      const LoggerClass = loggerModule.UniversalLogger;
      
      const instance = new LoggerClass();
      expect(instance).toBeInstanceOf(LoggerClass);
      expect(typeof instance.info).toBe('function');
    });
  });
});
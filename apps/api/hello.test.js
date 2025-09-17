/**
 * Unit tests for Hello API module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Hello API Module', () => {
  let helloHandler;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    // Import the handler
    const helloModule = await import('./hello.js');
    helloHandler = helloModule.default || helloModule;

    // Mock response object
    mockRes = {
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };

    // Base mock request object
    mockReq = {
      url: '/',
      method: 'GET',
      headers: {}
    };
  });

  describe('Health Endpoint', () => {
    it('should return health status for /health endpoint', () => {
      mockReq.url = '/health';

      helloHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    it('should return valid ISO timestamp', () => {
      mockReq.url = '/health';

      helloHandler(mockReq, mockRes);

      const callArgs = mockRes.json.mock.calls[0][0];
      const timestamp = new Date(callArgs.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(callArgs.timestamp);
    });
  });

  describe('API Status Endpoint', () => {
    it('should return API status for /api/status endpoint', () => {
      mockReq.url = '/api/status';

      helloHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'API working'
      });
    });
  });

  describe('Zapier Webhook Endpoint', () => {
    it('should handle zapier webhook endpoint', () => {
      mockReq.url = '/api/zapier/incoming-webhook';

      helloHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        webhook: 'active',
        timestamp: expect.any(String)
      });
    });

    it('should handle zapier webhook endpoint with parameters', () => {
      mockReq.url = '/api/zapier/incoming-webhook?param=test';

      helloHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        webhook: 'active',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Default Response', () => {
    it('should return HTML for unknown endpoints', () => {
      mockReq.url = '/unknown-endpoint';

      helloHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('FlashFusion is Online!'));
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('<html>'));
    });

    it('should include navigation links in default response', () => {
      mockReq.url = '/';

      helloHandler(mockReq, mockRes);

      const htmlContent = mockRes.send.mock.calls[0][0];
      expect(htmlContent).toContain('/health');
      expect(htmlContent).toContain('/api/status');
      expect(htmlContent).toContain('/api/zapier/incoming-webhook');
    });

    it('should have proper HTML structure', () => {
      mockReq.url = '/';

      helloHandler(mockReq, mockRes);

      const htmlContent = mockRes.send.mock.calls[0][0];
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<title>FlashFusion - Online</title>');
      expect(htmlContent).toContain('<body');
      expect(htmlContent).toContain('</html>');
    });
  });

  describe('Function Behavior', () => {
    it('should be a function', () => {
      expect(typeof helloHandler).toBe('function');
    });

    it('should handle requests without throwing errors', () => {
      const testUrls = [
        '/',
        '/health',
        '/api/status',
        '/api/zapier/incoming-webhook',
        '/unknown',
        '/api/unknown'
      ];

      testUrls.forEach(url => {
        mockReq.url = url;
        mockRes.json.mockClear();
        mockRes.send.mockClear();

        expect(() => helloHandler(mockReq, mockRes)).not.toThrow();
      });
    });

    it('should always call either json or send on response', () => {
      const testUrls = ['/', '/health', '/api/status', '/api/zapier/incoming-webhook'];

      testUrls.forEach(url => {
        mockReq.url = url;
        mockRes.json.mockClear();
        mockRes.send.mockClear();

        helloHandler(mockReq, mockRes);

        const jsonCalled = mockRes.json.mock.calls.length > 0;
        const sendCalled = mockRes.send.mock.calls.length > 0;
        
        expect(jsonCalled || sendCalled).toBe(true);
      });
    });
  });
});
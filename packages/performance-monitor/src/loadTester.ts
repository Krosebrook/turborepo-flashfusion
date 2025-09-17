import autocannon from 'autocannon';
import { LoadTestConfig, LoadTestResult } from './types';

export class LoadTester {
  private activeTests: Map<string, any> = new Map();

  /**
   * Execute a load test against a target endpoint
   */
  async executeLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const testId = `test_${Date.now()}`;
    
    try {
      const result = await autocannon({
        url: config.url,
        connections: config.connections,
        duration: config.duration,
        method: config.method,
        headers: config.headers,
        body: config.body,
        workers: config.workers || 1,
        title: `Load Test - ${config.url}`,
      });

      this.activeTests.delete(testId);

      return this.formatResult(result);
    } catch (error) {
      this.activeTests.delete(testId);
      throw new Error(`Load test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute multiple load tests in sequence
   */
  async executeLoadTestSuite(configs: LoadTestConfig[]): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];
    
    for (const config of configs) {
      try {
        const result = await this.executeLoadTest(config);
        results.push(result);
      } catch (error) {
        console.error(`Load test failed for ${config.url}:`, error);
        results.push(this.createErrorResult(config, error instanceof Error ? error.message : String(error)));
      }
    }
    
    return results;
  }

  /**
   * Execute concurrent load tests
   */
  async executeConcurrentLoadTests(configs: LoadTestConfig[]): Promise<LoadTestResult[]> {
    const testPromises = configs.map(config => this.executeLoadTest(config));
    
    try {
      return await Promise.all(testPromises);
    } catch (error) {
      console.error('One or more concurrent load tests failed:', error);
      throw error;
    }
  }

  /**
   * Get active test statuses
   */
  getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  /**
   * Stop all active tests
   */
  stopAllTests(): void {
    this.activeTests.forEach((test, id) => {
      if (test && test.stop) {
        test.stop();
      }
    });
    this.activeTests.clear();
  }

  private formatResult(result: any): LoadTestResult {
    return {
      latency: {
        average: result.latency?.mean || 0,
        p50: result.latency?.p50 || 0,
        p75: result.latency?.p75 || 0,
        p90: result.latency?.p90 || 0,
        p95: result.latency?.p95 || 0,
        p99: result.latency?.p99 || 0,
        max: result.latency?.max || 0,
        min: result.latency?.min || 0,
      },
      throughput: {
        total: result.requests?.total || 0,
        average: result.requests?.average || 0,
        min: result.requests?.min || 0,
        max: result.requests?.max || 0,
      },
      requests: {
        total: result.requests?.total || 0,
        sent: result.requests?.sent || 0,
        completed: result.requests?.total || 0,
        errors: result.errors || 0,
      },
      duration: result.duration || 0,
      errorRate: result.errors ? (result.errors / (result.requests?.total || 1)) * 100 : 0,
      connections: result.connections || 0,
    };
  }

  private createErrorResult(config: LoadTestConfig, error: string): LoadTestResult {
    return {
      latency: {
        average: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0,
      },
      throughput: {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
      },
      requests: {
        total: 0,
        sent: 0,
        completed: 0,
        errors: 1,
      },
      duration: 0,
      errorRate: 100,
      connections: config.connections,
    };
  }
}
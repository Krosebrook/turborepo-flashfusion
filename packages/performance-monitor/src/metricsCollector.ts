import { PerformanceMetrics, MonitoringConfig } from './types';
import * as os from 'os';
import { EventEmitter } from 'events';

export class MetricsCollector extends EventEmitter {
  private config: MonitoringConfig;
  private collectionInterval: NodeJS.Timeout | null = null;
  private metrics: PerformanceMetrics[] = [];
  private maxRetentionSize = 10000; // Max number of metrics to retain in memory

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
  }

  /**
   * Start collecting metrics at specified intervals
   */
  startCollection(): void {
    if (this.collectionInterval) {
      this.stopCollection();
    }

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.reportingInterval * 1000);

    console.log(`Metrics collection started with ${this.config.reportingInterval}s interval`);
  }

  /**
   * Stop metrics collection
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      console.log('Metrics collection stopped');
    }
  }

  /**
   * Collect current system metrics
   */
  async collectSystemMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      responseTime: await this.measureResponseTime(),
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate(),
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      networkIO: await this.getNetworkIO(),
      diskIO: await this.getDiskIO(),
    };

    this.addMetric(metrics);
    this.emit('metrics', metrics);
    this.checkAlertThresholds(metrics);

    return metrics;
  }

  /**
   * Get historical metrics
   */
  getMetrics(hours: number = 24): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoffTime);
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Calculate average metrics over a time period
   */
  getAverageMetrics(hours: number = 1): Partial<PerformanceMetrics> {
    const recentMetrics = this.getMetrics(hours);
    if (recentMetrics.length === 0) return {};

    const sum = recentMetrics.reduce((acc, metric) => ({
      responseTime: acc.responseTime + metric.responseTime,
      throughput: acc.throughput + metric.throughput,
      errorRate: acc.errorRate + metric.errorRate,
      cpuUsage: acc.cpuUsage + metric.cpuUsage,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      networkIO: acc.networkIO + metric.networkIO,
      diskIO: acc.diskIO + metric.diskIO,
    }), {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      networkIO: 0,
      diskIO: 0,
    });

    const count = recentMetrics.length;
    return {
      responseTime: sum.responseTime / count,
      throughput: sum.throughput / count,
      errorRate: sum.errorRate / count,
      cpuUsage: sum.cpuUsage / count,
      memoryUsage: sum.memoryUsage / count,
      networkIO: sum.networkIO / count,
      diskIO: sum.diskIO / count,
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Remove old metrics if we exceed retention size
    if (this.metrics.length > this.maxRetentionSize) {
      this.metrics = this.metrics.slice(-this.maxRetentionSize);
    }
  }

  /**
   * Measure application response time (simplified)
   */
  private async measureResponseTime(): Promise<number> {
    const start = process.hrtime.bigint();
    
    // Simulate a small operation
    await new Promise(resolve => setImmediate(resolve));
    
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }

  /**
   * Calculate current throughput (requests per second)
   */
  private calculateThroughput(): number {
    // This would typically be calculated from actual request counts
    // For now, return a simulated value
    return Math.random() * 1000 + 500;
  }

  /**
   * Calculate current error rate
   */
  private calculateErrorRate(): number {
    // This would typically be calculated from actual error counts
    // For now, return a simulated value
    return Math.random() * 5;
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0);
    
    return cpuUsage / cpus.length;
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return (usedMemory / totalMemory) * 100;
  }

  /**
   * Get network I/O metrics (simplified)
   */
  private async getNetworkIO(): Promise<number> {
    // This would typically interface with system tools or APIs
    // For now, return a simulated value
    return Math.random() * 100;
  }

  /**
   * Get disk I/O metrics (simplified)
   */
  private async getDiskIO(): Promise<number> {
    // This would typically interface with system tools or APIs
    // For now, return a simulated value
    return Math.random() * 100;
  }

  /**
   * Check if metrics exceed alert thresholds
   */
  private checkAlertThresholds(metrics: PerformanceMetrics): void {
    const { alertThresholds } = this.config;

    if (metrics.responseTime > alertThresholds.responseTime) {
      this.emit('alert', {
        type: 'responseTime',
        message: `Response time ${metrics.responseTime}ms exceeds threshold ${alertThresholds.responseTime}ms`,
        metric: metrics,
      });
    }

    if (metrics.errorRate > alertThresholds.errorRate) {
      this.emit('alert', {
        type: 'errorRate',
        message: `Error rate ${metrics.errorRate}% exceeds threshold ${alertThresholds.errorRate}%`,
        metric: metrics,
      });
    }

    if (metrics.cpuUsage > alertThresholds.cpuUsage) {
      this.emit('alert', {
        type: 'cpuUsage',
        message: `CPU usage ${metrics.cpuUsage}% exceeds threshold ${alertThresholds.cpuUsage}%`,
        metric: metrics,
      });
    }

    if (metrics.memoryUsage > alertThresholds.memoryUsage) {
      this.emit('alert', {
        type: 'memoryUsage',
        message: `Memory usage ${metrics.memoryUsage}% exceeds threshold ${alertThresholds.memoryUsage}%`,
        metric: metrics,
      });
    }
  }
}
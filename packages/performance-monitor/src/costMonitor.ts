import { CostMetrics, CloudProvider, MonitoringConfig } from './types';
import { EventEmitter } from 'events';
import axios from 'axios';

export class CostMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private costMetrics: CostMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxRetentionSize = 10000;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
  }

  /**
   * Start monitoring cloud costs
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.collectCostMetrics();
    }, this.config.reportingInterval * 1000);

    console.log(`Cost monitoring started with ${this.config.reportingInterval}s interval`);
  }

  /**
   * Stop cost monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Cost monitoring stopped');
    }
  }

  /**
   * Collect current cost metrics from cloud provider
   */
  async collectCostMetrics(): Promise<void> {
    try {
      const metrics = await this.fetchCostMetricsFromProvider();
      this.addCostMetrics(metrics);
      this.emit('costMetrics', metrics);
      this.checkCostAlerts(metrics);
    } catch (error) {
      console.error('Failed to collect cost metrics:', error);
      this.emit('error', error);
    }
  }

  /**
   * Get cost metrics for a specific time period
   */
  getCostMetrics(hours: number = 24): CostMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.costMetrics.filter(metric => metric.timestamp >= cutoffTime);
  }

  /**
   * Get total cost for a service over time period
   */
  getTotalCost(service?: string, hours: number = 24): number {
    const metrics = this.getCostMetrics(hours);
    const filteredMetrics = service ? metrics.filter(m => m.service === service) : metrics;
    return filteredMetrics.reduce((total, metric) => total + metric.cost, 0);
  }

  /**
   * Get cost breakdown by service
   */
  getCostBreakdownByService(hours: number = 24): Record<string, number> {
    const metrics = this.getCostMetrics(hours);
    const breakdown: Record<string, number> = {};

    metrics.forEach(metric => {
      breakdown[metric.service] = (breakdown[metric.service] || 0) + metric.cost;
    });

    return breakdown;
  }

  /**
   * Get cost breakdown by instance type
   */
  getCostBreakdownByInstanceType(hours: number = 24): Record<string, number> {
    const metrics = this.getCostMetrics(hours);
    const breakdown: Record<string, number> = {};

    metrics.forEach(metric => {
      breakdown[metric.instanceType] = (breakdown[metric.instanceType] || 0) + metric.cost;
    });

    return breakdown;
  }

  /**
   * Calculate cost trend over time
   */
  getCostTrend(hours: number = 168): { period: string; cost: number }[] {
    const metrics = this.getCostMetrics(hours);
    const trend: { period: string; cost: number }[] = [];
    
    // Group by hour
    const hourlyData: Record<string, number> = {};
    metrics.forEach(metric => {
      const hour = metric.timestamp.toISOString().slice(0, 13);
      hourlyData[hour] = (hourlyData[hour] || 0) + metric.cost;
    });

    Object.entries(hourlyData).forEach(([hour, cost]) => {
      trend.push({ period: hour, cost });
    });

    return trend.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Predict cost for next period based on current usage
   */
  predictCost(hoursToPredict: number = 24): number {
    const recentMetrics = this.getCostMetrics(24); // Use last 24 hours for prediction
    if (recentMetrics.length === 0) return 0;

    const avgCostPerHour = this.getTotalCost(undefined, 24) / 24;
    return avgCostPerHour * hoursToPredict;
  }

  /**
   * Get underutilized resources
   */
  getUnderutilizedResources(): Array<{
    service: string;
    instanceType: string;
    utilizationPercent: number;
    cost: number;
    recommendation: string;
  }> {
    const metrics = this.getCostMetrics(24);
    const underutilized: Array<{
      service: string;
      instanceType: string;
      utilizationPercent: number;
      cost: number;
      recommendation: string;
    }> = [];

    // Group by service and instance type
    const resourceGroups: Record<string, CostMetrics[]> = {};
    metrics.forEach(metric => {
      const key = `${metric.service}-${metric.instanceType}`;
      if (!resourceGroups[key]) {
        resourceGroups[key] = [];
      }
      resourceGroups[key].push(metric);
    });

    Object.entries(resourceGroups).forEach(([key, groupMetrics]) => {
      const avgCpuUsage = groupMetrics.reduce((sum, m) => sum + m.usage.cpu, 0) / groupMetrics.length;
      const avgMemoryUsage = groupMetrics.reduce((sum, m) => sum + m.usage.memory, 0) / groupMetrics.length;
      const totalCost = groupMetrics.reduce((sum, m) => sum + m.cost, 0);
      
      const utilizationPercent = Math.max(avgCpuUsage, avgMemoryUsage);
      
      if (utilizationPercent < 30) { // Consider resources with < 30% utilization as underutilized
        const [service, instanceType] = key.split('-');
        underutilized.push({
          service,
          instanceType,
          utilizationPercent,
          cost: totalCost,
          recommendation: this.generateRightsizingRecommendation(utilizationPercent, instanceType),
        });
      }
    });

    return underutilized;
  }

  /**
   * Fetch cost metrics from cloud provider
   */
  private async fetchCostMetricsFromProvider(): Promise<CostMetrics[]> {
    const { cloudProvider } = this.config;
    
    switch (cloudProvider.name) {
      case 'aws':
        return this.fetchAWSCostMetrics();
      case 'azure':
        return this.fetchAzureCostMetrics();
      case 'gcp':
        return this.fetchGCPCostMetrics();
      default:
        return this.generateMockCostMetrics();
    }
  }

  /**
   * Fetch AWS cost metrics
   */
  private async fetchAWSCostMetrics(): Promise<CostMetrics[]> {
    // In a real implementation, this would use AWS Cost Explorer API
    // For now, return mock data
    return this.generateMockCostMetrics();
  }

  /**
   * Fetch Azure cost metrics
   */
  private async fetchAzureCostMetrics(): Promise<CostMetrics[]> {
    // In a real implementation, this would use Azure Cost Management API
    // For now, return mock data
    return this.generateMockCostMetrics();
  }

  /**
   * Fetch GCP cost metrics
   */
  private async fetchGCPCostMetrics(): Promise<CostMetrics[]> {
    // In a real implementation, this would use Google Cloud Billing API
    // For now, return mock data
    return this.generateMockCostMetrics();
  }

  /**
   * Generate mock cost metrics for demonstration
   */
  private generateMockCostMetrics(): CostMetrics[] {
    const services = ['ec2', 'rds', 'lambda', 'eks', 's3'];
    const instanceTypes = ['t3.micro', 't3.small', 't3.medium', 'm5.large', 'c5.xlarge'];
    const metrics: CostMetrics[] = [];

    services.forEach(service => {
      const instanceType = instanceTypes[Math.floor(Math.random() * instanceTypes.length)];
      metrics.push({
        timestamp: new Date(),
        service,
        region: this.config.cloudProvider.region,
        instanceType,
        cost: Math.random() * 10 + 1, // $1-$11 per hour
        currency: 'USD',
        usage: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          storage: Math.random() * 100,
          network: Math.random() * 100,
        },
      });
    });

    return metrics;
  }

  /**
   * Add cost metrics to internal storage
   */
  private addCostMetrics(metrics: CostMetrics[]): void {
    this.costMetrics.push(...metrics);
    
    // Remove old metrics if we exceed retention size
    if (this.costMetrics.length > this.maxRetentionSize) {
      this.costMetrics = this.costMetrics.slice(-this.maxRetentionSize);
    }
  }

  /**
   * Check for cost alerts
   */
  private checkCostAlerts(metrics: CostMetrics[]): void {
    const totalCost = metrics.reduce((sum, metric) => sum + metric.cost, 0);
    
    if (totalCost > this.config.alertThresholds.cost) {
      this.emit('alert', {
        type: 'cost',
        message: `Current cost $${totalCost.toFixed(2)} exceeds threshold $${this.config.alertThresholds.cost}`,
        metrics,
      });
    }
  }

  /**
   * Generate rightsizing recommendation
   */
  private generateRightsizingRecommendation(utilizationPercent: number, instanceType: string): string {
    if (utilizationPercent < 10) {
      return `Consider shutting down this resource or moving to a smaller instance type`;
    } else if (utilizationPercent < 20) {
      return `Consider downsizing to a smaller instance type`;
    } else if (utilizationPercent < 30) {
      return `Monitor usage patterns and consider rightsizing during next maintenance window`;
    }
    return 'No immediate action needed';
  }
}
import { OptimizationRecommendation, PerformanceMetrics, CostMetrics, CapacityForecast } from './types';
import { MetricsCollector } from './metricsCollector';
import { CostMonitor } from './costMonitor';
import { CapacityForecaster } from './capacityForecaster';

export class OptimizationEngine {
  private metricsCollector: MetricsCollector;
  private costMonitor: CostMonitor;
  private capacityForecaster: CapacityForecaster;

  constructor(
    metricsCollector: MetricsCollector,
    costMonitor: CostMonitor,
    capacityForecaster: CapacityForecaster
  ) {
    this.metricsCollector = metricsCollector;
    this.costMonitor = costMonitor;
    this.capacityForecaster = capacityForecaster;
  }

  /**
   * Generate comprehensive optimization recommendations
   */
  generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Autoscaling recommendations
    recommendations.push(...this.generateAutoscalingRecommendations());

    // Instance rightsizing recommendations
    recommendations.push(...this.generateRightsizingRecommendations());

    // Reserved instance recommendations
    recommendations.push(...this.generateReservedInstanceRecommendations());

    // Cost optimization recommendations
    recommendations.push(...this.generateCostOptimizationRecommendations());

    // Sort by priority and estimated savings
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedSavings - a.estimatedSavings;
    });
  }

  /**
   * Generate autoscaling recommendations
   */
  private generateAutoscalingRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const recentMetrics = this.metricsCollector.getMetrics(24);
    const averageMetrics = this.metricsCollector.getAverageMetrics(24);

    if (!averageMetrics.cpuUsage || !averageMetrics.memoryUsage) {
      return recommendations;
    }

    // High CPU usage - scale up recommendation
    if (averageMetrics.cpuUsage > 80) {
      recommendations.push({
        id: `autoscale-up-${Date.now()}`,
        type: 'autoscaling',
        priority: 'high',
        title: 'Enable Horizontal Auto Scaling - Scale Up',
        description: 'High CPU usage detected. Implement horizontal auto scaling to handle increased load.',
        estimatedSavings: 0,
        estimatedSavingsPercent: 0,
        implementationEffort: 'medium',
        risks: ['Increased costs during scale-up events', 'Potential brief service disruption during deployment'],
        benefits: [
          'Improved application performance',
          'Better user experience',
          'Reduced risk of service outages',
          'Automatic load handling'
        ],
        actionItems: [
          'Configure auto scaling group with target CPU threshold of 70%',
          'Set up CloudWatch alarms for scaling triggers',
          'Test scaling policies in staging environment',
          'Implement health checks for new instances'
        ],
        metrics: {
          current: { cpuUsage: averageMetrics.cpuUsage, instances: 1 },
          projected: { cpuUsage: 60, instances: 2 }
        }
      });
    }

    // Low resource usage - scale down recommendation
    if (averageMetrics.cpuUsage < 20 && averageMetrics.memoryUsage < 30) {
      const estimatedSavings = 500; // Monthly savings
      recommendations.push({
        id: `autoscale-down-${Date.now()}`,
        type: 'autoscaling',
        priority: 'medium',
        title: 'Enable Horizontal Auto Scaling - Scale Down',
        description: 'Low resource utilization detected. Implement auto scaling to reduce costs during low-demand periods.',
        estimatedSavings,
        estimatedSavingsPercent: 30,
        implementationEffort: 'medium',
        risks: ['Potential increased latency during scale-up events'],
        benefits: [
          'Significant cost reduction during low-demand periods',
          'Automatic resource optimization',
          'Better resource efficiency'
        ],
        actionItems: [
          'Configure auto scaling group with minimum instances of 1',
          'Set scale-down cooldown period to prevent thrashing',
          'Implement predictive scaling based on historical patterns',
          'Configure notifications for scaling events'
        ],
        metrics: {
          current: { cpuUsage: averageMetrics.cpuUsage, monthlyCost: 1667 },
          projected: { cpuUsage: 35, monthlyCost: 1167 }
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate instance rightsizing recommendations
   */
  private generateRightsizingRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const underutilizedResources = this.costMonitor.getUnderutilizedResources();

    underutilizedResources.forEach(resource => {
      if (resource.utilizationPercent < 20) {
        const estimatedSavings = resource.cost * 0.5 * 24 * 30; // 50% savings per month
        
        recommendations.push({
          id: `rightsize-${resource.service}-${Date.now()}`,
          type: 'instance-rightsizing',
          priority: resource.utilizationPercent < 10 ? 'high' : 'medium',
          title: `Rightsize ${resource.service} Instance`,
          description: `${resource.service} (${resource.instanceType}) is underutilized at ${resource.utilizationPercent.toFixed(1)}%. Consider downsizing.`,
          estimatedSavings,
          estimatedSavingsPercent: 50,
          implementationEffort: 'low',
          risks: [
            'Potential performance impact if usage patterns change',
            'Brief downtime during instance type change'
          ],
          benefits: [
            'Significant cost reduction',
            'Better resource efficiency',
            'Reduced infrastructure complexity'
          ],
          actionItems: [
            'Analyze historical usage patterns over 30 days',
            'Test application with smaller instance type in staging',
            'Schedule maintenance window for instance type change',
            'Monitor performance after downsizing'
          ],
          metrics: {
            current: { 
              utilizationPercent: resource.utilizationPercent,
              monthlyCost: resource.cost * 24 * 30,
              instanceType: resource.instanceType
            },
            projected: { 
              utilizationPercent: resource.utilizationPercent * 2,
              monthlyCost: resource.cost * 24 * 30 * 0.5,
              smallerInstanceType: this.getSmallerInstanceType(resource.instanceType)
            }
          }
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate reserved instance recommendations
   */
  private generateReservedInstanceRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const costBreakdown = this.costMonitor.getCostBreakdownByInstanceType(24 * 30); // 30 days
    
    Object.entries(costBreakdown).forEach(([instanceType, monthlyCost]) => {
      if (monthlyCost > 100) { // Only recommend RI for instances with >$100/month cost
        const estimatedSavings = monthlyCost * 0.3 * 12; // 30% savings over 1 year
        
        recommendations.push({
          id: `reserved-instance-${instanceType}-${Date.now()}`,
          type: 'reserved-instances',
          priority: monthlyCost > 500 ? 'high' : 'medium',
          title: `Purchase Reserved Instance for ${instanceType}`,
          description: `High utilization detected for ${instanceType}. Purchase 1-year reserved instance for 30% savings.`,
          estimatedSavings,
          estimatedSavingsPercent: 30,
          implementationEffort: 'low',
          risks: [
            'Upfront payment required',
            'Commitment for 1-3 years',
            'Less flexibility for instance type changes'
          ],
          benefits: [
            'Significant cost savings (up to 75%)',
            'Predictable monthly costs',
            'Priority access to capacity'
          ],
          actionItems: [
            'Analyze usage patterns to confirm consistent utilization',
            'Compare 1-year vs 3-year reserved instance pricing',
            'Purchase reserved instances for consistent workloads',
            'Set up cost monitoring for reserved instance utilization'
          ],
          metrics: {
            current: { 
              monthlyCost,
              instanceType,
              utilizationConsistency: 95
            },
            projected: { 
              monthlyCost: monthlyCost * 0.7,
              reservedInstanceType: instanceType,
              utilizationConsistency: 95
            }
          }
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const totalMonthlyCost = this.costMonitor.getTotalCost(undefined, 24 * 30);
    const costTrend = this.costMonitor.getCostTrend(168); // 1 week trend

    // Analyze cost trend
    if (costTrend.length > 2) {
      const firstCost = costTrend[0].cost;
      const lastCost = costTrend[costTrend.length - 1].cost;
      const costIncrease = ((lastCost - firstCost) / firstCost) * 100;

      if (costIncrease > 20) {
        recommendations.push({
          id: `cost-spike-analysis-${Date.now()}`,
          type: 'cost-optimization',
          priority: 'high',
          title: 'Investigate Cost Spike',
          description: `Detected ${costIncrease.toFixed(1)}% cost increase over the past week. Immediate investigation required.`,
          estimatedSavings: totalMonthlyCost * 0.2,
          estimatedSavingsPercent: 20,
          implementationEffort: 'high',
          risks: ['Continued cost growth if not addressed'],
          benefits: [
            'Prevent runaway costs',
            'Identify cost optimization opportunities',
            'Improve cost visibility'
          ],
          actionItems: [
            'Analyze detailed cost breakdown by service',
            'Review recent deployments and changes',
            'Check for unexpected resource provisioning',
            'Implement cost alerts and budgets'
          ],
          metrics: {
            current: { weeklyGrowthRate: costIncrease, monthlyCost: totalMonthlyCost },
            projected: { weeklyGrowthRate: 0, monthlyCost: totalMonthlyCost * 0.8 }
          }
        });
      }
    }

    // Storage optimization
    recommendations.push({
      id: `storage-optimization-${Date.now()}`,
      type: 'cost-optimization',
      priority: 'low',
      title: 'Optimize Storage Costs',
      description: 'Implement lifecycle policies and storage tiering to reduce storage costs.',
      estimatedSavings: totalMonthlyCost * 0.1,
      estimatedSavingsPercent: 10,
      implementationEffort: 'medium',
      risks: ['Potential data retrieval delays for archived data'],
      benefits: [
        'Reduced storage costs',
        'Better data lifecycle management',
        'Compliance with data retention policies'
      ],
      actionItems: [
        'Implement S3 lifecycle policies for automated tiering',
        'Archive old logs and backups to cheaper storage tiers',
        'Review and clean up unused snapshots and volumes',
        'Implement data compression where applicable'
      ],
      metrics: {
        current: { storageGrowthRate: 15, dataRetentionDays: 365 },
        projected: { storageGrowthRate: 5, dataRetentionDays: 90 }
      }
    });

    return recommendations;
  }

  /**
   * Get smaller instance type for rightsizing
   */
  private getSmallerInstanceType(currentType: string): string {
    const sizingMap: Record<string, string> = {
      't3.large': 't3.medium',
      't3.medium': 't3.small',
      't3.small': 't3.micro',
      'm5.xlarge': 'm5.large',
      'm5.large': 'm5.medium',
      'm5.medium': 'm5.small',
      'c5.xlarge': 'c5.large',
      'c5.large': 'c5.medium',
    };

    return sizingMap[currentType] || currentType;
  }

  /**
   * Generate performance optimization recommendations
   */
  generatePerformanceRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const averageMetrics = this.metricsCollector.getAverageMetrics(24);

    if (!averageMetrics.responseTime) return recommendations;

    // High response time recommendation
    if (averageMetrics.responseTime > 1000) { // > 1 second
      recommendations.push({
        id: `performance-response-time-${Date.now()}`,
        type: 'cost-optimization',
        priority: 'high',
        title: 'Optimize Application Response Time',
        description: `Average response time of ${averageMetrics.responseTime.toFixed(0)}ms exceeds acceptable thresholds.`,
        estimatedSavings: 0,
        estimatedSavingsPercent: 0,
        implementationEffort: 'high',
        risks: ['Application changes may introduce bugs'],
        benefits: [
          'Improved user experience',
          'Better application performance',
          'Reduced server resource usage',
          'Higher customer satisfaction'
        ],
        actionItems: [
          'Profile application performance bottlenecks',
          'Implement caching strategies',
          'Optimize database queries',
          'Consider CDN for static assets',
          'Review and optimize API endpoints'
        ],
        metrics: {
          current: { responseTime: averageMetrics.responseTime, userSatisfaction: 70 },
          projected: { responseTime: 300, userSatisfaction: 90 }
        }
      });
    }

    return recommendations;
  }
}
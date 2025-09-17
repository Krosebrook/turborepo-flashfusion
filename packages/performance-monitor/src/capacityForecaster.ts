import { CapacityForecast, PerformanceMetrics, CostMetrics } from './types';

export class CapacityForecaster {
  private performanceHistory: PerformanceMetrics[] = [];
  private costHistory: CostMetrics[] = [];

  /**
   * Add performance metrics to historical data
   */
  addPerformanceMetrics(metrics: PerformanceMetrics[]): void {
    this.performanceHistory.push(...metrics);
    // Keep only last 30 days of data for forecasting
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.performanceHistory = this.performanceHistory.filter(m => m.timestamp >= thirtyDaysAgo);
  }

  /**
   * Add cost metrics to historical data
   */
  addCostMetrics(metrics: CostMetrics[]): void {
    this.costHistory.push(...metrics);
    // Keep only last 30 days of data for forecasting
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.costHistory = this.costHistory.filter(m => m.timestamp >= thirtyDaysAgo);
  }

  /**
   * Forecast capacity needs for a service
   */
  forecastCapacity(service: string, hoursAhead: number = 24): CapacityForecast {
    const recentMetrics = this.getRecentPerformanceMetrics(168); // 7 days
    
    if (recentMetrics.length < 10) {
      return this.createLowConfidenceForecast(service, hoursAhead);
    }

    const loadTrend = this.calculateLoadTrend(recentMetrics);
    const seasonalPattern = this.detectSeasonalPattern(recentMetrics);
    const predictedLoad = this.predictLoad(loadTrend, seasonalPattern, hoursAhead);
    const recommendedCapacity = this.calculateRecommendedCapacity(predictedLoad);
    const confidence = this.calculateConfidence(recentMetrics);

    return {
      timestamp: new Date(),
      service,
      predictedLoad,
      recommendedCapacity,
      confidence,
      timeframe: `${hoursAhead} hours`,
      basedOnMetrics: ['throughput', 'responseTime', 'cpuUsage', 'memoryUsage'],
    };
  }

  /**
   * Forecast capacity for multiple services
   */
  forecastMultipleServices(services: string[], hoursAhead: number = 24): CapacityForecast[] {
    return services.map(service => this.forecastCapacity(service, hoursAhead));
  }

  /**
   * Get capacity recommendations for different time horizons
   */
  getCapacityRecommendations(service: string): {
    shortTerm: CapacityForecast;
    mediumTerm: CapacityForecast;
    longTerm: CapacityForecast;
  } {
    return {
      shortTerm: this.forecastCapacity(service, 24), // 1 day
      mediumTerm: this.forecastCapacity(service, 168), // 1 week
      longTerm: this.forecastCapacity(service, 720), // 1 month
    };
  }

  /**
   * Predict resource utilization patterns
   */
  predictUtilizationPattern(hoursAhead: number = 24): Array<{
    hour: number;
    predictedCpuUsage: number;
    predictedMemoryUsage: number;
    predictedThroughput: number;
  }> {
    const recentMetrics = this.getRecentPerformanceMetrics(168);
    const pattern: Array<{
      hour: number;
      predictedCpuUsage: number;
      predictedMemoryUsage: number;
      predictedThroughput: number;
    }> = [];

    for (let hour = 0; hour < hoursAhead; hour++) {
      const hourOfDay = (new Date().getHours() + hour) % 24;
      const historicalDataForHour = this.getMetricsForHour(recentMetrics, hourOfDay);
      
      pattern.push({
        hour: hourOfDay,
        predictedCpuUsage: this.calculateAverageForMetric(historicalDataForHour, 'cpuUsage'),
        predictedMemoryUsage: this.calculateAverageForMetric(historicalDataForHour, 'memoryUsage'),
        predictedThroughput: this.calculateAverageForMetric(historicalDataForHour, 'throughput'),
      });
    }

    return pattern;
  }

  /**
   * Detect anomalies in usage patterns
   */
  detectAnomalies(): Array<{
    timestamp: Date;
    metric: string;
    value: number;
    expectedValue: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    const recentMetrics = this.getRecentPerformanceMetrics(24);
    const anomalies: Array<{
      timestamp: Date;
      metric: string;
      value: number;
      expectedValue: number;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    recentMetrics.forEach(metric => {
      const hourOfDay = metric.timestamp.getHours();
      const historicalDataForHour = this.getMetricsForHour(
        this.getRecentPerformanceMetrics(168),
        hourOfDay
      );

      // Check CPU usage
      const expectedCpuUsage = this.calculateAverageForMetric(historicalDataForHour, 'cpuUsage');
      const cpuDeviation = Math.abs(metric.cpuUsage - expectedCpuUsage) / expectedCpuUsage;
      
      if (cpuDeviation > 0.5) { // 50% deviation
        anomalies.push({
          timestamp: metric.timestamp,
          metric: 'cpuUsage',
          value: metric.cpuUsage,
          expectedValue: expectedCpuUsage,
          severity: cpuDeviation > 1 ? 'high' : cpuDeviation > 0.75 ? 'medium' : 'low',
        });
      }

      // Check memory usage
      const expectedMemoryUsage = this.calculateAverageForMetric(historicalDataForHour, 'memoryUsage');
      const memoryDeviation = Math.abs(metric.memoryUsage - expectedMemoryUsage) / expectedMemoryUsage;
      
      if (memoryDeviation > 0.5) {
        anomalies.push({
          timestamp: metric.timestamp,
          metric: 'memoryUsage',
          value: metric.memoryUsage,
          expectedValue: expectedMemoryUsage,
          severity: memoryDeviation > 1 ? 'high' : memoryDeviation > 0.75 ? 'medium' : 'low',
        });
      }
    });

    return anomalies;
  }

  /**
   * Get recent performance metrics
   */
  private getRecentPerformanceMetrics(hours: number): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceHistory.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Calculate load trend
   */
  private calculateLoadTrend(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 2) return 0;

    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const first = sortedMetrics[0];
    const last = sortedMetrics[sortedMetrics.length - 1];
    
    const timeSpan = last.timestamp.getTime() - first.timestamp.getTime();
    const loadChange = last.throughput - first.throughput;
    
    return loadChange / (timeSpan / (1000 * 60 * 60)); // Load change per hour
  }

  /**
   * Detect seasonal patterns in the data
   */
  private detectSeasonalPattern(metrics: PerformanceMetrics[]): Record<number, number> {
    const hourlyAverages: Record<number, number[]> = {};
    
    metrics.forEach(metric => {
      const hour = metric.timestamp.getHours();
      if (!hourlyAverages[hour]) {
        hourlyAverages[hour] = [];
      }
      hourlyAverages[hour].push(metric.throughput);
    });

    const seasonalPattern: Record<number, number> = {};
    Object.entries(hourlyAverages).forEach(([hour, values]) => {
      seasonalPattern[parseInt(hour)] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return seasonalPattern;
  }

  /**
   * Predict load based on trend and seasonal patterns
   */
  private predictLoad(trend: number, seasonalPattern: Record<number, number>, hoursAhead: number): number {
    const currentHour = new Date().getHours();
    const targetHour = (currentHour + hoursAhead) % 24;
    
    const seasonalComponent = seasonalPattern[targetHour] || 0;
    const trendComponent = trend * hoursAhead;
    
    return Math.max(0, seasonalComponent + trendComponent);
  }

  /**
   * Calculate recommended capacity based on predicted load
   */
  private calculateRecommendedCapacity(predictedLoad: number): number {
    // Add 20% buffer for safety
    return Math.ceil(predictedLoad * 1.2);
  }

  /**
   * Calculate confidence level of the forecast
   */
  private calculateConfidence(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 10) return 0.3;
    if (metrics.length < 50) return 0.6;
    if (metrics.length < 100) return 0.8;
    return 0.9;
  }

  /**
   * Create low confidence forecast when insufficient data
   */
  private createLowConfidenceForecast(service: string, hoursAhead: number): CapacityForecast {
    return {
      timestamp: new Date(),
      service,
      predictedLoad: 0,
      recommendedCapacity: 1, // Minimum capacity
      confidence: 0.1,
      timeframe: `${hoursAhead} hours`,
      basedOnMetrics: ['insufficient data'],
    };
  }

  /**
   * Get metrics for a specific hour of day
   */
  private getMetricsForHour(metrics: PerformanceMetrics[], hour: number): PerformanceMetrics[] {
    return metrics.filter(m => m.timestamp.getHours() === hour);
  }

  /**
   * Calculate average for a specific metric
   */
  private calculateAverageForMetric(metrics: PerformanceMetrics[], metricName: keyof PerformanceMetrics): number {
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => {
      const value = metric[metricName];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return sum / metrics.length;
  }
}
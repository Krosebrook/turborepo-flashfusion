import { LoadTester } from '../loadTester';
import { MetricsCollector } from '../metricsCollector';
import { CostMonitor } from '../costMonitor';
import { CapacityForecaster } from '../capacityForecaster';
import { OptimizationEngine } from '../optimizationEngine';
import { LoadTestConfig, MonitoringConfig, PerformanceMetrics, CostMetrics } from '../types';

describe('Performance Monitor Package', () => {
  describe('LoadTester', () => {
    let loadTester: LoadTester;

    beforeEach(() => {
      loadTester = new LoadTester();
    });

    afterEach(() => {
      loadTester.stopAllTests();
    });

    it('should create load test configuration', () => {
      const config: LoadTestConfig = {
        url: 'http://localhost:3000/api/test',
        connections: 10,
        duration: 10,
        method: 'GET'
      };

      expect(config.url).toBe('http://localhost:3000/api/test');
      expect(config.connections).toBe(10);
      expect(config.duration).toBe(10);
      expect(config.method).toBe('GET');
    });

    it('should track active tests', () => {
      expect(loadTester.getActiveTests()).toEqual([]);
    });

    it('should handle invalid URLs gracefully', async () => {
      const config: LoadTestConfig = {
        url: 'invalid-url',
        connections: 1,
        duration: 1,
        method: 'GET'
      };

      await expect(loadTester.executeLoadTest(config)).rejects.toThrow();
    });
  });

  describe('MetricsCollector', () => {
    let metricsCollector: MetricsCollector;
    let config: MonitoringConfig;

    beforeEach(() => {
      config = {
        cloudProvider: {
          name: 'aws',
          region: 'us-east-1'
        },
        services: ['web', 'api'],
        alertThresholds: {
          responseTime: 1000,
          errorRate: 5,
          cpuUsage: 80,
          memoryUsage: 85,
          cost: 1000
        },
        reportingInterval: 60,
        retentionPeriod: 3600
      };
      metricsCollector = new MetricsCollector(config);
    });

    afterEach(() => {
      metricsCollector.stopCollection();
    });

    it('should collect system metrics', async () => {
      const metrics = await metricsCollector.collectSystemMetrics();
      
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('networkIO');
      expect(metrics).toHaveProperty('diskIO');
      
      expect(typeof metrics.responseTime).toBe('number');
      expect(typeof metrics.throughput).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.cpuUsage).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.networkIO).toBe('number');
      expect(typeof metrics.diskIO).toBe('number');
    });

    it('should calculate average metrics', async () => {
      // Collect some metrics
      await metricsCollector.collectSystemMetrics();
      await metricsCollector.collectSystemMetrics();
      
      const averages = metricsCollector.getAverageMetrics(1);
      
      expect(averages).toHaveProperty('responseTime');
      expect(averages).toHaveProperty('throughput');
      expect(averages).toHaveProperty('cpuUsage');
      expect(averages).toHaveProperty('memoryUsage');
    });

    it('should emit alerts when thresholds are exceeded', (done) => {
      metricsCollector.on('alert', (alert) => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('metric');
        done();
      });

      // Simulate high CPU usage
      const highCpuMetrics: PerformanceMetrics = {
        timestamp: new Date(),
        responseTime: 100,
        throughput: 100,
        errorRate: 1,
        cpuUsage: 95, // Above threshold
        memoryUsage: 50,
        networkIO: 10,
        diskIO: 10
      };

      // Directly emit the metrics to trigger alert check
      metricsCollector.emit('metrics', highCpuMetrics);
    });
  });

  describe('CostMonitor', () => {
    let costMonitor: CostMonitor;
    let config: MonitoringConfig;

    beforeEach(() => {
      config = {
        cloudProvider: {
          name: 'aws',
          region: 'us-east-1'
        },
        services: ['web', 'api'],
        alertThresholds: {
          responseTime: 1000,
          errorRate: 5,
          cpuUsage: 80,
          memoryUsage: 85,
          cost: 100
        },
        reportingInterval: 60,
        retentionPeriod: 3600
      };
      costMonitor = new CostMonitor(config);
    });

    afterEach(() => {
      costMonitor.stopMonitoring();
    });

    it('should collect cost metrics', async () => {
      await costMonitor.collectCostMetrics();
      const metrics = costMonitor.getCostMetrics(1);
      
      expect(Array.isArray(metrics)).toBe(true);
      if (metrics.length > 0) {
        expect(metrics[0]).toHaveProperty('timestamp');
        expect(metrics[0]).toHaveProperty('service');
        expect(metrics[0]).toHaveProperty('region');
        expect(metrics[0]).toHaveProperty('instanceType');
        expect(metrics[0]).toHaveProperty('cost');
        expect(metrics[0]).toHaveProperty('currency');
        expect(metrics[0]).toHaveProperty('usage');
      }
    });

    it('should calculate total cost', async () => {
      await costMonitor.collectCostMetrics();
      const totalCost = costMonitor.getTotalCost(undefined, 1);
      
      expect(typeof totalCost).toBe('number');
      expect(totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should get cost breakdown by service', async () => {
      await costMonitor.collectCostMetrics();
      const breakdown = costMonitor.getCostBreakdownByService(1);
      
      expect(typeof breakdown).toBe('object');
      Object.values(breakdown).forEach(cost => {
        expect(typeof cost).toBe('number');
        expect(cost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify underutilized resources', async () => {
      await costMonitor.collectCostMetrics();
      const underutilized = costMonitor.getUnderutilizedResources();
      
      expect(Array.isArray(underutilized)).toBe(true);
      underutilized.forEach(resource => {
        expect(resource).toHaveProperty('service');
        expect(resource).toHaveProperty('instanceType');
        expect(resource).toHaveProperty('utilizationPercent');
        expect(resource).toHaveProperty('cost');
        expect(resource).toHaveProperty('recommendation');
      });
    });

    it('should predict future costs', async () => {
      await costMonitor.collectCostMetrics();
      const predictedCost = costMonitor.predictCost(24);
      
      expect(typeof predictedCost).toBe('number');
      expect(predictedCost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CapacityForecaster', () => {
    let capacityForecaster: CapacityForecaster;

    beforeEach(() => {
      capacityForecaster = new CapacityForecaster();
    });

    it('should generate capacity forecast', () => {
      const forecast = capacityForecaster.forecastCapacity('web-service', 24);
      
      expect(forecast).toHaveProperty('timestamp');
      expect(forecast).toHaveProperty('service');
      expect(forecast).toHaveProperty('predictedLoad');
      expect(forecast).toHaveProperty('recommendedCapacity');
      expect(forecast).toHaveProperty('confidence');
      expect(forecast).toHaveProperty('timeframe');
      expect(forecast).toHaveProperty('basedOnMetrics');
      
      expect(forecast.service).toBe('web-service');
      expect(forecast.timeframe).toBe('24 hours');
    });

    it('should provide low confidence forecast with insufficient data', () => {
      const forecast = capacityForecaster.forecastCapacity('new-service', 24);
      
      expect(forecast.confidence).toBeLessThan(0.5);
      expect(forecast.basedOnMetrics).toContain('insufficient data');
    });

    it('should forecast multiple services', () => {
      const services = ['web', 'api', 'database'];
      const forecasts = capacityForecaster.forecastMultipleServices(services, 24);
      
      expect(forecasts).toHaveLength(3);
      forecasts.forEach((forecast, index) => {
        expect(forecast.service).toBe(services[index]);
      });
    });

    it('should predict utilization patterns', () => {
      const pattern = capacityForecaster.predictUtilizationPattern(24);
      
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern).toHaveLength(24);
      
      pattern.forEach(hour => {
        expect(hour).toHaveProperty('hour');
        expect(hour).toHaveProperty('predictedCpuUsage');
        expect(hour).toHaveProperty('predictedMemoryUsage');
        expect(hour).toHaveProperty('predictedThroughput');
        
        expect(hour.hour).toBeGreaterThanOrEqual(0);
        expect(hour.hour).toBeLessThan(24);
      });
    });

    it('should detect anomalies', () => {
      // Add some performance metrics first
      const metrics: PerformanceMetrics[] = [
        {
          timestamp: new Date(),
          responseTime: 100,
          throughput: 1000,
          errorRate: 1,
          cpuUsage: 50,
          memoryUsage: 60,
          networkIO: 100,
          diskIO: 50
        }
      ];
      capacityForecaster.addPerformanceMetrics(metrics);
      
      const anomalies = capacityForecaster.detectAnomalies();
      
      expect(Array.isArray(anomalies)).toBe(true);
    });
  });

  describe('OptimizationEngine', () => {
    let optimizationEngine: OptimizationEngine;
    let metricsCollector: MetricsCollector;
    let costMonitor: CostMonitor;
    let capacityForecaster: CapacityForecaster;
    let config: MonitoringConfig;

    beforeEach(() => {
      config = {
        cloudProvider: {
          name: 'aws',
          region: 'us-east-1'
        },
        services: ['web', 'api'],
        alertThresholds: {
          responseTime: 1000,
          errorRate: 5,
          cpuUsage: 80,
          memoryUsage: 85,
          cost: 1000
        },
        reportingInterval: 60,
        retentionPeriod: 3600
      };

      metricsCollector = new MetricsCollector(config);
      costMonitor = new CostMonitor(config);
      capacityForecaster = new CapacityForecaster();
      optimizationEngine = new OptimizationEngine(metricsCollector, costMonitor, capacityForecaster);
    });

    afterEach(() => {
      metricsCollector.stopCollection();
      costMonitor.stopMonitoring();
    });

    it('should generate optimization recommendations', () => {
      const recommendations = optimizationEngine.generateRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should generate performance recommendations', () => {
      const recommendations = optimizationEngine.generatePerformanceRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should sort recommendations by priority and savings', async () => {
      // Add some mock data to trigger recommendations
      await metricsCollector.collectSystemMetrics();
      await costMonitor.collectCostMetrics();
      
      const recommendations = optimizationEngine.generateRecommendations();
      
      if (recommendations.length > 1) {
        for (let i = 0; i < recommendations.length - 1; i++) {
          const current = recommendations[i];
          const next = recommendations[i + 1];
          
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          const currentPriority = priorityWeight[current.priority];
          const nextPriority = priorityWeight[next.priority];
          
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });

    it('should include required fields in recommendations', async () => {
      await metricsCollector.collectSystemMetrics();
      await costMonitor.collectCostMetrics();
      
      const recommendations = optimizationEngine.generateRecommendations();
      
      recommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('estimatedSavings');
        expect(recommendation).toHaveProperty('estimatedSavingsPercent');
        expect(recommendation).toHaveProperty('implementationEffort');
        expect(recommendation).toHaveProperty('risks');
        expect(recommendation).toHaveProperty('benefits');
        expect(recommendation).toHaveProperty('actionItems');
        expect(recommendation).toHaveProperty('metrics');
        
        expect(['autoscaling', 'instance-rightsizing', 'reserved-instances', 'cost-optimization']).toContain(recommendation.type);
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
        expect(['low', 'medium', 'high']).toContain(recommendation.implementationEffort);
      });
    });
  });
});
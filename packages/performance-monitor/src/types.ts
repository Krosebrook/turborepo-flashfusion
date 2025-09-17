export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  diskIO: number;
}

export interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  workers?: number;
}

export interface LoadTestResult {
  latency: {
    average: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };
  throughput: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
  requests: {
    total: number;
    sent: number;
    completed: number;
    errors: number;
  };
  duration: number;
  errorRate: number;
  connections: number;
}

export interface CostMetrics {
  timestamp: Date;
  service: string;
  region: string;
  instanceType: string;
  cost: number;
  currency: string;
  usage: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
}

export interface CapacityForecast {
  timestamp: Date;
  service: string;
  predictedLoad: number;
  recommendedCapacity: number;
  confidence: number;
  timeframe: string;
  basedOnMetrics: string[];
}

export interface OptimizationRecommendation {
  id: string;
  type: 'autoscaling' | 'instance-rightsizing' | 'reserved-instances' | 'cost-optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedSavingsPercent: number;
  implementationEffort: 'low' | 'medium' | 'high';
  risks: string[];
  benefits: string[];
  actionItems: string[];
  metrics: {
    current: Record<string, any>;
    projected: Record<string, any>;
  };
}

export interface CloudProvider {
  name: 'aws' | 'azure' | 'gcp' | 'other';
  region: string;
  credentials?: Record<string, string>;
}

export interface MonitoringConfig {
  cloudProvider: CloudProvider;
  services: string[];
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    cost: number;
  };
  reportingInterval: number;
  retentionPeriod: number;
}
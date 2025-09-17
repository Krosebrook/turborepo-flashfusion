# Performance & Cost Optimization Examples

## Quick Start Examples

### 1. Basic Performance Monitoring

```javascript
const { MetricsCollector } = require('@flashfusion/performance-monitor');

const config = {
  cloudProvider: { name: 'aws', region: 'us-east-1' },
  services: ['web', 'api'],
  alertThresholds: { responseTime: 1000, cpuUsage: 80 },
  reportingInterval: 60
};

const monitor = new MetricsCollector(config);
monitor.startCollection();

monitor.on('alert', (alert) => {
  console.log(`ALERT: ${alert.message}`);
});
```

### 2. Load Testing

```javascript
const { LoadTester } = require('@flashfusion/performance-monitor');

const tester = new LoadTester();

async function runTests() {
  const result = await tester.executeLoadTest({
    url: 'http://localhost:3000',
    connections: 50,
    duration: 60,
    method: 'GET'
  });
  
  console.log(`Average Response Time: ${result.latency.average}ms`);
  console.log(`Throughput: ${result.throughput.average} req/s`);
  console.log(`Error Rate: ${result.errorRate}%`);
}
```

### 3. Cost Monitoring

```javascript
const { CostMonitor } = require('@flashfusion/performance-monitor');

const costMonitor = new CostMonitor(config);
costMonitor.startMonitoring();

// Get cost breakdown
const breakdown = costMonitor.getCostBreakdownByService(24);
console.log('24h Cost Breakdown:', breakdown);

// Find underutilized resources
const underutilized = costMonitor.getUnderutilizedResources();
console.log('Optimization Opportunities:', underutilized);
```

### 4. Complete Integration

```javascript
const { 
  MetricsCollector, 
  CostMonitor, 
  CapacityForecaster, 
  OptimizationEngine 
} = require('@flashfusion/performance-monitor');

// Initialize all components
const metrics = new MetricsCollector(config);
const costs = new CostMonitor(config);
const forecaster = new CapacityForecaster();
const optimizer = new OptimizationEngine(metrics, costs, forecaster);

// Start monitoring
metrics.startCollection();
costs.startMonitoring();

// Get recommendations
const recommendations = optimizer.generateRecommendations();
console.log('Optimization Recommendations:', recommendations);
```

## CLI Usage Examples

```bash
# Start performance monitoring
npm run ff perf monitor --interval 60 --services web,api

# Run load tests
npm run ff perf test --url http://localhost:3000 --connections 50 --duration 60

# Monitor costs
npm run ff cost monitor --provider aws --region us-east-1

# Get cost breakdown
npm run ff cost breakdown --period 30

# View optimization recommendations
npm run ff optimize recommendations

# Start dashboard
npm run ff dashboard start --port 3001
```

## Dashboard Integration

The dashboard automatically displays:
- Real-time performance metrics
- Cost breakdowns and trends
- Optimization recommendations
- Interactive charts and alerts

Access at: `http://localhost:3001`
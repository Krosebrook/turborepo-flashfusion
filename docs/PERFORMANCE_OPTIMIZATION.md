# Performance & Cost Optimization System

## Overview

The FlashFusion Performance & Cost Optimization System is a comprehensive solution for monitoring application performance, tracking cloud costs, and providing intelligent optimization recommendations. It helps ensure your system scales efficiently while controlling infrastructure costs.

## 🏗️ Architecture

### Components

1. **@flashfusion/performance-monitor** - Core monitoring package
2. **@flashfusion/performance-dashboard** - Real-time dashboard application
3. **Enhanced CLI** - Command-line interface for monitoring and optimization

### Key Features

- ⚡ **Load Testing** - Automated performance testing with detailed metrics
- 📊 **Real-time Monitoring** - CPU, memory, network, and application metrics
- 💰 **Cost Tracking** - Multi-cloud cost monitoring and analysis
- 🔮 **Capacity Forecasting** - AI-powered capacity planning
- 🎯 **Optimization Engine** - Intelligent recommendations for cost and performance
- 📈 **Interactive Dashboard** - Visual insights and actionable recommendations

## 🚀 Quick Start

### 1. Start Performance Monitoring

```bash
# Start the performance dashboard
npm run ff dashboard start

# Start metrics collection
npm run ff perf monitor --interval 60 --services web,api

# Start cost monitoring
npm run ff cost monitor --provider aws --region us-east-1
```

### 2. Run Load Tests

```bash
# Test your application
npm run ff perf test --url http://localhost:3000 --connections 50 --duration 60

# Run multiple endpoint tests
npm run ff perf test --url http://localhost:3000/api/health
npm run ff perf test --url http://localhost:3000/api/users
```

### 3. Get Optimization Recommendations

```bash
# View all recommendations
npm run ff optimize recommendations

# Filter by type
npm run ff optimize recommendations --type autoscaling
npm run ff optimize recommendations --type rightsizing
```

## 📊 Dashboard

Access the performance dashboard at `http://localhost:3001` after starting it with:

```bash
npm run ff dashboard start
```

### Dashboard Features

- **Real-time Metrics**: CPU, memory, response times, throughput
- **Cost Visualization**: Service breakdown, trends, forecasts
- **Optimization Cards**: Prioritized recommendations with savings estimates
- **Interactive Charts**: Historical data and performance trends

## 🔧 API Usage

### Performance Monitor Package

```typescript
import { 
  LoadTester, 
  MetricsCollector, 
  CostMonitor, 
  CapacityForecaster,
  OptimizationEngine 
} from '@flashfusion/performance-monitor';

// Configuration
const config = {
  cloudProvider: { name: 'aws', region: 'us-east-1' },
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

// Initialize components
const metricsCollector = new MetricsCollector(config);
const costMonitor = new CostMonitor(config);
const capacityForecaster = new CapacityForecaster();
const loadTester = new LoadTester();

// Start monitoring
metricsCollector.startCollection();
costMonitor.startMonitoring();

// Run load test
const testConfig = {
  url: 'http://localhost:3000',
  connections: 10,
  duration: 30,
  method: 'GET'
};

const results = await loadTester.executeLoadTest(testConfig);
console.log('Load test results:', results);

// Get optimization recommendations
const optimizationEngine = new OptimizationEngine(
  metricsCollector, 
  costMonitor, 
  capacityForecaster
);
const recommendations = optimizationEngine.generateRecommendations();
```

### Load Testing

```typescript
const loadTester = new LoadTester();

// Single test
const result = await loadTester.executeLoadTest({
  url: 'http://localhost:3000/api/users',
  connections: 50,
  duration: 60,
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
});

// Multiple concurrent tests
const configs = [
  { url: 'http://localhost:3000/', connections: 10, duration: 30, method: 'GET' },
  { url: 'http://localhost:3000/api', connections: 5, duration: 30, method: 'GET' }
];

const results = await loadTester.executeConcurrentLoadTests(configs);
```

### Metrics Collection

```typescript
const metricsCollector = new MetricsCollector(config);

// Start collection
metricsCollector.startCollection();

// Listen for alerts
metricsCollector.on('alert', (alert) => {
  console.log(`Alert: ${alert.type} - ${alert.message}`);
});

// Get current metrics
const currentMetrics = await metricsCollector.collectSystemMetrics();

// Get historical data
const last24Hours = metricsCollector.getMetrics(24);
const averages = metricsCollector.getAverageMetrics(1);
```

### Cost Monitoring

```typescript
const costMonitor = new CostMonitor(config);

costMonitor.startMonitoring();

// Get cost data
const totalCost = costMonitor.getTotalCost(undefined, 24);
const breakdown = costMonitor.getCostBreakdownByService(24);
const underutilized = costMonitor.getUnderutilizedResources();

// Cost forecasting
const predictedCost = costMonitor.predictCost(30); // 30 days
```

### Capacity Forecasting

```typescript
const forecaster = new CapacityForecaster();

// Add historical data
forecaster.addPerformanceMetrics(performanceData);
forecaster.addCostMetrics(costData);

// Get forecasts
const webServiceForecast = forecaster.forecastCapacity('web-service', 24);
const multiServiceForecasts = forecaster.forecastMultipleServices(['web', 'api'], 24);

// Predict utilization patterns
const utilizationPattern = forecaster.predictUtilizationPattern(24);

// Detect anomalies
const anomalies = forecaster.detectAnomalies();
```

## 📈 Optimization Recommendations

The system generates four types of optimization recommendations:

### 1. Autoscaling
- **High Priority**: Scale up when CPU > 80%
- **Medium Priority**: Scale down when utilization < 20%
- **Estimated Savings**: 15-30% cost reduction

### 2. Instance Rightsizing
- **Identify**: Underutilized resources (< 30% usage)
- **Recommend**: Smaller instance types
- **Estimated Savings**: 30-60% cost reduction

### 3. Reserved Instances
- **Target**: Consistent workloads > $100/month
- **Recommend**: 1-3 year commitments
- **Estimated Savings**: 30-75% cost reduction

### 4. Cost Optimization
- **Storage**: Lifecycle policies and tiering
- **Networking**: CDN and traffic optimization
- **Monitoring**: Alert thresholds and budget controls

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run performance monitor tests specifically
cd packages/performance-monitor && npm test

# Run with coverage
npm run test -- --coverage
```

### Test Coverage

The test suite covers:
- Load testing functionality
- Metrics collection accuracy
- Cost monitoring calculations
- Capacity forecasting algorithms
- Optimization recommendation logic

## 📊 Metrics & KPIs

### Performance Metrics
- **Response Time**: Average, P50, P75, P90, P95, P99
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Resource Usage**: CPU, Memory, Network, Disk I/O

### Cost Metrics
- **Monthly Spend**: Total cloud costs
- **Service Breakdown**: Cost by service type
- **Utilization**: Resource efficiency percentages
- **Forecasts**: Predicted future costs

### Optimization KPIs
- **Potential Savings**: Dollar amount and percentage
- **Implementation Effort**: Low, Medium, High
- **Risk Level**: Impact assessment
- **Priority**: High, Medium, Low

## 🔧 Configuration

### Environment Variables

```bash
# Cloud Provider Configuration
CLOUD_PROVIDER=aws
CLOUD_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Monitoring Configuration
MONITORING_INTERVAL=60
ALERT_RESPONSE_TIME_MS=1000
ALERT_ERROR_RATE_PERCENT=5
ALERT_CPU_USAGE_PERCENT=80
ALERT_MEMORY_USAGE_PERCENT=85
ALERT_COST_THRESHOLD=1000

# Dashboard Configuration
DASHBOARD_PORT=3001
DASHBOARD_REFRESH_INTERVAL=30000
```

### Configuration File

Create `performance-config.json`:

```json
{
  "cloudProvider": {
    "name": "aws",
    "region": "us-east-1",
    "credentials": {
      "accessKeyId": "your_key",
      "secretAccessKey": "your_secret"
    }
  },
  "services": ["web", "api", "database"],
  "alertThresholds": {
    "responseTime": 1000,
    "errorRate": 5,
    "cpuUsage": 80,
    "memoryUsage": 85,
    "cost": 1000
  },
  "reportingInterval": 60,
  "retentionPeriod": 86400,
  "loadTesting": {
    "defaultConnections": 10,
    "defaultDuration": 30,
    "maxConcurrentTests": 5
  }
}
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export CLOUD_PROVIDER=aws
   export MONITORING_INTERVAL=300
   ```

2. **Build Applications**
   ```bash
   npm run build
   ```

3. **Start Services**
   ```bash
   # Start dashboard
   cd apps/performance-dashboard && npm start

   # Start monitoring (background process)
   node -e "
   const { MetricsCollector, CostMonitor } = require('@flashfusion/performance-monitor');
   const config = require('./performance-config.json');
   const metrics = new MetricsCollector(config);
   const cost = new CostMonitor(config);
   metrics.startCollection();
   cost.startMonitoring();
   "
   ```

### Docker Deployment

```dockerfile
# Dockerfile.performance-dashboard
FROM node:18-alpine
WORKDIR /app
COPY apps/performance-dashboard/package*.json ./
RUN npm ci --only=production
COPY apps/performance-dashboard .
EXPOSE 3001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  performance-dashboard:
    build:
      context: .
      dockerfile: Dockerfile.performance-dashboard
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - CLOUD_PROVIDER=aws
    volumes:
      - ./performance-config.json:/app/config.json
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear cache and reinstall
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   npm run type-check
   
   # Fix autocannon types
   npm install --save-dev @types/autocannon
   ```

3. **Dashboard Not Loading**
   ```bash
   # Check if port is available
   lsof -i :3001
   
   # Start with different port
   npm run ff dashboard start --port 3002
   ```

4. **Monitoring Not Working**
   ```bash
   # Check configuration
   npm run ff status
   
   # Verify cloud credentials
   aws sts get-caller-identity  # For AWS
   ```

### Debug Mode

Enable debug logging:

```bash
export DEBUG=performance-monitor:*
npm run ff perf monitor
```

## 📚 Additional Resources

### CLI Commands Reference

```bash
# Performance Commands
npm run ff perf monitor              # Start monitoring
npm run ff perf test                 # Run load test
npm run ff perf report               # Generate report

# Cost Commands  
npm run ff cost monitor              # Start cost monitoring
npm run ff cost breakdown            # Show cost breakdown
npm run ff cost forecast             # Cost forecast

# Optimization Commands
npm run ff optimize recommendations  # Get recommendations
npm run ff optimize --type autoscaling   # Specific recommendations

# Dashboard Commands
npm run ff dashboard start           # Start dashboard
npm run ff dashboard status          # Check status

# System Commands
npm run ff status                    # Overall system status
```

### Integration Examples

- [AWS CloudWatch Integration](./examples/aws-integration.md)
- [Azure Monitor Integration](./examples/azure-integration.md)
- [Google Cloud Monitoring](./examples/gcp-integration.md)
- [Kubernetes Integration](./examples/k8s-integration.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/optimization-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
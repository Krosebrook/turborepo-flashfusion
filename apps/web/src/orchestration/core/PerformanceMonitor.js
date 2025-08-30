// =====================================================
// PERFORMANCE MONITOR - FlashFusion Integration
// Monitors system performance and provides analytics
// =====================================================

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alerts = new Map();
        this.metricsPath = path.join(__dirname, '..', 'data', 'metrics');
        this.thresholds = this.initializeThresholds();
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    initializeThresholds() {
        return {
            responseTime: {
                warning: 2000, // 2 seconds
                critical: 5000 // 5 seconds
            },
            memoryUsage: {
                warning: 80, // 80% of available memory
                critical: 95 // 95% of available memory
            },
            errorRate: {
                warning: 5, // 5% error rate
                critical: 15 // 15% error rate
            },
            concurrentAgents: {
                warning: 8, // 8 concurrent agents
                critical: 12 // 12 concurrent agents
            },
            handoffTimeout: {
                warning: 180000, // 3 minutes
                critical: 300000 // 5 minutes
            }
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.metricsPath, { recursive: true });
            await this.startMonitoring();
            console.log('📊 Performance Monitor initialized');
        } catch (error) {
            console.error('Performance Monitor initialization failed:', error);
            throw error;
        }
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;

        // Monitor system metrics every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.collectSystemMetrics();
        }, 30000);

        console.log('📈 Performance monitoring started');
    }

    async stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('📈 Performance monitoring stopped');
    }

    async recordMetric(metricName, value, metadata = {}) {
        const timestamp = Date.now();
        const metricKey = `${metricName}_${timestamp}`;

        const metric = {
            name: metricName,
            value,
            metadata,
            timestamp
        };

        this.metrics.set(metricKey, metric);

        // Check for alerts
        await this.checkThresholds(metricName, value, metadata);

        // Persist critical metrics
        if (this.isCriticalMetric(metricName)) {
            await this.persistMetric(metric);
        }

        // Emit metric event
        this.emit('metric:recorded', metric);

        // Keep only last 1000 metrics in memory
        if (this.metrics.size > 1000) {
            const oldestKey = Array.from(this.metrics.keys())[0];
            this.metrics.delete(oldestKey);
        }
    }

    async collectSystemMetrics() {
        try {
            // Memory usage
            const memoryUsage = process.memoryUsage();
            await this.recordMetric('memory_heap_used', memoryUsage.heapUsed);
            await this.recordMetric('memory_heap_total', memoryUsage.heapTotal);
            await this.recordMetric('memory_rss', memoryUsage.rss);

            // CPU usage (simplified - would need more sophisticated monitoring in production)
            const cpuUsage = process.cpuUsage();
            await this.recordMetric('cpu_user', cpuUsage.user);
            await this.recordMetric('cpu_system', cpuUsage.system);

            // Event loop lag (simplified)
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
                this.recordMetric('event_loop_lag', lag);
            });

            // Uptime
            await this.recordMetric('uptime', process.uptime());
        } catch (error) {
            console.error('Error collecting system metrics:', error);
        }
    }

    async checkThresholds(metricName, value, metadata) {
        const threshold = this.thresholds[metricName];
        if (!threshold) {
            return;
        }

        let alertLevel = null;

        if (value >= threshold.critical) {
            alertLevel = 'critical';
        } else if (value >= threshold.warning) {
            alertLevel = 'warning';
        }

        if (alertLevel) {
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                metric: metricName,
                value,
                threshold: threshold[alertLevel],
                level: alertLevel,
                metadata,
                timestamp: Date.now(),
                status: 'active'
            };

            this.alerts.set(alert.id, alert);
            this.emit('alert:triggered', alert);

            console.warn(
                `🚨 ${alertLevel.toUpperCase()} Alert: ${metricName} = ${value} (threshold: ${
                    threshold[alertLevel]
                })`
            );
        }
    }

    isCriticalMetric(metricName) {
        const criticalMetrics = [
            'agent_error',
            'handoff_timeout',
            'ai_service_failure',
            'system_error',
            'memory_heap_used',
            'response_time'
        ];

        return criticalMetrics.includes(metricName);
    }

    async recordAgentPerformance(agentRole, operation, duration, success = true) {
        await this.recordMetric('agent_performance', duration, {
            agent: agentRole,
            operation,
            success,
            category: 'agent'
        });

        if (!success) {
            await this.recordMetric('agent_error', 1, {
                agent: agentRole,
                operation,
                category: 'error'
            });
        }
    }

    async recordHandoffPerformance(fromAgent, toAgent, duration, success = true) {
        await this.recordMetric('handoff_performance', duration, {
            from: fromAgent,
            to: toAgent,
            success,
            category: 'handoff'
        });

        if (!success) {
            await this.recordMetric('handoff_failure', 1, {
                from: fromAgent,
                to: toAgent,
                category: 'error'
            });
        }
    }

    async recordAIServicePerformance(
        provider,
        model,
        tokens,
        duration,
        success = true
    ) {
        await this.recordMetric('ai_service_performance', duration, {
            provider,
            model,
            tokens,
            success,
            category: 'ai'
        });

        await this.recordMetric('ai_token_usage', tokens, {
            provider,
            model,
            category: 'usage'
        });

        if (!success) {
            await this.recordMetric('ai_service_failure', 1, {
                provider,
                model,
                category: 'error'
            });
        }
    }

    async getMetrics(metricName, timeRange = 3600000) {
    // Default 1 hour
        const now = Date.now();
        const cutoff = now - timeRange;

        const filtered = Array.from(this.metrics.values())
            .filter(
                (metric) => metric.name === metricName && metric.timestamp >= cutoff
            )
            .sort((a, b) => a.timestamp - b.timestamp);

        return filtered;
    }

    async getAggregatedMetrics(metricName, timeRange = 3600000) {
        const metrics = await this.getMetrics(metricName, timeRange);

        if (metrics.length === 0) {
            return {
                count: 0,
                avg: 0,
                min: 0,
                max: 0,
                latest: null
            };
        }

        const values = metrics.map((m) => m.value);

        return {
            count: metrics.length,
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            latest: metrics[metrics.length - 1].value,
            trend: this.calculateTrend(values)
        };
    }

    calculateTrend(values) {
        if (values.length < 2) {
            return 'stable';
        }

        const recent = values.slice(-Math.min(5, values.length));
        const older = values.slice(0, Math.max(1, values.length - 5));

        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 10) {
            return 'increasing';
        }
        if (change < -10) {
            return 'decreasing';
        }
        return 'stable';
    }

    async getDashboardData() {
        const now = Date.now();
        const hour = 3600000;

        const dashboard = {
            system: {
                uptime: process.uptime(),
                memory: await this.getAggregatedMetrics('memory_heap_used', hour),
                cpu: await this.getAggregatedMetrics('cpu_user', hour),
                eventLoopLag: await this.getAggregatedMetrics('event_loop_lag', hour)
            },
            agents: {
                performance: await this.getAggregatedMetrics('agent_performance', hour),
                errors: await this.getAggregatedMetrics('agent_error', hour)
            },
            handoffs: {
                performance: await this.getAggregatedMetrics(
                    'handoff_performance',
                    hour
                ),
                failures: await this.getAggregatedMetrics('handoff_failure', hour)
            },
            ai: {
                performance: await this.getAggregatedMetrics(
                    'ai_service_performance',
                    hour
                ),
                tokenUsage: await this.getAggregatedMetrics('ai_token_usage', hour),
                failures: await this.getAggregatedMetrics('ai_service_failure', hour)
            },
            alerts: {
                active: Array.from(this.alerts.values()).filter(
                    (alert) => alert.status === 'active'
                ),
                recent: Array.from(this.alerts.values())
                    .filter((alert) => now - alert.timestamp < hour)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
            },
            timestamp: now
        };

        return dashboard;
    }

    async getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter((alert) => alert.status === 'active')
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    async acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.status = 'acknowledged';
            alert.acknowledgedAt = Date.now();
            this.emit('alert:acknowledged', alert);
            return alert;
        }
        return null;
    }

    async resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedAt = Date.now();
            this.emit('alert:resolved', alert);
            return alert;
        }
        return null;
    }

    async persistMetric(metric) {
        try {
            const date = new Date(metric.timestamp).toISOString().split('T')[0];
            const filePath = path.join(this.metricsPath, `metrics_${date}.json`);

            let existingMetrics = [];
            try {
                const data = await fs.readFile(filePath, 'utf8');
                existingMetrics = JSON.parse(data);
            } catch (error) {
                // File doesn't exist, start with empty array
            }

            existingMetrics.push(metric);
            await fs.writeFile(filePath, JSON.stringify(existingMetrics, null, 2));
        } catch (error) {
            console.error('Failed to persist metric:', error);
        }
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            metricsCount: this.metrics.size,
            activeAlerts: Array.from(this.alerts.values()).filter(
                (a) => a.status === 'active'
            ).length,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }
}

module.exports = PerformanceMonitor;
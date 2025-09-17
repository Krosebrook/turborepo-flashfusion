#!/usr/bin/env node

/**
 * API Stress Tester - Concurrent Load and DOS Testing
 * 
 * This tool performs stress testing and DOS attack simulations to test
 * system resilience under extreme load conditions.
 */

const http = require('http');
const https = require('https');
const cluster = require('cluster');
const os = require('os');
const fs = require('fs');

class APIStressTester {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.concurrency = options.concurrency || 100;
        this.duration = options.duration || 60; // seconds
        this.requestsPerSecond = options.requestsPerSecond || 100;
        this.payloadSize = options.payloadSize || 1024; // bytes
        this.logFile = options.logFile || '/tmp/stress-test-results.log';
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            timeouts: 0,
            errors: {},
            responseTimes: [],
            startTime: null,
            endTime: null
        };
        
        this.endpoints = [
            '/api/health',
            '/api/status',
            '/api/agents/chat',
            '/api/zapier/incoming-webhook',
            '/'
        ];
    }
    
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    generatePayload(size) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < size; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            this.stats.totalRequests++;
            
            const url = new URL(endpoint, this.baseUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'POST',
                headers: {
                    'User-Agent': 'StressTester/1.0',
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    ...options.headers
                },
                timeout: 10000
            };
            
            const req = protocol.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    this.stats.responseTimes.push(responseTime);
                    
                    if (res.statusCode < 400) {
                        this.stats.successfulRequests++;
                    } else {
                        this.stats.failedRequests++;
                        const statusKey = `status_${res.statusCode}`;
                        this.stats.errors[statusKey] = (this.stats.errors[statusKey] || 0) + 1;
                    }
                    
                    resolve({
                        statusCode: res.statusCode,
                        responseTime,
                        body: data
                    });
                });
            });
            
            req.on('error', (error) => {
                this.stats.failedRequests++;
                const errorKey = error.code || 'unknown_error';
                this.stats.errors[errorKey] = (this.stats.errors[errorKey] || 0) + 1;
                
                resolve({
                    error: error.message,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('timeout', () => {
                this.stats.timeouts++;
                req.destroy();
                resolve({
                    error: 'Request timeout',
                    responseTime: 10000
                });
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
    
    async connectionFloodTest() {
        this.log('🌊 Starting Connection Flood Test...', 'INFO');
        
        const connections = [];
        const endpoint = '/api/agents/chat';
        
        // Create many concurrent connections
        for (let i = 0; i < this.concurrency; i++) {
            connections.push(
                this.makeRequest(endpoint, {
                    method: 'POST',
                    body: JSON.stringify({
                        taskType: 'test',
                        input: this.generatePayload(this.payloadSize),
                        userId: `stress_test_${i}`
                    })
                })
            );
        }
        
        const results = await Promise.all(connections);
        const failures = results.filter(r => r.error || r.statusCode >= 500).length;
        
        this.log(`Connection flood: ${failures}/${this.concurrency} requests failed`, 'INFO');
        
        return { total: this.concurrency, failures };
    }
    
    async slowlorisAttack() {
        this.log('🐌 Starting Slowloris Attack Simulation...', 'INFO');
        
        const slowConnections = [];
        
        for (let i = 0; i < 50; i++) {
            slowConnections.push(new Promise((resolve) => {
                const url = new URL('/api/agents/chat', this.baseUrl);
                const protocol = url.protocol === 'https:' ? https : http;
                
                const req = protocol.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Transfer-Encoding': 'chunked'
                    }
                });
                
                // Send partial headers to keep connection open
                req.write('{"');
                
                setTimeout(() => {
                    req.write('input":"');
                }, 5000);
                
                setTimeout(() => {
                    req.write('test"}');
                    req.end();
                    resolve();
                }, 10000);
                
                req.on('error', () => resolve());
            }));
        }
        
        await Promise.all(slowConnections);
        this.log('Slowloris attack completed', 'INFO');
    }
    
    async largePayloadTest() {
        this.log('💣 Starting Large Payload Test...', 'INFO');
        
        const payloadSizes = [1024, 10240, 102400, 1048576, 10485760]; // 1KB to 10MB
        const results = [];
        
        for (const size of payloadSizes) {
            this.log(`Testing payload size: ${size} bytes`, 'INFO');
            
            const result = await this.makeRequest('/api/agents/chat', {
                method: 'POST',
                body: JSON.stringify({
                    taskType: 'test',
                    input: this.generatePayload(size),
                    userId: 'large_payload_test'
                })
            });
            
            results.push({
                size,
                success: !result.error && result.statusCode < 400,
                responseTime: result.responseTime,
                statusCode: result.statusCode
            });
        }
        
        return results;
    }
    
    async rapidFireTest() {
        this.log('🔥 Starting Rapid Fire Test...', 'INFO');
        
        const startTime = Date.now();
        const endTime = startTime + (this.duration * 1000);
        let requestCount = 0;
        
        while (Date.now() < endTime) {
            const batchPromises = [];
            
            // Send a batch of requests
            for (let i = 0; i < 10; i++) {
                batchPromises.push(
                    this.makeRequest('/api/status', {
                        method: 'GET'
                    })
                );
                requestCount++;
            }
            
            await Promise.all(batchPromises);
            
            // Small delay to control rate
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.log(`Rapid fire test: Sent ${requestCount} requests in ${this.duration}s`, 'INFO');
        return requestCount;
    }
    
    async memoryExhaustionTest() {
        this.log('🧠 Starting Memory Exhaustion Test...', 'INFO');
        
        const largeObjects = [];
        
        // Create requests with deeply nested objects
        for (let i = 0; i < 10; i++) {
            let deepObject = {};
            let current = deepObject;
            
            // Create deeply nested structure
            for (let j = 0; j < 1000; j++) {
                current.nested = { data: this.generatePayload(100) };
                current = current.nested;
            }
            
            largeObjects.push(
                this.makeRequest('/api/agents/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                        taskType: 'memory_test',
                        input: 'Testing memory exhaustion',
                        data: deepObject
                    })
                })
            );
        }
        
        const results = await Promise.all(largeObjects);
        const failures = results.filter(r => r.error || r.statusCode >= 500).length;
        
        this.log(`Memory exhaustion test: ${failures}/10 requests failed`, 'INFO');
        return { total: 10, failures };
    }
    
    async pathTraversalStress() {
        this.log('📁 Starting Path Traversal Stress Test...', 'INFO');
        
        const traversalPaths = [
            '../'.repeat(100) + 'etc/passwd',
            '../'.repeat(1000) + 'etc/passwd',
            'A'.repeat(10000) + '/../etc/passwd',
            '%2e%2e%2f'.repeat(500) + 'etc/passwd'
        ];
        
        const requests = [];
        
        for (const path of traversalPaths) {
            for (const endpoint of this.endpoints) {
                requests.push(
                    this.makeRequest(`${endpoint}/${path}`),
                    this.makeRequest(`${endpoint}?file=${encodeURIComponent(path)}`)
                );
            }
        }
        
        const results = await Promise.all(requests);
        const vulnerabilities = results.filter(r => 
            r.body && (r.body.includes('root:') || r.body.includes('passwd'))
        ).length;
        
        this.log(`Path traversal stress: Found ${vulnerabilities} potential vulnerabilities`, 'INFO');
        return vulnerabilities;
    }
    
    calculateStatistics() {
        const responseTimes = this.stats.responseTimes;
        responseTimes.sort((a, b) => a - b);
        
        const totalTime = this.stats.endTime - this.stats.startTime;
        const throughput = this.stats.totalRequests / (totalTime / 1000);
        
        return {
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            timeouts: this.stats.timeouts,
            throughput: Math.round(throughput * 100) / 100,
            averageResponseTime: responseTimes.length > 0 ? 
                Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
            minResponseTime: responseTimes[0] || 0,
            maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
            p50ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
            p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
            p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
            errors: this.stats.errors
        };
    }
    
    async runAllTests() {
        this.log('🚀 Starting API Stress Testing Suite', 'INFO');
        this.log(`Target: ${this.baseUrl}`, 'INFO');
        this.log(`Concurrency: ${this.concurrency}`, 'INFO');
        this.log(`Duration: ${this.duration}s`, 'INFO');
        
        this.stats.startTime = Date.now();
        
        try {
            await this.connectionFloodTest();
            await this.slowlorisAttack();
            const largePayloadResults = await this.largePayloadTest();
            const rapidFireCount = await this.rapidFireTest();
            const memoryResults = await this.memoryExhaustionTest();
            const pathTraversalVulns = await this.pathTraversalStress();
            
            this.stats.endTime = Date.now();
            
            const statistics = this.calculateStatistics();
            
            // Generate report
            const report = {
                testConfiguration: {
                    target: this.baseUrl,
                    concurrency: this.concurrency,
                    duration: this.duration,
                    payloadSize: this.payloadSize
                },
                testResults: {
                    largePayloadResults,
                    rapidFireCount,
                    memoryExhaustionFailures: memoryResults.failures,
                    pathTraversalVulnerabilities: pathTraversalVulns
                },
                statistics,
                timestamp: new Date().toISOString()
            };
            
            // Save report
            const reportFile = '/tmp/stress-test-report.json';
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            // Log summary
            this.log('', 'INFO');
            this.log('🔍 STRESS TEST RESULTS', 'INFO');
            this.log('====================', 'INFO');
            this.log(`Total Requests: ${statistics.totalRequests}`, 'INFO');
            this.log(`Successful: ${statistics.successfulRequests}`, 'INFO');
            this.log(`Failed: ${statistics.failedRequests}`, 'INFO');
            this.log(`Timeouts: ${statistics.timeouts}`, 'INFO');
            this.log(`Throughput: ${statistics.throughput} req/s`, 'INFO');
            this.log(`Avg Response Time: ${statistics.averageResponseTime}ms`, 'INFO');
            this.log(`P95 Response Time: ${statistics.p95ResponseTime}ms`, 'INFO');
            this.log(`P99 Response Time: ${statistics.p99ResponseTime}ms`, 'INFO');
            this.log('', 'INFO');
            this.log(`Memory Exhaustion Failures: ${memoryResults.failures}/10`, 'INFO');
            this.log(`Path Traversal Vulnerabilities: ${pathTraversalVulns}`, 'INFO');
            this.log('', 'INFO');
            this.log(`Full report saved to: ${reportFile}`, 'INFO');
            
        } catch (error) {
            this.log(`Fatal error during stress testing: ${error.message}`, 'CRITICAL');
        }
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        options[key] = isNaN(value) ? value : parseInt(value);
    }
    
    if (!options.baseUrl) {
        options.baseUrl = process.env.TARGET_URL || 'http://localhost:3000';
    }
    
    const tester = new APIStressTester(options);
    tester.runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = APIStressTester;
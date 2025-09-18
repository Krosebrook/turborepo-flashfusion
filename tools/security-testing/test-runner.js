#!/usr/bin/env node

/**
 * Security Chaos Agent - Master Test Runner
 * 
 * Orchestrates all security testing tools and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SecurityTestRunner {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || process.env.TARGET_URL || 'http://localhost:3000';
        this.outputDir = options.outputDir || '/tmp/security-testing-results';
        this.includeStress = options.includeStress !== false;
        this.includeVulnScan = options.includeVulnScan !== false;
        this.includeFuzzing = options.includeFuzzing !== false;
        
        this.results = {
            startTime: new Date(),
            endTime: null,
            tests: [],
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                vulnerabilities: 0,
                crashes: 0,
                errors: 0
            }
        };
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        
        console.log(logEntry);
        
        const logFile = path.join(this.outputDir, 'master-test-run.log');
        try {
            fs.appendFileSync(logFile, logEntry + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    async runCommand(command, args, options = {}) {
        return new Promise((resolve) => {
            this.log(`Running: ${command} ${args.join(' ')}`, 'INFO');
            
            const child = spawn(command, args, {
                stdio: options.captureOutput ? 'pipe' : 'inherit',
                env: { ...process.env, TARGET_URL: this.baseUrl },
                ...options
            });
            
            let stdout = '';
            let stderr = '';
            
            if (options.captureOutput) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            
            child.on('close', (code) => {
                resolve({
                    exitCode: code,
                    stdout,
                    stderr
                });
            });
            
            child.on('error', (error) => {
                this.log(`Command failed: ${error.message}`, 'ERROR');
                resolve({
                    exitCode: 1,
                    error: error.message,
                    stdout,
                    stderr
                });
            });
        });
    }
    
    async runSecurityChaosAgent() {
        this.log('🚀 Starting Security Chaos Agent (Fuzz Testing)...', 'INFO');
        
        const testResult = {
            name: 'Security Chaos Agent',
            type: 'fuzz_testing',
            startTime: new Date()
        };
        
        try {
            const result = await this.runCommand('node', [
                path.join(__dirname, 'security-chaos-agent.js'),
                '--baseUrl', this.baseUrl,
                '--logFile', path.join(this.outputDir, 'fuzz-test.log'),
                '--resultsFile', path.join(this.outputDir, 'fuzz-test-results.json')
            ], { captureOutput: true });
            
            testResult.endTime = new Date();
            testResult.exitCode = result.exitCode;
            testResult.duration = testResult.endTime - testResult.startTime;
            
            if (result.exitCode === 0) {
                testResult.status = 'passed';
                this.results.summary.passedTests++;
                
                // Parse results if available
                try {
                    const resultsFile = path.join(this.outputDir, 'fuzz-test-results.json');
                    if (fs.existsSync(resultsFile)) {
                        const fuzzResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                        testResult.vulnerabilities = fuzzResults.vulnerabilities?.length || 0;
                        testResult.crashes = fuzzResults.summary?.crashes || 0;
                        testResult.errors = fuzzResults.summary?.errors || 0;
                        
                        this.results.summary.vulnerabilities += testResult.vulnerabilities;
                        this.results.summary.crashes += testResult.crashes;
                        this.results.summary.errors += testResult.errors;
                    }
                } catch (parseError) {
                    this.log(`Failed to parse fuzz test results: ${parseError.message}`, 'WARN');
                }
            } else {
                testResult.status = 'failed';
                testResult.error = result.stderr || result.error || 'Unknown error';
                this.results.summary.failedTests++;
            }
            
        } catch (error) {
            testResult.endTime = new Date();
            testResult.status = 'failed';
            testResult.error = error.message;
            this.results.summary.failedTests++;
        }
        
        this.results.tests.push(testResult);
        this.results.summary.totalTests++;
        
        this.log(`Security Chaos Agent completed: ${testResult.status}`, 'INFO');
    }
    
    async runStressTester() {
        this.log('💪 Starting API Stress Tester...', 'INFO');
        
        const testResult = {
            name: 'API Stress Tester',
            type: 'stress_testing',
            startTime: new Date()
        };
        
        try {
            const result = await this.runCommand('node', [
                path.join(__dirname, 'stress-tester.js'),
                '--baseUrl', this.baseUrl,
                '--concurrency', '50',
                '--duration', '30',
                '--logFile', path.join(this.outputDir, 'stress-test.log')
            ], { captureOutput: true });
            
            testResult.endTime = new Date();
            testResult.exitCode = result.exitCode;
            testResult.duration = testResult.endTime - testResult.startTime;
            
            if (result.exitCode === 0) {
                testResult.status = 'passed';
                this.results.summary.passedTests++;
                
                // Parse stress test results
                try {
                    const resultsFile = '/tmp/stress-test-report.json';
                    if (fs.existsSync(resultsFile)) {
                        const stressResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                        testResult.totalRequests = stressResults.statistics?.totalRequests || 0;
                        testResult.failedRequests = stressResults.statistics?.failedRequests || 0;
                        testResult.throughput = stressResults.statistics?.throughput || 0;
                        testResult.averageResponseTime = stressResults.statistics?.averageResponseTime || 0;
                        
                        this.results.summary.errors += testResult.failedRequests;
                    }
                } catch (parseError) {
                    this.log(`Failed to parse stress test results: ${parseError.message}`, 'WARN');
                }
            } else {
                testResult.status = 'failed';
                testResult.error = result.stderr || result.error || 'Unknown error';
                this.results.summary.failedTests++;
            }
            
        } catch (error) {
            testResult.endTime = new Date();
            testResult.status = 'failed';
            testResult.error = error.message;
            this.results.summary.failedTests++;
        }
        
        this.results.tests.push(testResult);
        this.results.summary.totalTests++;
        
        this.log(`API Stress Tester completed: ${testResult.status}`, 'INFO');
    }
    
    async runVulnerabilityScanner() {
        this.log('🔍 Starting Vulnerability Scanner...', 'INFO');
        
        const testResult = {
            name: 'Vulnerability Scanner',
            type: 'vulnerability_scanning',
            startTime: new Date()
        };
        
        try {
            const result = await this.runCommand('node', [
                path.join(__dirname, 'vulnerability-scanner.js'),
                '--baseUrl', this.baseUrl,
                '--logFile', path.join(this.outputDir, 'vulnerability-scan.log'),
                '--resultsFile', path.join(this.outputDir, 'vulnerability-scan-results.json')
            ], { captureOutput: true });
            
            testResult.endTime = new Date();
            testResult.exitCode = result.exitCode;
            testResult.duration = testResult.endTime - testResult.startTime;
            
            if (result.exitCode === 0) {
                testResult.status = 'passed';
                this.results.summary.passedTests++;
                
                // Parse vulnerability scan results
                try {
                    const resultsFile = path.join(this.outputDir, 'vulnerability-scan-results.json');
                    if (fs.existsSync(resultsFile)) {
                        const vulnResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                        testResult.vulnerabilities = vulnResults.vulnerabilities?.length || 0;
                        testResult.criticalVulns = vulnResults.severityBreakdown?.critical || 0;
                        testResult.highVulns = vulnResults.severityBreakdown?.high || 0;
                        testResult.mediumVulns = vulnResults.severityBreakdown?.medium || 0;
                        testResult.lowVulns = vulnResults.severityBreakdown?.low || 0;
                        
                        this.results.summary.vulnerabilities += testResult.vulnerabilities;
                    }
                } catch (parseError) {
                    this.log(`Failed to parse vulnerability scan results: ${parseError.message}`, 'WARN');
                }
            } else {
                testResult.status = 'failed';
                testResult.error = result.stderr || result.error || 'Unknown error';
                this.results.summary.failedTests++;
            }
            
        } catch (error) {
            testResult.endTime = new Date();
            testResult.status = 'failed';
            testResult.error = error.message;
            this.results.summary.failedTests++;
        }
        
        this.results.tests.push(testResult);
        this.results.summary.totalTests++;
        
        this.log(`Vulnerability Scanner completed: ${testResult.status}`, 'INFO');
    }
    
    async checkTargetAvailability() {
        this.log(`🌐 Checking target availability: ${this.baseUrl}`, 'INFO');
        
        try {
            const http = require('http');
            const https = require('https');
            const { URL } = require('url');
            
            const url = new URL(this.baseUrl);
            const protocol = url.protocol === 'https:' ? https : http;
            
            return new Promise((resolve) => {
                const req = protocol.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: '/health',
                    method: 'GET',
                    timeout: 10000
                }, (res) => {
                    this.log(`Target is available - Status: ${res.statusCode}`, 'INFO');
                    resolve(true);
                });
                
                req.on('error', (error) => {
                    this.log(`Target is not available: ${error.message}`, 'WARN');
                    resolve(false);
                });
                
                req.on('timeout', () => {
                    this.log('Target check timed out', 'WARN');
                    req.destroy();
                    resolve(false);
                });
                
                req.end();
            });
        } catch (error) {
            this.log(`Error checking target: ${error.message}`, 'ERROR');
            return false;
        }
    }
    
    generateMasterReport() {
        this.results.endTime = new Date();
        const totalDuration = this.results.endTime - this.results.startTime;
        
        const report = {
            testRun: {
                target: this.baseUrl,
                startTime: this.results.startTime.toISOString(),
                endTime: this.results.endTime.toISOString(),
                duration: `${Math.round(totalDuration / 1000)}s`,
                outputDirectory: this.outputDir
            },
            summary: this.results.summary,
            testResults: this.results.tests,
            recommendations: this.generateRecommendations()
        };
        
        // Save master report
        const reportFile = path.join(this.outputDir, 'master-security-report.json');
        try {
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            this.log(`Master report saved to: ${reportFile}`, 'INFO');
        } catch (error) {
            this.log(`Failed to save master report: ${error.message}`, 'ERROR');
        }
        
        // Generate HTML report
        this.generateHtmlReport(report);
        
        // Log summary
        this.log('', 'INFO');
        this.log('🎯 SECURITY CHAOS AGENT - FINAL RESULTS', 'INFO');
        this.log('=======================================', 'INFO');
        this.log(`Target: ${this.baseUrl}`, 'INFO');
        this.log(`Total Duration: ${report.testRun.duration}`, 'INFO');
        this.log(`Tests Run: ${report.summary.totalTests}`, 'INFO');
        this.log(`Passed: ${report.summary.passedTests}`, 'INFO');
        this.log(`Failed: ${report.summary.failedTests}`, 'INFO');
        this.log(`Vulnerabilities Found: ${report.summary.vulnerabilities}`, 'INFO');
        this.log(`Crashes Detected: ${report.summary.crashes}`, 'INFO');
        this.log(`Errors Encountered: ${report.summary.errors}`, 'INFO');
        this.log('', 'INFO');
        
        // Test-specific results
        report.testResults.forEach(test => {
            this.log(`${test.name}: ${test.status.toUpperCase()}`, 'INFO');
            if (test.vulnerabilities) {
                this.log(`  Vulnerabilities: ${test.vulnerabilities}`, 'INFO');
            }
            if (test.crashes) {
                this.log(`  Crashes: ${test.crashes}`, 'INFO');
            }
            if (test.totalRequests) {
                this.log(`  Requests: ${test.totalRequests} (${test.failedRequests} failed)`, 'INFO');
            }
        });
        
        this.log('', 'INFO');
        this.log(`📁 All results saved to: ${this.outputDir}`, 'INFO');
        this.log(`📊 HTML report: ${path.join(this.outputDir, 'security-report.html')}`, 'INFO');
        
        return report;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.summary.vulnerabilities > 0) {
            recommendations.push({
                priority: 'high',
                category: 'vulnerabilities',
                description: `${this.results.summary.vulnerabilities} vulnerabilities detected. Review and patch immediately.`,
                action: 'Review vulnerability scan results and implement fixes'
            });
        }
        
        if (this.results.summary.crashes > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'stability',
                description: `${this.results.summary.crashes} crashes detected. System may be unstable under load.`,
                action: 'Implement better error handling and input validation'
            });
        }
        
        if (this.results.summary.errors > 10) {
            recommendations.push({
                priority: 'medium',
                category: 'reliability',
                description: `High error rate detected (${this.results.summary.errors} errors).`,
                action: 'Improve error handling and system monitoring'
            });
        }
        
        // Performance recommendations
        const stressTest = this.results.tests.find(t => t.type === 'stress_testing');
        if (stressTest && stressTest.averageResponseTime > 1000) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                description: `High average response time (${stressTest.averageResponseTime}ms).`,
                action: 'Optimize application performance and database queries'
            });
        }
        
        return recommendations;
    }
    
    generateHtmlReport(data) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Chaos Agent Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric.danger { color: #e74c3c; }
        .metric.warning { color: #f39c12; }
        .metric.success { color: #27ae60; }
        .test-results { margin-top: 20px; }
        .test { background: white; margin-bottom: 15px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .status { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .recommendations { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px; }
        .recommendation { padding: 15px; margin-bottom: 10px; border-radius: 4px; }
        .recommendation.critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendation.high { background: #fff3cd; border-left: 4px solid #ffc107; }
        .recommendation.medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Security Chaos Agent Report</h1>
        <p>Target: <strong>${data.testRun.target}</strong></p>
        <p>Duration: <strong>${data.testRun.duration}</strong></p>
        <p>Generated: <strong>${data.testRun.endTime}</strong></p>
    </div>
    
    <div class="summary">
        <div class="card">
            <div class="metric ${data.summary.totalTests > 0 ? 'success' : 'warning'}">${data.summary.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="card">
            <div class="metric ${data.summary.vulnerabilities === 0 ? 'success' : 'danger'}">${data.summary.vulnerabilities}</div>
            <div>Vulnerabilities</div>
        </div>
        <div class="card">
            <div class="metric ${data.summary.crashes === 0 ? 'success' : 'danger'}">${data.summary.crashes}</div>
            <div>Crashes</div>
        </div>
        <div class="card">
            <div class="metric ${data.summary.errors < 10 ? 'success' : 'warning'}">${data.summary.errors}</div>
            <div>Errors</div>
        </div>
    </div>
    
    <div class="test-results">
        <h2>Test Results</h2>
        ${data.testResults.map(test => `
            <div class="test">
                <div class="test-header">
                    <h3>${test.name}</h3>
                    <span class="status ${test.status}">${test.status.toUpperCase()}</span>
                </div>
                <p><strong>Type:</strong> ${test.type}</p>
                <p><strong>Duration:</strong> ${Math.round(test.duration / 1000)}s</p>
                ${test.vulnerabilities ? `<p><strong>Vulnerabilities:</strong> ${test.vulnerabilities}</p>` : ''}
                ${test.crashes ? `<p><strong>Crashes:</strong> ${test.crashes}</p>` : ''}
                ${test.totalRequests ? `<p><strong>Requests:</strong> ${test.totalRequests} (${test.failedRequests} failed)</p>` : ''}
                ${test.throughput ? `<p><strong>Throughput:</strong> ${test.throughput} req/s</p>` : ''}
                ${test.error ? `<pre>Error: ${test.error}</pre>` : ''}
            </div>
        `).join('')}
    </div>
    
    ${data.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${data.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h4>${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()} Priority</h4>
                <p><strong>Issue:</strong> ${rec.description}</p>
                <p><strong>Action:</strong> ${rec.action}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Report generated by Security Chaos Agent</p>
    </div>
</body>
</html>`;
        
        const htmlFile = path.join(this.outputDir, 'security-report.html');
        try {
            fs.writeFileSync(htmlFile, html);
            this.log(`HTML report generated: ${htmlFile}`, 'INFO');
        } catch (error) {
            this.log(`Failed to generate HTML report: ${error.message}`, 'ERROR');
        }
    }
    
    async runAllTests() {
        this.log('🚀 Starting Security Chaos Agent Test Suite', 'INFO');
        this.log(`Target: ${this.baseUrl}`, 'INFO');
        this.log(`Output Directory: ${this.outputDir}`, 'INFO');
        
        // Check if target is available
        const isAvailable = await this.checkTargetAvailability();
        if (!isAvailable) {
            this.log('⚠️  Target appears to be unavailable, but proceeding with tests anyway', 'WARN');
        }
        
        try {
            // Run fuzz testing
            if (this.includeFuzzing) {
                await this.runSecurityChaosAgent();
            }
            
            // Run stress testing
            if (this.includeStress) {
                await this.runStressTester();
            }
            
            // Run vulnerability scanning
            if (this.includeVulnScan) {
                await this.runVulnerabilityScanner();
            }
            
            // Generate final report
            const report = this.generateMasterReport();
            
            // Exit with appropriate code
            if (this.results.summary.failedTests > 0 || this.results.summary.vulnerabilities > 0 || this.results.summary.crashes > 0) {
                process.exit(1);
            }
            
            return report;
            
        } catch (error) {
            this.log(`Fatal error during test execution: ${error.message}`, 'CRITICAL');
            process.exit(1);
        }
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.replace(/^--/, '');
            const value = args[i + 1];
            
            if (value && !value.startsWith('--')) {
                options[key] = value;
                i++; // Skip next argument
            } else {
                options[key] = true;
            }
        }
    }
    
    // Set defaults
    if (!options.baseUrl) {
        options.baseUrl = process.env.TARGET_URL || 'http://localhost:3000';
    }
    
    if (!options.outputDir) {
        options.outputDir = process.env.OUTPUT_DIR || '/tmp/security-testing-results';
    }
    
    // Handle flags
    if (options['no-stress']) {
        options.includeStress = false;
    }
    if (options['no-vuln-scan']) {
        options.includeVulnScan = false;
    }
    if (options['no-fuzzing']) {
        options.includeFuzzing = false;
    }
    
    const runner = new SecurityTestRunner(options);
    runner.runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SecurityTestRunner;
#!/usr/bin/env node
/**
 * FlashFusion OWASP ZAP DAST Scanner
 * Dynamic Application Security Testing for deployed applications
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ZAPDastScanner {
    constructor(options = {}) {
        this.targetUrl = options.targetUrl || 'http://localhost:3000';
        this.zapPath = options.zapPath || this.findZapPath();
        this.reportDir = path.join(process.cwd(), 'security-reports');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.zapPort = options.zapPort || 8080;
        this.ensureReportDirectory();
    }

    ensureReportDirectory() {
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    findZapPath() {
        // Try common ZAP installation paths
        const possiblePaths = [
            '/usr/share/zaproxy/zap.sh',
            '/opt/zaproxy/zap.sh',
            '/Applications/OWASP ZAP.app/Contents/Java/zap.sh',
            'C:\\Program Files\\OWASP\\Zed Attack Proxy\\zap.bat',
            'docker' // Use Docker as fallback
        ];

        for (const zapPath of possiblePaths) {
            if (zapPath === 'docker') {
                try {
                    execSync('docker --version', { stdio: 'ignore' });
                    return 'docker';
                } catch {
                    continue;
                }
            } else if (fs.existsSync(zapPath)) {
                return zapPath;
            }
        }

        return null;
    }

    async isTargetAvailable() {
        return new Promise((resolve) => {
            const url = new URL(this.targetUrl);
            const req = http.request({
                hostname: url.hostname,
                port: url.port || 80,
                path: '/',
                method: 'HEAD',
                timeout: 5000
            }, (res) => {
                resolve(res.statusCode < 500);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.end();
        });
    }

    async runBaselineScans() {
        console.log('🕷️  Starting OWASP ZAP DAST Security Scan...');
        
        if (!this.zapPath) {
            console.log('⚠️  OWASP ZAP not found. Installing via Docker...');
            return this.runDockerBaseline();
        }

        const results = {
            timestamp: new Date().toISOString(),
            scanner: 'owasp-zap-baseline',
            targetUrl: this.targetUrl,
            alerts: [],
            summary: {},
            recommendations: []
        };

        // Check if target is available
        const targetAvailable = await this.isTargetAvailable();
        if (!targetAvailable) {
            console.log('⚠️  Target application not available. Running baseline scan against test endpoint...');
            results.notes = 'Target application not running - baseline scan only';
        }

        try {
            const reportFile = path.join(this.reportDir, `zap-baseline-${this.timestamp}.html`);
            const jsonReportFile = path.join(this.reportDir, `zap-baseline-${this.timestamp}.json`);

            if (this.zapPath === 'docker') {
                await this.runDockerBaseline(reportFile, jsonReportFile);
            } else {
                await this.runNativeBaseline(reportFile, jsonReportFile);
            }

            // Parse results if JSON report exists
            if (fs.existsSync(jsonReportFile)) {
                const zapResults = JSON.parse(fs.readFileSync(jsonReportFile, 'utf8'));
                results.alerts = zapResults.site?.[0]?.alerts || [];
                results.summary = this.generateSummary(results.alerts);
            }

            results.recommendations = this.generateRecommendations(results.alerts);

            // Save consolidated report
            const consolidatedReportFile = path.join(this.reportDir, `zap-consolidated-${this.timestamp}.json`);
            fs.writeFileSync(consolidatedReportFile, JSON.stringify(results, null, 2));

            // Generate human-readable report
            const humanReport = this.generateHumanReadableReport(results);
            const humanReportFile = path.join(this.reportDir, `zap-baseline-${this.timestamp}.txt`);
            fs.writeFileSync(humanReportFile, humanReport);

            console.log(`📊 ZAP reports saved to:`);
            console.log(`   HTML: ${reportFile}`);
            console.log(`   JSON: ${consolidatedReportFile}`);
            console.log(`   Text: ${humanReportFile}`);

        } catch (error) {
            console.error('❌ ZAP scan failed:', error.message);
            results.error = error.message;
        }

        return results;
    }

    async runDockerBaseline(reportFile, jsonReportFile) {
        console.log('🐳 Running ZAP via Docker...');
        
        const dockerCmd = [
            'docker', 'run', '-t',
            '--rm',
            '-v', `${this.reportDir}:/zap/wrk/:rw`,
            'ghcr.io/zaproxy/zaproxy:stable',
            'zap-baseline.py',
            '-t', this.targetUrl,
            '-g', 'gen.conf',
            '-J', path.basename(jsonReportFile || `zap-baseline-${this.timestamp}.json`),
            '-r', path.basename(reportFile || `zap-baseline-${this.timestamp}.html`)
        ];

        return new Promise((resolve, reject) => {
            const zapProcess = spawn(dockerCmd[0], dockerCmd.slice(1), {
                stdio: 'inherit',
                cwd: process.cwd()
            });

            zapProcess.on('close', (code) => {
                if (code <= 2) { // ZAP returns 1 for warnings, 2 for failures - acceptable
                    resolve();
                } else {
                    reject(new Error(`Docker ZAP failed with code ${code}`));
                }
            });

            zapProcess.on('error', reject);
        });
    }

    async runNativeBaseline(reportFile, jsonReportFile) {
        console.log('🔍 Running ZAP natively...');
        
        const zapCmd = [
            this.zapPath,
            '-cmd',
            '-quickurl', this.targetUrl,
            '-quickout', reportFile
        ];

        execSync(zapCmd.join(' '), { stdio: 'inherit' });
    }

    generateSummary(alerts) {
        const summary = {
            totalAlerts: alerts.length,
            riskCounts: { High: 0, Medium: 0, Low: 0, Informational: 0 },
            categories: {}
        };

        alerts.forEach(alert => {
            summary.riskCounts[alert.riskdesc] = (summary.riskCounts[alert.riskdesc] || 0) + 1;
            summary.categories[alert.alertRef] = alert.name;
        });

        return summary;
    }

    generateRecommendations(alerts) {
        const recommendations = [];

        if (!alerts || alerts.length === 0) {
            recommendations.push({
                type: 'info',
                message: 'No security alerts detected in DAST scan'
            });
            return recommendations;
        }

        // High-risk recommendations
        const highRiskAlerts = alerts.filter(alert => alert.riskdesc === 'High');
        if (highRiskAlerts.length > 0) {
            recommendations.push({
                type: 'critical',
                message: `${highRiskAlerts.length} HIGH RISK vulnerabilities found - immediate attention required`,
                action: 'Review and fix high-risk vulnerabilities before deployment'
            });
        }

        // Medium-risk recommendations
        const mediumRiskAlerts = alerts.filter(alert => alert.riskdesc === 'Medium');
        if (mediumRiskAlerts.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${mediumRiskAlerts.length} MEDIUM RISK vulnerabilities found`,
                action: 'Schedule fixes for medium-risk vulnerabilities'
            });
        }

        // General recommendations
        recommendations.push({
            type: 'general',
            message: 'Run DAST scans regularly against staging and production environments'
        });

        recommendations.push({
            type: 'general',
            message: 'Consider implementing a Web Application Firewall (WAF)'
        });

        return recommendations;
    }

    generateHumanReadableReport(results) {
        const lines = [];
        
        lines.push('='.repeat(60));
        lines.push('         OWASP ZAP DAST SECURITY REPORT');
        lines.push('='.repeat(60));
        lines.push(`Generated: ${results.timestamp}`);
        lines.push(`Target URL: ${results.targetUrl}`);
        lines.push('');

        if (results.error) {
            lines.push('❌ ERROR: ' + results.error);
            lines.push('');
            return lines.join('\n');
        }

        if (results.notes) {
            lines.push('📝 NOTES: ' + results.notes);
            lines.push('');
        }

        // Summary
        if (results.summary && results.summary.totalAlerts !== undefined) {
            lines.push('📊 SCAN SUMMARY:');
            lines.push(`   Total Alerts: ${results.summary.totalAlerts}`);
            lines.push('   Risk Distribution:');
            Object.entries(results.summary.riskCounts).forEach(([risk, count]) => {
                const icon = risk === 'High' ? '🔴' : 
                           risk === 'Medium' ? '🟠' : 
                           risk === 'Low' ? '🟡' : '🔵';
                lines.push(`   ${icon} ${risk}: ${count}`);
            });
            lines.push('');
        }

        // Detailed alerts
        if (results.alerts && results.alerts.length > 0) {
            lines.push('🚨 SECURITY ALERTS:');
            results.alerts.forEach((alert, index) => {
                lines.push(`\n${index + 1}. ${alert.name || 'Unknown Alert'}`);
                lines.push(`   Risk: ${alert.riskdesc || 'Unknown'}`);
                lines.push(`   Confidence: ${alert.confidence || 'Unknown'}`);
                lines.push(`   URL: ${alert.url || 'N/A'}`);
                if (alert.description) {
                    lines.push(`   Description: ${alert.description.substring(0, 200)}...`);
                }
                if (alert.solution) {
                    lines.push(`   Solution: ${alert.solution.substring(0, 200)}...`);
                }
            });
            lines.push('');
        }

        // Recommendations
        if (results.recommendations && results.recommendations.length > 0) {
            lines.push('💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, index) => {
                const icon = rec.type === 'critical' ? '🔴' : 
                           rec.type === 'warning' ? '🟠' : '💡';
                lines.push(`\n${index + 1}. ${icon} ${rec.message}`);
                if (rec.action) {
                    lines.push(`   Action: ${rec.action}`);
                }
            });
            lines.push('');
        }

        lines.push('='.repeat(60));
        
        return lines.join('\n');
    }

    getRiskScore(results) {
        if (!results.alerts) return 0;
        
        let score = 0;
        results.alerts.forEach(alert => {
            switch (alert.riskdesc) {
                case 'High': score += 10; break;
                case 'Medium': score += 5; break;
                case 'Low': score += 2; break;
                case 'Informational': score += 1; break;
            }
        });
        
        return score;
    }
}

// CLI usage
if (require.main === module) {
    const targetUrl = process.argv[2] || 'http://localhost:3000';
    const scanner = new ZAPDastScanner({ targetUrl });
    
    scanner.runBaselineScans()
        .then(results => {
            const riskScore = scanner.getRiskScore(results);
            console.log(`\n🔒 DAST Security Score: ${Math.max(0, 100 - riskScore)}/100`);
            
            if (riskScore > 30) {
                console.log('⚠️  High security risk detected! Immediate action required.');
                process.exit(1);
            } else if (riskScore > 15) {
                console.log('⚠️  Moderate security risk. Review and fix vulnerabilities.');
                process.exit(1);
            } else {
                console.log('✅ DAST scan completed successfully.');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ DAST scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = ZAPDastScanner;
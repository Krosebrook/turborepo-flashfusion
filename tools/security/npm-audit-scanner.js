#!/usr/bin/env node
/**
 * FlashFusion NPM Audit Security Scanner
 * Automated vulnerability scanning and reporting for dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class NPMAuditScanner {
    constructor() {
        this.reportDir = path.join(process.cwd(), 'security-reports');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.ensureReportDirectory();
    }

    ensureReportDirectory() {
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    async runAuditScan() {
        console.log('🔍 Starting NPM Audit Security Scan...');
        
        const results = {
            timestamp: new Date().toISOString(),
            scanner: 'npm-audit',
            vulnerabilities: {},
            summary: {},
            recommendations: []
        };

        try {
            // Run npm audit with JSON output
            const auditOutput = execSync('npm audit --json', { 
                encoding: 'utf8',
                cwd: process.cwd()
            });
            
            const auditData = JSON.parse(auditOutput);
            results.vulnerabilities = auditData.vulnerabilities || {};
            results.summary = auditData.metadata || {};
            
        } catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities found
            if (error.stdout) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    results.vulnerabilities = auditData.vulnerabilities || {};
                    results.summary = auditData.metadata || {};
                } catch (parseError) {
                    console.error('Failed to parse audit output:', parseError.message);
                    results.error = error.message;
                }
            } else {
                console.error('npm audit failed:', error.message);
                results.error = error.message;
            }
        }

        // Generate recommendations
        results.recommendations = this.generateRecommendations(results.vulnerabilities);
        
        // Save detailed report
        const reportFile = path.join(this.reportDir, `npm-audit-${this.timestamp}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
        
        // Generate human-readable report
        const humanReport = this.generateHumanReadableReport(results);
        const humanReportFile = path.join(this.reportDir, `npm-audit-${this.timestamp}.txt`);
        fs.writeFileSync(humanReportFile, humanReport);
        
        console.log(`📊 Audit reports saved to:`);
        console.log(`   JSON: ${reportFile}`);
        console.log(`   Text: ${humanReportFile}`);
        
        return results;
    }

    generateRecommendations(vulnerabilities) {
        const recommendations = [];
        
        if (!vulnerabilities || Object.keys(vulnerabilities).length === 0) {
            recommendations.push({
                type: 'info',
                message: 'No vulnerabilities detected in current dependencies'
            });
            return recommendations;
        }

        // Analyze vulnerabilities and generate recommendations
        Object.entries(vulnerabilities).forEach(([packageName, vulnData]) => {
            if (vulnData.severity === 'critical') {
                recommendations.push({
                    type: 'critical',
                    package: packageName,
                    message: `CRITICAL: Immediate update required for ${packageName}`,
                    action: vulnData.fixAvailable ? 'Run npm audit fix' : 'Manual intervention required'
                });
            } else if (vulnData.severity === 'high') {
                recommendations.push({
                    type: 'high',
                    package: packageName,
                    message: `HIGH: Priority update recommended for ${packageName}`,
                    action: vulnData.fixAvailable ? 'Run npm audit fix' : 'Consider alternative packages'
                });
            }
        });

        // Add general recommendations
        recommendations.push({
            type: 'general',
            message: 'Run npm audit fix to automatically fix resolvable vulnerabilities'
        });

        recommendations.push({
            type: 'general',
            message: 'Consider using npm-check-updates to identify outdated dependencies'
        });

        return recommendations;
    }

    generateHumanReadableReport(results) {
        const lines = [];
        
        lines.push('='.repeat(60));
        lines.push('          NPM AUDIT SECURITY REPORT');
        lines.push('='.repeat(60));
        lines.push(`Generated: ${results.timestamp}`);
        lines.push('');

        if (results.error) {
            lines.push('❌ ERROR: ' + results.error);
            lines.push('');
            return lines.join('\n');
        }

        // Summary
        if (results.summary) {
            lines.push('📊 VULNERABILITY SUMMARY:');
            lines.push(`   Total Vulnerabilities: ${results.summary.vulnerabilities || 0}`);
            lines.push(`   Dependencies: ${results.summary.dependencies || 0}`);
            lines.push(`   Dev Dependencies: ${results.summary.devDependencies || 0}`);
            lines.push('');
        }

        // Vulnerabilities by severity
        const severityCount = {};
        Object.values(results.vulnerabilities).forEach(vuln => {
            severityCount[vuln.severity] = (severityCount[vuln.severity] || 0) + 1;
        });

        if (Object.keys(severityCount).length > 0) {
            lines.push('🚨 VULNERABILITIES BY SEVERITY:');
            Object.entries(severityCount).forEach(([severity, count]) => {
                const icon = severity === 'critical' ? '🔴' : 
                           severity === 'high' ? '🟠' : 
                           severity === 'moderate' ? '🟡' : '🔵';
                lines.push(`   ${icon} ${severity.toUpperCase()}: ${count}`);
            });
            lines.push('');
        }

        // Detailed vulnerabilities
        if (Object.keys(results.vulnerabilities).length > 0) {
            lines.push('🔍 DETAILED VULNERABILITIES:');
            Object.entries(results.vulnerabilities).forEach(([packageName, vuln]) => {
                lines.push(`\n📦 Package: ${packageName}`);
                lines.push(`   Severity: ${vuln.severity?.toUpperCase() || 'UNKNOWN'}`);
                lines.push(`   Via: ${Array.isArray(vuln.via) ? vuln.via.join(', ') : vuln.via || 'Direct'}`);
                lines.push(`   Fix Available: ${vuln.fixAvailable ? '✅ Yes' : '❌ No'}`);
                if (vuln.range) {
                    lines.push(`   Affected Range: ${vuln.range}`);
                }
            });
            lines.push('');
        }

        // Recommendations
        if (results.recommendations && results.recommendations.length > 0) {
            lines.push('💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, index) => {
                const icon = rec.type === 'critical' ? '🔴' : 
                           rec.type === 'high' ? '🟠' : '💡';
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

    getSeverityScore(results) {
        if (!results.vulnerabilities) return 0;
        
        let score = 0;
        Object.values(results.vulnerabilities).forEach(vuln => {
            switch (vuln.severity) {
                case 'critical': score += 10; break;
                case 'high': score += 7; break;
                case 'moderate': score += 4; break;
                case 'low': score += 1; break;
            }
        });
        
        return score;
    }
}

// CLI usage
if (require.main === module) {
    const scanner = new NPMAuditScanner();
    
    scanner.runAuditScan()
        .then(results => {
            const severityScore = scanner.getSeverityScore(results);
            console.log(`\n🔒 Security Score: ${Math.max(0, 100 - severityScore)}/100`);
            
            if (severityScore > 20) {
                console.log('⚠️  High security risk detected! Immediate action required.');
                process.exit(1);
            } else if (severityScore > 10) {
                console.log('⚠️  Moderate security risk. Review and fix vulnerabilities.');
                process.exit(1);
            } else {
                console.log('✅ Security scan completed successfully.');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ Scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = NPMAuditScanner;
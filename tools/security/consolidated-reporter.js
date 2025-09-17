#!/usr/bin/env node
/**
 * FlashFusion Consolidated Security Report Generator
 * Combines results from NPM Audit, CodeQL, and DAST scans
 */

const fs = require('fs');
const path = require('path');
const NPMAuditScanner = require('./npm-audit-scanner');
const ZAPDastScanner = require('./zap-dast-scanner');

class ConsolidatedSecurityReporter {
    constructor(options = {}) {
        this.reportDir = path.join(process.cwd(), 'security-reports');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.targetUrl = options.targetUrl || 'http://localhost:3000';
        this.ensureReportDirectory();
    }

    ensureReportDirectory() {
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    async generateConsolidatedReport() {
        console.log('🔐 Generating Consolidated Security Report...');
        
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                reportId: `security-report-${this.timestamp}`,
                version: '1.0.0',
                scanTypes: ['npm-audit', 'codeql', 'dast']
            },
            summary: {
                overallRisk: 'unknown',
                totalVulnerabilities: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                securityScore: 0
            },
            scans: {},
            consolidatedFindings: [],
            recommendations: [],
            remediationPlan: []
        };

        try {
            // Run NPM Audit
            console.log('📦 Running NPM Audit scan...');
            const npmScanner = new NPMAuditScanner();
            const npmResults = await npmScanner.runAuditScan();
            report.scans.npmAudit = npmResults;

            // Run DAST scan
            console.log('🕷️  Running DAST scan...');
            const zapScanner = new ZAPDastScanner({ targetUrl: this.targetUrl });
            const dastResults = await zapScanner.runBaselineScans();
            report.scans.dast = dastResults;

            // Note: CodeQL results would be available from GitHub Actions artifacts
            report.scans.codeql = {
                status: 'scheduled',
                note: 'CodeQL analysis runs via GitHub Actions. Check Security tab for results.'
            };

            // Consolidate findings
            report.consolidatedFindings = this.consolidateFindings(report.scans);
            
            // Generate summary
            report.summary = this.generateSummary(report.consolidatedFindings);
            
            // Generate recommendations
            report.recommendations = this.generateRecommendations(report.consolidatedFindings);
            
            // Generate remediation plan
            report.remediationPlan = this.generateRemediationPlan(report.consolidatedFindings);

            // Save consolidated report
            const reportFile = path.join(this.reportDir, `consolidated-security-${this.timestamp}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

            // Generate human-readable report
            const humanReport = this.generateHumanReadableReport(report);
            const humanReportFile = path.join(this.reportDir, `consolidated-security-${this.timestamp}.txt`);
            fs.writeFileSync(humanReportFile, humanReport);

            // Generate HTML report
            const htmlReport = this.generateHtmlReport(report);
            const htmlReportFile = path.join(this.reportDir, `consolidated-security-${this.timestamp}.html`);
            fs.writeFileSync(htmlReportFile, htmlReport);

            console.log(`📊 Consolidated security reports saved to:`);
            console.log(`   JSON: ${reportFile}`);
            console.log(`   Text: ${humanReportFile}`);
            console.log(`   HTML: ${htmlReportFile}`);

            return report;

        } catch (error) {
            console.error('❌ Failed to generate consolidated report:', error.message);
            report.error = error.message;
            return report;
        }
    }

    consolidateFindings(scans) {
        const findings = [];

        // Process NPM Audit findings
        if (scans.npmAudit && scans.npmAudit.vulnerabilities) {
            Object.entries(scans.npmAudit.vulnerabilities).forEach(([packageName, vuln]) => {
                findings.push({
                    id: `npm-${packageName}`,
                    source: 'npm-audit',
                    type: 'dependency-vulnerability',
                    severity: this.normalizeSeverity(vuln.severity),
                    title: `Vulnerable dependency: ${packageName}`,
                    description: `Package ${packageName} has known security vulnerabilities`,
                    package: packageName,
                    fixAvailable: vuln.fixAvailable,
                    via: vuln.via,
                    range: vuln.range
                });
            });
        }

        // Process DAST findings
        if (scans.dast && scans.dast.alerts) {
            scans.dast.alerts.forEach((alert, index) => {
                findings.push({
                    id: `dast-${index}`,
                    source: 'owasp-zap',
                    type: 'web-vulnerability',
                    severity: this.normalizeSeverity(alert.riskdesc),
                    title: alert.name || 'Web Security Issue',
                    description: alert.description || 'Security vulnerability detected in web application',
                    url: alert.url,
                    confidence: alert.confidence,
                    solution: alert.solution
                });
            });
        }

        return findings;
    }

    normalizeSeverity(severity) {
        const normalized = severity?.toLowerCase();
        switch (normalized) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium':
            case 'moderate': return 'medium';
            case 'low': return 'low';
            case 'informational':
            case 'info': return 'info';
            default: return 'unknown';
        }
    }

    generateSummary(findings) {
        const summary = {
            totalVulnerabilities: findings.length,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            infoCount: 0
        };

        findings.forEach(finding => {
            switch (finding.severity) {
                case 'critical': summary.criticalCount++; break;
                case 'high': summary.highCount++; break;
                case 'medium': summary.mediumCount++; break;
                case 'low': summary.lowCount++; break;
                case 'info': summary.infoCount++; break;
            }
        });

        // Calculate overall risk
        if (summary.criticalCount > 0) {
            summary.overallRisk = 'critical';
        } else if (summary.highCount > 0) {
            summary.overallRisk = 'high';
        } else if (summary.mediumCount > 3) {
            summary.overallRisk = 'medium';
        } else if (summary.mediumCount > 0 || summary.lowCount > 5) {
            summary.overallRisk = 'low';
        } else {
            summary.overallRisk = 'minimal';
        }

        // Calculate security score (0-100)
        const riskPoints = (summary.criticalCount * 25) + 
                          (summary.highCount * 15) + 
                          (summary.mediumCount * 8) + 
                          (summary.lowCount * 3) + 
                          (summary.infoCount * 1);
        
        summary.securityScore = Math.max(0, 100 - riskPoints);

        return summary;
    }

    generateRecommendations(findings) {
        const recommendations = [];

        // Critical issues
        const criticalFindings = findings.filter(f => f.severity === 'critical');
        if (criticalFindings.length > 0) {
            recommendations.push({
                priority: 'immediate',
                type: 'critical',
                title: 'Address Critical Vulnerabilities',
                description: `${criticalFindings.length} critical vulnerabilities require immediate attention`,
                action: 'Stop deployment and fix critical issues before proceeding',
                findings: criticalFindings.map(f => f.id)
            });
        }

        // High severity issues
        const highFindings = findings.filter(f => f.severity === 'high');
        if (highFindings.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'security',
                title: 'Fix High Severity Issues',
                description: `${highFindings.length} high severity vulnerabilities detected`,
                action: 'Schedule immediate fixes for high severity issues',
                findings: highFindings.map(f => f.id)
            });
        }

        // Dependency management
        const depFindings = findings.filter(f => f.type === 'dependency-vulnerability');
        if (depFindings.length > 0) {
            recommendations.push({
                priority: 'medium',
                type: 'dependencies',
                title: 'Update Dependencies',
                description: 'Multiple dependency vulnerabilities detected',
                action: 'Run npm audit fix and update vulnerable packages',
                findings: depFindings.map(f => f.id)
            });
        }

        // General security practices
        recommendations.push({
            priority: 'ongoing',
            type: 'process',
            title: 'Implement Security Best Practices',
            description: 'Establish regular security scanning processes',
            action: 'Integrate security scans into CI/CD pipeline'
        });

        return recommendations;
    }

    generateRemediationPlan(findings) {
        const plan = [];

        // Immediate actions (Critical & High)
        const immediateFindings = findings.filter(f => ['critical', 'high'].includes(f.severity));
        if (immediateFindings.length > 0) {
            plan.push({
                phase: 'immediate',
                timeframe: '24 hours',
                actions: immediateFindings.map(f => ({
                    finding: f.id,
                    title: f.title,
                    action: f.fixAvailable ? 'Update package' : 'Manual fix required',
                    priority: f.severity
                }))
            });
        }

        // Short-term actions (Medium)
        const shortTermFindings = findings.filter(f => f.severity === 'medium');
        if (shortTermFindings.length > 0) {
            plan.push({
                phase: 'short-term',
                timeframe: '1-2 weeks',
                actions: shortTermFindings.map(f => ({
                    finding: f.id,
                    title: f.title,
                    action: 'Schedule fix',
                    priority: f.severity
                }))
            });
        }

        // Long-term actions (Low & Process improvements)
        plan.push({
            phase: 'long-term',
            timeframe: '1-3 months',
            actions: [
                'Implement automated security scanning',
                'Regular dependency updates',
                'Security training for development team',
                'Establish security policies'
            ]
        });

        return plan;
    }

    generateHumanReadableReport(report) {
        const lines = [];
        
        lines.push('='.repeat(80));
        lines.push('              FLASHFUSION CONSOLIDATED SECURITY REPORT');
        lines.push('='.repeat(80));
        lines.push(`Report ID: ${report.metadata.reportId}`);
        lines.push(`Generated: ${report.metadata.timestamp}`);
        lines.push(`Scan Types: ${report.metadata.scanTypes.join(', ')}`);
        lines.push('');

        // Executive Summary
        lines.push('🔍 EXECUTIVE SUMMARY:');
        lines.push(`   Overall Risk Level: ${report.summary.overallRisk?.toUpperCase()}`);
        lines.push(`   Security Score: ${report.summary.securityScore}/100`);
        lines.push(`   Total Vulnerabilities: ${report.summary.totalVulnerabilities}`);
        lines.push('');

        // Risk Distribution
        lines.push('📊 VULNERABILITY BREAKDOWN:');
        lines.push(`   🔴 Critical: ${report.summary.criticalCount}`);
        lines.push(`   🟠 High: ${report.summary.highCount}`);
        lines.push(`   🟡 Medium: ${report.summary.mediumCount}`);
        lines.push(`   🔵 Low: ${report.summary.lowCount}`);
        lines.push(`   ℹ️  Info: ${report.summary.infoCount || 0}`);
        lines.push('');

        // Scan Results Summary
        lines.push('🔬 SCAN RESULTS:');
        Object.entries(report.scans).forEach(([scanType, results]) => {
            if (results.error) {
                lines.push(`   ❌ ${scanType.toUpperCase()}: Failed - ${results.error}`);
            } else if (results.status === 'scheduled') {
                lines.push(`   ⏳ ${scanType.toUpperCase()}: ${results.note}`);
            } else {
                const vulnCount = scanType === 'npmAudit' ? 
                    Object.keys(results.vulnerabilities || {}).length :
                    results.alerts?.length || 0;
                lines.push(`   ✅ ${scanType.toUpperCase()}: ${vulnCount} issues found`);
            }
        });
        lines.push('');

        // Top Recommendations
        if (report.recommendations.length > 0) {
            lines.push('💡 TOP RECOMMENDATIONS:');
            report.recommendations.slice(0, 5).forEach((rec, index) => {
                const icon = rec.priority === 'immediate' ? '🚨' : 
                           rec.priority === 'high' ? '⚠️' : '💡';
                lines.push(`   ${index + 1}. ${icon} ${rec.title}`);
                lines.push(`      ${rec.description}`);
                lines.push(`      Action: ${rec.action}`);
                lines.push('');
            });
        }

        // Remediation Timeline
        if (report.remediationPlan.length > 0) {
            lines.push('📅 REMEDIATION TIMELINE:');
            report.remediationPlan.forEach(phase => {
                lines.push(`   ${phase.phase.toUpperCase()} (${phase.timeframe}):`);
                if (Array.isArray(phase.actions)) {
                    phase.actions.forEach(action => {
                        if (typeof action === 'string') {
                            lines.push(`     • ${action}`);
                        } else {
                            lines.push(`     • ${action.title} (${action.priority})`);
                        }
                    });
                }
                lines.push('');
            });
        }

        lines.push('='.repeat(80));
        lines.push('For detailed findings, check the JSON report and individual scan results.');
        lines.push('='.repeat(80));
        
        return lines.join('\n');
    }

    generateHtmlReport(report) {
        const riskColorMap = {
            critical: '#dc3545',
            high: '#fd7e14', 
            medium: '#ffc107',
            low: '#17a2b8',
            minimal: '#28a745'
        };

        const overallRiskColor = riskColorMap[report.summary.overallRisk] || '#6c757d';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlashFusion Security Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .critical { border-left-color: #dc3545; }
        .high { border-left-color: #fd7e14; }
        .medium { border-left-color: #ffc107; }
        .low { border-left-color: #17a2b8; }
        .score { font-size: 2em; font-weight: bold; color: ${overallRiskColor}; }
        .findings { margin: 30px 0; }
        .finding { border: 1px solid #dee2e6; border-radius: 8px; margin: 10px 0; padding: 15px; }
        .finding-critical { border-left: 5px solid #dc3545; }
        .finding-high { border-left: 5px solid #fd7e14; }
        .finding-medium { border-left: 5px solid #ffc107; }
        .finding-low { border-left: 5px solid #17a2b8; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 FlashFusion Security Report</h1>
            <p>Report ID: ${report.metadata.reportId}</p>
            <p>Generated: ${new Date(report.metadata.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="score">${report.summary.securityScore}/100</div>
                    <div>Security Score</div>
                </div>
                <div class="metric critical">
                    <div class="score">${report.summary.criticalCount}</div>
                    <div>Critical</div>
                </div>
                <div class="metric high">
                    <div class="score">${report.summary.highCount}</div>
                    <div>High Risk</div>
                </div>
                <div class="metric medium">
                    <div class="score">${report.summary.mediumCount}</div>
                    <div>Medium Risk</div>
                </div>
                <div class="metric low">
                    <div class="score">${report.summary.lowCount}</div>
                    <div>Low Risk</div>
                </div>
            </div>

            <h2>📋 Top Recommendations</h2>
            <div class="recommendations">
                ${report.recommendations.slice(0, 3).map(rec => `
                    <div>
                        <strong>${rec.title}</strong><br>
                        ${rec.description}<br>
                        <em>Action: ${rec.action}</em>
                    </div>
                `).join('<hr>')}
            </div>

            <h2>🔍 Scan Results</h2>
            ${Object.entries(report.scans).map(([scanType, results]) => `
                <div class="finding">
                    <h3>${scanType.toUpperCase()}</h3>
                    ${results.error ? `<span class="badge" style="background: #dc3545;">Failed</span>` : 
                      results.status === 'scheduled' ? `<span class="badge" style="background: #6c757d;">Scheduled</span>` :
                      `<span class="badge" style="background: #28a745;">Completed</span>`}
                    <p>${results.error || results.note || 'Scan completed successfully'}</p>
                </div>
            `).join('')}

            <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #6c757d;">
                Report generated by FlashFusion Security Scanner v1.0.0
            </div>
        </div>
    </div>
</body>
</html>`;
    }
}

// CLI usage
if (require.main === module) {
    const targetUrl = process.argv[2] || 'http://localhost:3000';
    const reporter = new ConsolidatedSecurityReporter({ targetUrl });
    
    reporter.generateConsolidatedReport()
        .then(report => {
            console.log(`\n🔒 Overall Security Score: ${report.summary.securityScore}/100`);
            console.log(`🚨 Risk Level: ${report.summary.overallRisk?.toUpperCase()}`);
            
            if (report.summary.overallRisk === 'critical') {
                console.log('⛔ CRITICAL RISK - Deployment blocked! Fix critical vulnerabilities immediately.');
                process.exit(2);
            } else if (report.summary.overallRisk === 'high') {
                console.log('⚠️  HIGH RISK - Review and fix high-risk vulnerabilities before deployment.');
                process.exit(1);
            } else if (report.summary.overallRisk === 'medium') {
                console.log('⚠️  MEDIUM RISK - Schedule vulnerability fixes.');
                process.exit(0);
            } else {
                console.log('✅ Security scan completed. Risk level acceptable.');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ Failed to generate security report:', error.message);
            process.exit(1);
        });
}

module.exports = ConsolidatedSecurityReporter;
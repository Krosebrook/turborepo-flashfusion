/**
 * Compliance Reporter
 * Generates comprehensive compliance reports
 */

class ComplianceReporter {
    constructor() {
        this.timestamp = new Date().toISOString();
    }

    async generate(results) {
        const report = {
            metadata: this.generateMetadata(),
            summary: this.generateSummary(results),
            gdpr: this.processSection(results.gdpr, 'GDPR'),
            ccpa: this.processSection(results.ccpa, 'CCPA'),
            residency: this.processSection(results.residency, 'Data Residency'),
            dataMap: this.processDataMap(results.dataMap),
            recommendations: this.generateRecommendations(results),
            actionPlan: this.generateActionPlan(results),
            compliance: this.generateComplianceMatrix(results)
        };

        return report;
    }

    generateMetadata() {
        return {
            reportType: 'GDPR_CCPA_Compliance_Assessment',
            version: '1.0.0',
            generated: this.timestamp,
            generator: 'FlashFusion Compliance Suite',
            scope: 'Complete application assessment',
            standards: ['GDPR', 'CCPA', 'Data Residency Requirements']
        };
    }

    generateSummary(results) {
        const totalViolations = this.countItems(results, 'violations');
        const totalWarnings = this.countItems(results, 'warnings');
        const totalCompliant = this.countItems(results, 'compliant');

        const criticalViolations = this.getCriticalViolations(results);
        const complianceScore = this.calculateComplianceScore(totalViolations, totalWarnings, totalCompliant);

        return {
            overallStatus: this.determineOverallStatus(totalViolations, totalWarnings),
            complianceScore: complianceScore,
            totalViolations: totalViolations,
            totalWarnings: totalWarnings,
            totalCompliant: totalCompliant,
            criticalViolations: criticalViolations,
            riskLevel: this.assessRiskLevel(totalViolations, criticalViolations.length),
            nextActions: this.getNextActions(criticalViolations),
            estimatedRemediationTime: this.estimateRemediationTime(totalViolations, totalWarnings)
        };
    }

    processSection(sectionResults, sectionName) {
        if (!sectionResults) {
            return {
                status: 'NOT_ASSESSED',
                violations: [],
                warnings: [],
                compliant: [],
                sectionScore: 0
            };
        }

        const violations = sectionResults.violations || [];
        const warnings = sectionResults.warnings || [];
        const compliant = sectionResults.compliant || [];

        return {
            status: this.getSectionStatus(violations, warnings, compliant),
            sectionScore: this.calculateSectionScore(violations, warnings, compliant),
            violations: violations.map(v => this.enrichViolation(v, sectionName)),
            warnings: warnings.map(w => this.enrichWarning(w, sectionName)),
            compliant: compliant.map(c => this.enrichCompliant(c, sectionName)),
            breakdown: this.generateSectionBreakdown(violations, warnings, compliant)
        };
    }

    processDataMap(dataMap) {
        if (!dataMap) return {};

        return {
            summary: {
                totalDatabases: dataMap.databases?.length || 0,
                totalFiles: dataMap.files?.length || 0,
                totalApiEndpoints: dataMap.apiEndpoints?.length || 0,
                totalThirdPartyIntegrations: dataMap.thirdPartyIntegrations?.length || 0,
                sensitiveDataSources: this.countSensitiveDataSources(dataMap)
            },
            databases: this.assessDatabaseCompliance(dataMap.databases || []),
            files: this.assessFileCompliance(dataMap.files || []),
            apiEndpoints: this.assessApiCompliance(dataMap.apiEndpoints || []),
            thirdPartyIntegrations: this.assessThirdPartyCompliance(dataMap.thirdPartyIntegrations || []),
            environmentVariables: this.assessEnvironmentCompliance(dataMap.environmentVariables || [])
        };
    }

    generateRecommendations(results) {
        const recommendations = [];

        // High-priority recommendations based on violations
        const allViolations = this.getAllViolations(results);
        const criticalViolations = allViolations.filter(v => v.severity === 'high');

        if (criticalViolations.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Security & Compliance',
                title: 'Address Critical Compliance Violations',
                description: `${criticalViolations.length} critical violations require immediate attention`,
                actions: criticalViolations.map(v => v.recommendation).slice(0, 5),
                estimatedEffort: 'High',
                deadline: '30 days'
            });
        }

        // GDPR-specific recommendations
        if (results.gdpr && results.gdpr.violations.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'GDPR Compliance',
                title: 'Implement GDPR Requirements',
                description: 'Address GDPR compliance gaps to ensure EU data protection compliance',
                actions: [
                    'Implement consent management system',
                    'Create privacy policy with GDPR disclosures',
                    'Establish data subject rights procedures',
                    'Implement data protection by design'
                ],
                estimatedEffort: 'Medium',
                deadline: '60 days'
            });
        }

        // CCPA-specific recommendations
        if (results.ccpa && results.ccpa.violations.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'CCPA Compliance',
                title: 'Implement CCPA Requirements',
                description: 'Address CCPA compliance gaps for California consumer protection',
                actions: [
                    'Add "Do Not Sell My Personal Information" link',
                    'Implement consumer rights request handling',
                    'Create CCPA-compliant privacy policy',
                    'Establish opt-out mechanisms'
                ],
                estimatedEffort: 'Medium',
                deadline: '60 days'
            });
        }

        // Data security recommendations
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Data Security',
            title: 'Enhance Data Security Measures',
            description: 'Strengthen data protection and security controls',
            actions: [
                'Implement encryption for sensitive data at rest',
                'Add authentication to personal data endpoints',
                'Establish audit logging for data access',
                'Create data breach response procedures'
            ],
            estimatedEffort: 'Medium',
            deadline: '90 days'
        });

        // Technical implementation recommendations
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Technical Implementation',
            title: 'Build Privacy Infrastructure',
            description: 'Develop technical infrastructure for privacy compliance',
            actions: [
                'Create user data export functionality',
                'Implement data deletion capabilities',
                'Build consent preference center',
                'Add privacy-focused monitoring'
            ],
            estimatedEffort: 'High',
            deadline: '120 days'
        });

        return recommendations;
    }

    generateActionPlan(results) {
        const actionPlan = {
            phases: [
                {
                    name: 'Immediate Actions (0-30 days)',
                    priority: 'CRITICAL',
                    actions: [],
                    estimatedCost: 'Low',
                    resources: 'Development team, Legal counsel'
                },
                {
                    name: 'Short-term Implementation (30-90 days)',
                    priority: 'HIGH',
                    actions: [],
                    estimatedCost: 'Medium',
                    resources: 'Development team, Privacy officer, Legal counsel'
                },
                {
                    name: 'Long-term Optimization (90-180 days)',
                    priority: 'MEDIUM',
                    actions: [],
                    estimatedCost: 'Medium-High',
                    resources: 'Full team, External consultants'
                }
            ],
            milestones: [
                {
                    name: 'Critical Violations Resolved',
                    target: '30 days',
                    success_criteria: 'Zero critical compliance violations'
                },
                {
                    name: 'Basic Compliance Achieved',
                    target: '90 days',
                    success_criteria: 'GDPR and CCPA basic requirements met'
                },
                {
                    name: 'Full Compliance Operational',
                    target: '180 days',
                    success_criteria: 'Complete privacy program implemented'
                }
            ]
        };

        // Populate actions based on violations and recommendations
        const allViolations = this.getAllViolations(results);
        
        // Critical violations go to immediate actions
        const criticalViolations = allViolations.filter(v => v.severity === 'high');
        actionPlan.phases[0].actions = criticalViolations.map(v => ({
            task: v.recommendation,
            component: v.location,
            effort: 'High'
        })).slice(0, 5);

        // Medium violations go to short-term
        const mediumViolations = allViolations.filter(v => v.severity === 'medium');
        actionPlan.phases[1].actions = mediumViolations.map(v => ({
            task: v.recommendation,
            component: v.location,
            effort: 'Medium'
        })).slice(0, 8);

        // Warnings go to long-term
        const allWarnings = this.getAllWarnings(results);
        actionPlan.phases[2].actions = allWarnings.map(w => ({
            task: w.recommendation,
            component: w.location,
            effort: 'Low-Medium'
        })).slice(0, 10);

        return actionPlan;
    }

    generateComplianceMatrix(results) {
        return {
            gdpr: {
                articles: {
                    'Article 6 - Lawfulness': this.getArticleStatus(results.gdpr, 'Article 6'),
                    'Article 7 - Consent': this.getArticleStatus(results.gdpr, 'Article 7'),
                    'Article 12-14 - Information': this.getArticleStatus(results.gdpr, 'Articles 12-14'),
                    'Article 15 - Access': this.getArticleStatus(results.gdpr, 'Article 15'),
                    'Article 16 - Rectification': this.getArticleStatus(results.gdpr, 'Article 16'),
                    'Article 17 - Erasure': this.getArticleStatus(results.gdpr, 'Article 17'),
                    'Article 20 - Portability': this.getArticleStatus(results.gdpr, 'Article 20'),
                    'Article 25 - Data Protection by Design': this.getArticleStatus(results.gdpr, 'Article 25'),
                    'Article 30 - Records': this.getArticleStatus(results.gdpr, 'Article 30'),
                    'Article 32 - Security': this.getArticleStatus(results.gdpr, 'Article 32'),
                    'Article 33-34 - Breach Notification': this.getArticleStatus(results.gdpr, 'Articles 33-34'),
                    'Article 35 - DPIA': this.getArticleStatus(results.gdpr, 'Article 35')
                }
            },
            ccpa: {
                sections: {
                    'Section 1798.100 - Right to Know': this.getSectionStatus(results.ccpa, 'Section 1798.100'),
                    'Section 1798.105 - Right to Delete': this.getSectionStatus(results.ccpa, 'Section 1798.105'),
                    'Section 1798.110 - Information Collected': this.getSectionStatus(results.ccpa, 'Section 1798.110'),
                    'Section 1798.115 - Information Sold': this.getSectionStatus(results.ccpa, 'Section 1798.115'),
                    'Section 1798.120 - Right to Opt-Out': this.getSectionStatus(results.ccpa, 'Section 1798.120'),
                    'Section 1798.125 - Non-discrimination': this.getSectionStatus(results.ccpa, 'Section 1798.125'),
                    'Section 1798.130 - Notice Requirements': this.getSectionStatus(results.ccpa, 'Section 1798.130'),
                    'Section 1798.135 - Request Methods': this.getSectionStatus(results.ccpa, 'Section 1798.135'),
                    'Section 1798.140 - Business Obligations': this.getSectionStatus(results.ccpa, 'Section 1798.140')
                }
            }
        };
    }

    // Helper methods
    countItems(results, type) {
        let count = 0;
        Object.values(results).forEach(section => {
            if (section && section[type]) {
                count += section[type].length;
            }
        });
        return count;
    }

    getCriticalViolations(results) {
        const critical = [];
        Object.values(results).forEach(section => {
            if (section && section.violations) {
                critical.push(...section.violations.filter(v => v.severity === 'high'));
            }
        });
        return critical.slice(0, 10); // Limit to top 10
    }

    calculateComplianceScore(violations, warnings, compliant) {
        const total = violations + warnings + compliant;
        if (total === 0) return 0;
        
        const score = ((compliant * 1.0) + (warnings * 0.5) + (violations * 0.0)) / total * 100;
        return Math.round(score);
    }

    determineOverallStatus(violations, warnings) {
        if (violations === 0 && warnings === 0) return 'FULLY_COMPLIANT';
        if (violations === 0) return 'MOSTLY_COMPLIANT';
        return 'NON_COMPLIANT';
    }

    assessRiskLevel(violations, criticalCount) {
        if (criticalCount > 5) return 'CRITICAL';
        if (violations > 10) return 'HIGH';
        if (violations > 5) return 'MEDIUM';
        return 'LOW';
    }

    getNextActions(criticalViolations) {
        if (criticalViolations.length === 0) {
            return ['Review warnings and implement improvements'];
        }
        
        return criticalViolations.slice(0, 3).map(v => v.recommendation);
    }

    estimateRemediationTime(violations, warnings) {
        const totalIssues = violations + warnings;
        if (totalIssues === 0) return '0 days';
        if (totalIssues <= 5) return '30-60 days';
        if (totalIssues <= 15) return '60-120 days';
        return '120-180 days';
    }

    getSectionStatus(violations, warnings, compliant) {
        if (violations.length === 0 && warnings.length === 0) return 'COMPLIANT';
        if (violations.length === 0) return 'MOSTLY_COMPLIANT';
        return 'NON_COMPLIANT';
    }

    calculateSectionScore(violations, warnings, compliant) {
        return this.calculateComplianceScore(violations.length, warnings.length, compliant.length);
    }

    enrichViolation(violation, sectionName) {
        return {
            ...violation,
            section: sectionName,
            priority: this.mapSeverityToPriority(violation.severity),
            estimatedFixTime: this.estimateFixTime(violation.severity)
        };
    }

    enrichWarning(warning, sectionName) {
        return {
            ...warning,
            section: sectionName,
            priority: 'MEDIUM',
            estimatedFixTime: this.estimateFixTime('medium')
        };
    }

    enrichCompliant(compliant, sectionName) {
        return {
            ...compliant,
            section: sectionName,
            status: 'COMPLIANT'
        };
    }

    generateSectionBreakdown(violations, warnings, compliant) {
        const total = violations.length + warnings.length + compliant.length;
        return {
            total,
            violationsPercent: total > 0 ? Math.round(violations.length / total * 100) : 0,
            warningsPercent: total > 0 ? Math.round(warnings.length / total * 100) : 0,
            compliantPercent: total > 0 ? Math.round(compliant.length / total * 100) : 0
        };
    }

    countSensitiveDataSources(dataMap) {
        let count = 0;
        if (dataMap.databases) count += dataMap.databases.filter(db => db.containsSensitiveData).length;
        if (dataMap.files) count += dataMap.files.filter(f => f.containsSensitiveData).length;
        if (dataMap.apiEndpoints) count += dataMap.apiEndpoints.filter(api => api.handlesPersonalData).length;
        return count;
    }

    assessDatabaseCompliance(databases) {
        return databases.map(db => ({
            name: db.name,
            type: db.type,
            location: db.location,
            sensitiveData: db.containsSensitiveData,
            encryptionStatus: db.compliance?.encryption || 'unknown',
            complianceLevel: this.assessDataSourceCompliance(db)
        }));
    }

    assessFileCompliance(files) {
        return files.map(file => ({
            path: file.path,
            type: file.type,
            sensitiveData: file.containsSensitiveData,
            accessControl: file.compliance?.access_control || 'unknown',
            complianceLevel: this.assessDataSourceCompliance(file)
        }));
    }

    assessApiCompliance(endpoints) {
        return endpoints.map(endpoint => ({
            method: endpoint.method,
            path: endpoint.path,
            handlesPersonalData: endpoint.handlesPersonalData,
            authentication: endpoint.compliance?.authentication || false,
            authorization: endpoint.compliance?.authorization || false,
            complianceLevel: this.assessEndpointCompliance(endpoint)
        }));
    }

    assessThirdPartyCompliance(integrations) {
        return integrations.map(integration => ({
            name: integration.name,
            dataShared: integration.dataShared,
            hasAgreement: integration.hasDataProcessingAgreement || false,
            complianceLevel: integration.hasDataProcessingAgreement ? 'GOOD' : 'NEEDS_REVIEW'
        }));
    }

    assessEnvironmentCompliance(envVars) {
        return envVars.map(envVar => ({
            key: envVar.key,
            type: envVar.type,
            hasValue: envVar.hasValue,
            encryption: envVar.compliance?.encryption || 'plaintext',
            complianceLevel: envVar.compliance?.encryption === 'plaintext' ? 'POOR' : 'GOOD'
        }));
    }

    assessDataSourceCompliance(source) {
        if (!source.containsSensitiveData) return 'GOOD';
        if (source.compliance?.encryption === 'none' || source.compliance?.encryption === 'unknown') return 'POOR';
        return 'GOOD';
    }

    assessEndpointCompliance(endpoint) {
        if (!endpoint.handlesPersonalData) return 'GOOD';
        if (!endpoint.compliance?.authentication) return 'POOR';
        if (!endpoint.compliance?.authorization) return 'FAIR';
        return 'GOOD';
    }

    getAllViolations(results) {
        const violations = [];
        Object.values(results).forEach(section => {
            if (section && section.violations) {
                violations.push(...section.violations);
            }
        });
        return violations;
    }

    getAllWarnings(results) {
        const warnings = [];
        Object.values(results).forEach(section => {
            if (section && section.warnings) {
                warnings.push(...section.warnings);
            }
        });
        return warnings;
    }

    getArticleStatus(gdprResults, articleReference) {
        if (!gdprResults) return 'NOT_ASSESSED';
        
        const hasViolations = gdprResults.violations?.some(v => v.article?.includes(articleReference));
        const hasWarnings = gdprResults.warnings?.some(w => w.article?.includes(articleReference));
        const hasCompliant = gdprResults.compliant?.some(c => c.article?.includes(articleReference));
        
        if (hasViolations) return 'NON_COMPLIANT';
        if (hasWarnings) return 'PARTIALLY_COMPLIANT';
        if (hasCompliant) return 'COMPLIANT';
        return 'NOT_ASSESSED';
    }

    getSectionStatus(ccpaResults, sectionReference) {
        if (!ccpaResults) return 'NOT_ASSESSED';
        
        const hasViolations = ccpaResults.violations?.some(v => v.section?.includes(sectionReference));
        const hasWarnings = ccpaResults.warnings?.some(w => w.section?.includes(sectionReference));
        const hasCompliant = ccpaResults.compliant?.some(c => c.section?.includes(sectionReference));
        
        if (hasViolations) return 'NON_COMPLIANT';
        if (hasWarnings) return 'PARTIALLY_COMPLIANT';
        if (hasCompliant) return 'COMPLIANT';
        return 'NOT_ASSESSED';
    }

    mapSeverityToPriority(severity) {
        switch (severity) {
            case 'high': return 'CRITICAL';
            case 'medium': return 'HIGH';
            case 'low': return 'MEDIUM';
            default: return 'LOW';
        }
    }

    estimateFixTime(severity) {
        switch (severity) {
            case 'high': return '1-2 weeks';
            case 'medium': return '2-4 weeks';
            case 'low': return '1-2 days';
            default: return '1 day';
        }
    }
}

module.exports = { ComplianceReporter };
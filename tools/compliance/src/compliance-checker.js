#!/usr/bin/env node

/**
 * FlashFusion GDPR/CCPA Compliance Checker
 * Comprehensive data privacy compliance validation tool
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { DataMapper } = require('./utils/data-mapper');
const { GDPRValidator } = require('./gdpr/gdpr-validator');
const { CCPAValidator } = require('./ccpa/ccpa-validator');
const { ComplianceReporter } = require('./reports/compliance-reporter');

class ComplianceChecker {
    constructor(options = {}) {
        this.rootPath = options.rootPath || process.cwd();
        this.configPath = options.configPath || path.join(this.rootPath, 'compliance.config.json');
        this.outputPath = options.outputPath || path.join(this.rootPath, 'compliance-report.json');
        this.violations = [];
        this.warnings = [];
        this.compliant = [];
    }

    async run() {
        console.log(chalk.blue('🔍 Starting GDPR/CCPA Compliance Check...'));
        console.log(chalk.gray(`Scanning: ${this.rootPath}`));
        
        try {
            // Load configuration
            const config = await this.loadConfig();
            
            // Map all data storage locations
            console.log(chalk.yellow('📊 Mapping data storage locations...'));
            const dataMap = await this.mapDataSources();
            
            // Check GDPR compliance
            console.log(chalk.yellow('🇪🇺 Validating GDPR compliance...'));
            const gdprResults = await this.checkGDPRCompliance(dataMap, config);
            
            // Check CCPA compliance
            console.log(chalk.yellow('🇺🇸 Validating CCPA compliance...'));
            const ccpaResults = await this.checkCCPACompliance(dataMap, config);
            
            // Check data residency rules
            console.log(chalk.yellow('🌍 Checking data residency compliance...'));
            const residencyResults = await this.checkDataResidency(dataMap, config);
            
            // Generate compliance report
            console.log(chalk.yellow('📋 Generating compliance report...'));
            const report = await this.generateReport({
                gdpr: gdprResults,
                ccpa: ccpaResults,
                residency: residencyResults,
                dataMap
            });
            
            // Display results
            this.displayResults(report);
            
            // Save report
            await this.saveReport(report);
            
            return report;
            
        } catch (error) {
            console.error(chalk.red('❌ Compliance check failed:'), error.message);
            process.exit(1);
        }
    }

    async loadConfig() {
        const defaultConfig = {
            dataRegions: ['EU', 'US', 'CA'],
            sensitiveDataPatterns: [
                /email/i,
                /password/i,
                /ssn|social.security/i,
                /credit.card|cc.number/i,
                /phone.number/i,
                /address/i,
                /name/i,
                /birth.date|dob/i,
                /ip.address/i
            ],
            gdprSettings: {
                requireExplicitConsent: true,
                dataRetentionMaxDays: 1095, // 3 years
                requirePrivacyPolicy: true,
                requireDataProcessingAgreement: true
            },
            ccpaSettings: {
                requireOptOut: true,
                requireDataSaleNotice: true,
                requirePrivacyRights: true
            },
            dataResidency: {
                eu: ['FR', 'DE', 'IE', 'NL'],
                us: ['us-east-1', 'us-west-2'],
                canada: ['ca-central-1']
            }
        };

        try {
            if (await fs.pathExists(this.configPath)) {
                const userConfig = await fs.readJson(this.configPath);
                return { ...defaultConfig, ...userConfig };
            }
            
            // Create default config file
            await fs.writeJson(this.configPath, defaultConfig, { spaces: 2 });
            console.log(chalk.green(`✅ Created default config: ${this.configPath}`));
            
            return defaultConfig;
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Using default config: ${error.message}`));
            return defaultConfig;
        }
    }

    async mapDataSources() {
        const mapper = new DataMapper(this.rootPath);
        return await mapper.scanDataSources();
    }

    async checkGDPRCompliance(dataMap, config) {
        const validator = new GDPRValidator(config.gdprSettings);
        return await validator.validate(dataMap);
    }

    async checkCCPACompliance(dataMap, config) {
        const validator = new CCPAValidator(config.ccpaSettings);
        return await validator.validate(dataMap);
    }

    async checkDataResidency(dataMap, config) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check database locations
        for (const source of dataMap.databases) {
            if (source.location && source.containsSensitiveData) {
                const region = this.identifyRegion(source.location);
                if (!this.isRegionCompliant(region, source.dataTypes, config)) {
                    violations.push({
                        type: 'DATA_RESIDENCY_VIOLATION',
                        source: source.name,
                        location: source.location,
                        region: region,
                        dataTypes: source.dataTypes,
                        recommendation: 'Move sensitive data to compliant region'
                    });
                } else {
                    compliant.push({
                        type: 'DATA_RESIDENCY_COMPLIANT',
                        source: source.name,
                        location: source.location,
                        region: region
                    });
                }
            }
        }

        return { violations, warnings, compliant };
    }

    identifyRegion(location) {
        if (!location) return 'UNKNOWN';
        
        const loc = location.toLowerCase();
        if (loc.includes('eu') || loc.includes('europe')) return 'EU';
        if (loc.includes('us') || loc.includes('america')) return 'US';
        if (loc.includes('ca') || loc.includes('canada')) return 'CA';
        
        return 'UNKNOWN';
    }

    isRegionCompliant(region, dataTypes, config) {
        // GDPR compliance for EU data
        if (region === 'EU' && dataTypes.some(type => type.personal)) {
            return config.dataResidency.eu && config.dataResidency.eu.length > 0;
        }
        
        // CCPA compliance for US data
        if (region === 'US' && dataTypes.some(type => type.personal)) {
            return config.dataResidency.us && config.dataResidency.us.length > 0;
        }
        
        return true;
    }

    async generateReport(results) {
        const reporter = new ComplianceReporter();
        return await reporter.generate(results);
    }

    displayResults(report) {
        console.log('\n' + chalk.bold('🔒 COMPLIANCE REPORT SUMMARY'));
        console.log('='.repeat(50));
        
        // Overall status
        const totalViolations = report.summary.totalViolations;
        const totalWarnings = report.summary.totalWarnings;
        
        if (totalViolations === 0 && totalWarnings === 0) {
            console.log(chalk.green('✅ FULLY COMPLIANT - No violations found'));
        } else if (totalViolations === 0) {
            console.log(chalk.yellow(`⚠️  MOSTLY COMPLIANT - ${totalWarnings} warnings`));
        } else {
            console.log(chalk.red(`❌ NON-COMPLIANT - ${totalViolations} violations, ${totalWarnings} warnings`));
        }
        
        // GDPR status
        console.log('\n📋 GDPR Compliance:');
        this.displayComplianceStatus(report.gdpr);
        
        // CCPA status
        console.log('\n📋 CCPA Compliance:');
        this.displayComplianceStatus(report.ccpa);
        
        // Data residency status
        console.log('\n📋 Data Residency:');
        this.displayComplianceStatus(report.residency);
        
        // Critical violations
        if (report.summary.criticalViolations.length > 0) {
            console.log('\n' + chalk.red.bold('🚨 CRITICAL VIOLATIONS:'));
            report.summary.criticalViolations.forEach((violation, index) => {
                console.log(chalk.red(`${index + 1}. ${violation.description}`));
                console.log(chalk.gray(`   Location: ${violation.location}`));
                console.log(chalk.blue(`   Recommendation: ${violation.recommendation}\n`));
            });
        }
        
        console.log(`\n📄 Full report saved to: ${this.outputPath}`);
    }

    displayComplianceStatus(section) {
        const violations = section.violations?.length || 0;
        const warnings = section.warnings?.length || 0;
        const compliant = section.compliant?.length || 0;
        
        console.log(`  ${chalk.red('❌ Violations:')} ${violations}`);
        console.log(`  ${chalk.yellow('⚠️  Warnings:')} ${warnings}`);
        console.log(`  ${chalk.green('✅ Compliant:')} ${compliant}`);
    }

    async saveReport(report) {
        await fs.writeJson(this.outputPath, report, { spaces: 2 });
        
        // Also save human-readable version
        const textPath = this.outputPath.replace('.json', '.txt');
        const textReport = this.generateTextReport(report);
        await fs.writeFile(textPath, textReport);
    }

    generateTextReport(report) {
        const lines = [];
        lines.push('FLASHFUSION GDPR/CCPA COMPLIANCE REPORT');
        lines.push('=' + '='.repeat(40));
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push('');
        
        lines.push('SUMMARY:');
        lines.push(`- Total Violations: ${report.summary.totalViolations}`);
        lines.push(`- Total Warnings: ${report.summary.totalWarnings}`);
        lines.push(`- Compliant Items: ${report.summary.totalCompliant}`);
        lines.push('');
        
        if (report.summary.criticalViolations.length > 0) {
            lines.push('CRITICAL VIOLATIONS:');
            report.summary.criticalViolations.forEach((violation, index) => {
                lines.push(`${index + 1}. ${violation.description}`);
                lines.push(`   Location: ${violation.location}`);
                lines.push(`   Recommendation: ${violation.recommendation}`);
                lines.push('');
            });
        }
        
        return lines.join('\n');
    }
}

// CLI execution
if (require.main === module) {
    const checker = new ComplianceChecker();
    checker.run().catch(console.error);
}

module.exports = { ComplianceChecker };
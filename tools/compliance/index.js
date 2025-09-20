/**
 * FlashFusion Compliance Suite
 * GDPR/CCPA Data Privacy Compliance Tools
 */

const { ComplianceChecker } = require('./src/compliance-checker');
const { DataMapper } = require('./src/utils/data-mapper');
const { GDPRValidator } = require('./src/gdpr/gdpr-validator');
const { CCPAValidator } = require('./src/ccpa/ccpa-validator');
const { ComplianceReporter } = require('./src/reports/compliance-reporter');

// Main exports
module.exports = {
    ComplianceChecker,
    DataMapper,
    GDPRValidator,
    CCPAValidator,
    ComplianceReporter,
    
    // Convenience methods
    async runComplianceCheck(options = {}) {
        const checker = new ComplianceChecker(options);
        return await checker.run();
    },
    
    async mapDataSources(rootPath) {
        const mapper = new DataMapper(rootPath);
        return await mapper.scanDataSources();
    },
    
    async validateGDPR(dataMap, config = {}) {
        const validator = new GDPRValidator(config);
        return await validator.validate(dataMap);
    },
    
    async validateCCPA(dataMap, config = {}) {
        const validator = new CCPAValidator(config);
        return await validator.validate(dataMap);
    },
    
    async generateReport(results) {
        const reporter = new ComplianceReporter();
        return await reporter.generate(results);
    }
};
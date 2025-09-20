/**
 * CCPA Compliance Validator
 * Validates California Consumer Privacy Act compliance
 */

class CCPAValidator {
    constructor(config = {}) {
        this.config = {
            requireOptOut: true,
            requireDataSaleNotice: true,
            requirePrivacyRights: true,
            businessThreshold: 25000000, // $25M annual revenue
            consumerThreshold: 50000, // 50K consumers annually
            dataPercentageThreshold: 50, // 50% revenue from selling data
            ...config
        };
    }

    async validate(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // CCPA Section 1798.100: Consumer's Right to Know
        const rightToKnowResults = await this.validateRightToKnow(dataMap);
        violations.push(...rightToKnowResults.violations);
        warnings.push(...rightToKnowResults.warnings);
        compliant.push(...rightToKnowResults.compliant);

        // CCPA Section 1798.105: Consumer's Right to Delete
        const rightToDeleteResults = await this.validateRightToDelete(dataMap);
        violations.push(...rightToDeleteResults.violations);
        warnings.push(...rightToDeleteResults.warnings);
        compliant.push(...rightToDeleteResults.compliant);

        // CCPA Section 1798.110: Consumer's Right to Know About Information Collected
        const infoCollectedResults = await this.validateInformationCollected(dataMap);
        violations.push(...infoCollectedResults.violations);
        warnings.push(...infoCollectedResults.warnings);
        compliant.push(...infoCollectedResults.compliant);

        // CCPA Section 1798.115: Consumer's Right to Know About Information Sold or Disclosed
        const infoSoldResults = await this.validateInformationSoldOrDisclosed(dataMap);
        violations.push(...infoSoldResults.violations);
        warnings.push(...infoSoldResults.warnings);
        compliant.push(...infoSoldResults.compliant);

        // CCPA Section 1798.120: Consumer's Right to Opt-Out
        const optOutResults = await this.validateRightToOptOut(dataMap);
        violations.push(...optOutResults.violations);
        warnings.push(...optOutResults.warnings);
        compliant.push(...optOutResults.compliant);

        // CCPA Section 1798.125: Non-discrimination
        const nonDiscriminationResults = await this.validateNonDiscrimination(dataMap);
        violations.push(...nonDiscriminationResults.violations);
        warnings.push(...nonDiscriminationResults.warnings);
        compliant.push(...nonDiscriminationResults.compliant);

        // CCPA Section 1798.130: Notice Requirements
        const noticeResults = await this.validateNoticeRequirements(dataMap);
        violations.push(...noticeResults.violations);
        warnings.push(...noticeResults.warnings);
        compliant.push(...noticeResults.compliant);

        // CCPA Section 1798.135: Methods for Submitting Requests
        const requestMethodsResults = await this.validateRequestMethods(dataMap);
        violations.push(...requestMethodsResults.violations);
        warnings.push(...requestMethodsResults.warnings);
        compliant.push(...requestMethodsResults.compliant);

        // CCPA Section 1798.140: Definitions and Business Obligations
        const businessObligationsResults = await this.validateBusinessObligations(dataMap);
        violations.push(...businessObligationsResults.violations);
        warnings.push(...businessObligationsResults.warnings);
        compliant.push(...businessObligationsResults.compliant);

        return { violations, warnings, compliant };
    }

    async validateRightToKnow(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for consumer data access capabilities
        const hasDataAccessEndpoint = this.hasConsumerDataAccess(dataMap);
        
        if (!hasDataAccessEndpoint) {
            violations.push({
                section: 'CCPA Section 1798.100',
                type: 'NO_CONSUMER_DATA_ACCESS',
                severity: 'high',
                description: 'No mechanism for consumers to access their personal information',
                location: 'Consumer rights implementation',
                recommendation: 'Implement secure consumer portal or API for data access requests'
            });
        }

        // Check for data categories disclosure
        const hasDataCategoriesDisclosure = this.hasDataCategoriesDisclosure(dataMap);
        
        if (!hasDataCategoriesDisclosure) {
            violations.push({
                section: 'CCPA Section 1798.100',
                type: 'NO_DATA_CATEGORIES_DISCLOSURE',
                severity: 'medium',
                description: 'No disclosure of personal information categories collected',
                location: 'Privacy notice',
                recommendation: 'Provide clear disclosure of categories of personal information collected'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateRightToDelete(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for data deletion capabilities
        const hasDataDeletionEndpoint = this.hasConsumerDataDeletion(dataMap);
        
        if (!hasDataDeletionEndpoint) {
            violations.push({
                section: 'CCPA Section 1798.105',
                type: 'NO_CONSUMER_DATA_DELETION',
                severity: 'high',
                description: 'No mechanism for consumers to delete their personal information',
                location: 'Consumer rights implementation',
                recommendation: 'Implement secure data deletion request handling with proper verification'
            });
        }

        // Check for deletion verification process
        const hasVerificationProcess = this.hasDeletionVerification(dataMap);
        
        if (!hasVerificationProcess) {
            warnings.push({
                section: 'CCPA Section 1798.105',
                type: 'NO_DELETION_VERIFICATION',
                severity: 'medium',
                description: 'No verification process for deletion requests',
                location: 'Data deletion process',
                recommendation: 'Implement reasonable verification process for deletion requests'
            });
        }

        // Check for third-party deletion procedures
        if (dataMap.thirdPartyIntegrations.length > 0) {
            warnings.push({
                section: 'CCPA Section 1798.105',
                type: 'THIRD_PARTY_DELETION_REQUIRED',
                severity: 'medium',
                description: 'Third-party integrations require deletion coordination',
                location: 'Third-party services',
                recommendation: 'Establish procedures to request deletion from third-party services'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateInformationCollected(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for comprehensive data collection disclosure
        const hasCollectionDisclosure = this.hasDataCollectionDisclosure(dataMap);
        
        if (!hasCollectionDisclosure) {
            violations.push({
                section: 'CCPA Section 1798.110',
                type: 'NO_COLLECTION_DISCLOSURE',
                severity: 'high',
                description: 'No disclosure of specific personal information collected',
                location: 'Privacy notice',
                recommendation: 'Provide detailed disclosure of specific personal information collected in past 12 months'
            });
        }

        // Check for source disclosure
        const hasSourceDisclosure = this.hasDataSourceDisclosure(dataMap);
        
        if (!hasSourceDisclosure) {
            violations.push({
                section: 'CCPA Section 1798.110',
                type: 'NO_SOURCE_DISCLOSURE',
                severity: 'medium',
                description: 'No disclosure of sources of personal information',
                location: 'Privacy notice',
                recommendation: 'Disclose categories of sources from which personal information is collected'
            });
        }

        // Check for business purpose disclosure
        const hasPurposeDisclosure = this.hasBusinessPurposeDisclosure(dataMap);
        
        if (!hasPurposeDisclosure) {
            violations.push({
                section: 'CCPA Section 1798.110',
                type: 'NO_PURPOSE_DISCLOSURE',
                severity: 'medium',
                description: 'No disclosure of business purposes for collecting personal information',
                location: 'Privacy notice',
                recommendation: 'Disclose business or commercial purposes for collecting personal information'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateInformationSoldOrDisclosed(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for data sale disclosure
        const sellsPersonalInfo = this.sellsPersonalInformation(dataMap);
        
        if (sellsPersonalInfo === null) {
            warnings.push({
                section: 'CCPA Section 1798.115',
                type: 'DATA_SALE_STATUS_UNKNOWN',
                severity: 'high',
                description: 'Cannot determine if personal information is sold to third parties',
                location: 'Business practices review required',
                recommendation: 'Determine and disclose whether personal information is sold or disclosed to third parties'
            });
        } else if (sellsPersonalInfo === true) {
            // If selling data, must provide specific disclosures
            const hasSaleDisclosure = this.hasDataSaleDisclosure(dataMap);
            
            if (!hasSaleDisclosure) {
                violations.push({
                    section: 'CCPA Section 1798.115',
                    type: 'NO_SALE_DISCLOSURE',
                    severity: 'high',
                    description: 'Personal information is sold but no disclosure provided',
                    location: 'Privacy notice',
                    recommendation: 'Provide detailed disclosure of personal information categories sold and third-party categories'
                });
            }
        } else {
            compliant.push({
                section: 'CCPA Section 1798.115',
                type: 'NO_DATA_SALE',
                description: 'Personal information is not sold to third parties',
                location: 'Business practices'
            });
        }

        // Check third-party integrations for potential data sharing
        for (const integration of dataMap.thirdPartyIntegrations) {
            if (integration.dataShared && integration.dataShared.length > 0) {
                warnings.push({
                    section: 'CCPA Section 1798.115',
                    type: 'THIRD_PARTY_SHARING_REVIEW',
                    severity: 'medium',
                    description: `Data sharing with ${integration.name} requires disclosure review`,
                    location: `Third-party integration: ${integration.name}`,
                    recommendation: 'Review if data sharing constitutes "sale" under CCPA and provide appropriate disclosures'
                });
            }
        }

        return { violations, warnings, compliant };
    }

    async validateRightToOptOut(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        if (!this.config.requireOptOut) {
            compliant.push({
                section: 'CCPA Section 1798.120',
                type: 'OPT_OUT_NOT_REQUIRED',
                description: 'Opt-out not required by configuration'
            });
            return { violations, warnings, compliant };
        }

        // Check for "Do Not Sell My Personal Information" link
        const hasDoNotSellLink = this.hasDoNotSellLink(dataMap);
        
        if (!hasDoNotSellLink) {
            violations.push({
                section: 'CCPA Section 1798.120',
                type: 'NO_DO_NOT_SELL_LINK',
                severity: 'high',
                description: 'No "Do Not Sell My Personal Information" link found',
                location: 'Website/app interface',
                recommendation: 'Add prominent "Do Not Sell My Personal Information" link on homepage and privacy policy'
            });
        }

        // Check for opt-out request handling
        const hasOptOutEndpoint = this.hasOptOutImplementation(dataMap);
        
        if (!hasOptOutEndpoint) {
            violations.push({
                section: 'CCPA Section 1798.120',
                type: 'NO_OPT_OUT_IMPLEMENTATION',
                severity: 'high',
                description: 'No implementation for opt-out requests',
                location: 'Consumer rights implementation',
                recommendation: 'Implement opt-out request handling and preference management'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateNonDiscrimination(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // This requires business process review
        warnings.push({
            section: 'CCPA Section 1798.125',
            type: 'NON_DISCRIMINATION_REVIEW_REQUIRED',
            severity: 'medium',
            description: 'Non-discrimination practices require manual review',
            location: 'Business processes',
            recommendation: 'Ensure consumers exercising CCPA rights are not discriminated against in terms of price, service, or quality'
        });

        return { violations, warnings, compliant };
    }

    async validateNoticeRequirements(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for privacy policy
        const hasPrivacyPolicy = this.hasPrivacyPolicy(dataMap);
        
        if (!hasPrivacyPolicy) {
            violations.push({
                section: 'CCPA Section 1798.130',
                type: 'NO_PRIVACY_POLICY',
                severity: 'high',
                description: 'No privacy policy found',
                location: 'Legal documentation',
                recommendation: 'Create comprehensive privacy policy with CCPA-required disclosures'
            });
        }

        // Check for collection notice
        const hasCollectionNotice = this.hasCollectionNotice(dataMap);
        
        if (!hasCollectionNotice) {
            violations.push({
                section: 'CCPA Section 1798.130',
                type: 'NO_COLLECTION_NOTICE',
                severity: 'medium',
                description: 'No notice at or before collection of personal information',
                location: 'Data collection points',
                recommendation: 'Provide notice at or before collecting personal information'
            });
        }

        // Check for notice accessibility
        warnings.push({
            section: 'CCPA Section 1798.130',
            type: 'NOTICE_ACCESSIBILITY_REVIEW',
            severity: 'low',
            description: 'Notice accessibility requires review',
            location: 'Privacy notices',
            recommendation: 'Ensure privacy notices are accessible to consumers with disabilities'
        });

        return { violations, warnings, compliant };
    }

    async validateRequestMethods(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for multiple request methods
        const requestMethods = this.getAvailableRequestMethods(dataMap);
        
        if (requestMethods.length < 2) {
            violations.push({
                section: 'CCPA Section 1798.135',
                type: 'INSUFFICIENT_REQUEST_METHODS',
                severity: 'medium',
                description: 'Must provide at least two methods for submitting requests',
                location: 'Consumer request interface',
                recommendation: 'Provide toll-free phone number and online form/email for consumer requests'
            });
        }

        // Check for request verification
        const hasRequestVerification = this.hasRequestVerification(dataMap);
        
        if (!hasRequestVerification) {
            warnings.push({
                section: 'CCPA Section 1798.135',
                type: 'NO_REQUEST_VERIFICATION',
                severity: 'medium',
                description: 'No request verification process detected',
                location: 'Request handling process',
                recommendation: 'Implement reasonable verification process for consumer requests'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateBusinessObligations(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check response time compliance (45 days)
        warnings.push({
            section: 'CCPA Section 1798.140',
            type: 'RESPONSE_TIME_COMPLIANCE',
            severity: 'medium',
            description: 'Response time compliance requires process review',
            location: 'Request handling procedures',
            recommendation: 'Ensure 45-day response time for consumer requests (with possible 45-day extension)'
        });

        // Check for minor handling procedures
        const hasMinorProcedures = this.hasMinorHandlingProcedures(dataMap);
        
        if (!hasMinorProcedures) {
            warnings.push({
                section: 'CCPA Section 1798.140',
                type: 'NO_MINOR_PROCEDURES',
                severity: 'medium',
                description: 'No special procedures for handling minors\' data',
                location: 'Data handling procedures',
                recommendation: 'Implement special procedures for personal information of consumers under 16'
            });
        }

        // Check for employee training
        warnings.push({
            section: 'CCPA Section 1798.140',
            type: 'EMPLOYEE_TRAINING_REQUIRED',
            severity: 'low',
            description: 'Employee CCPA training recommended',
            location: 'Training programs',
            recommendation: 'Train employees on CCPA requirements and consumer rights'
        });

        return { violations, warnings, compliant };
    }

    // Helper methods
    hasConsumerDataAccess(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('access') || 
            endpoint.path.includes('data') ||
            endpoint.path.includes('export') ||
            (endpoint.method === 'GET' && endpoint.handlesPersonalData)
        );
    }

    hasDataCategoriesDisclosure(dataMap) {
        // This requires manual verification of privacy policy content
        return false;
    }

    hasConsumerDataDeletion(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.method === 'DELETE' && 
            endpoint.handlesPersonalData
        );
    }

    hasDeletionVerification(dataMap) {
        // Check if there's a verification process in place
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('verify') || 
            endpoint.path.includes('confirm')
        );
    }

    hasDataCollectionDisclosure(dataMap) {
        // This requires manual verification of privacy policy content
        return false;
    }

    hasDataSourceDisclosure(dataMap) {
        // This requires manual verification of privacy policy content
        return false;
    }

    hasBusinessPurposeDisclosure(dataMap) {
        // This requires manual verification of privacy policy content
        return false;
    }

    sellsPersonalInformation(dataMap) {
        // Analyze third-party integrations to determine if data is sold
        const commercialIntegrations = dataMap.thirdPartyIntegrations.filter(integration =>
            ['Stripe', 'Shopify'].includes(integration.name)
        );

        if (commercialIntegrations.length > 0) {
            return null; // Requires manual review
        }

        // If only technical integrations, likely not selling data
        return false;
    }

    hasDataSaleDisclosure(dataMap) {
        // This requires manual verification of privacy policy content
        return false;
    }

    hasDoNotSellLink(dataMap) {
        // This would need to be verified in the UI
        return false;
    }

    hasOptOutImplementation(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('opt-out') || 
            endpoint.path.includes('do-not-sell')
        );
    }

    hasPrivacyPolicy(dataMap) {
        // This should be manually verified
        return false;
    }

    hasCollectionNotice(dataMap) {
        // Check if data collection points have proper notices
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.hasDataCollectionNotice === true
        );
    }

    getAvailableRequestMethods(dataMap) {
        const methods = [];
        
        // Check for online methods
        if (dataMap.apiEndpoints.some(endpoint => endpoint.handlesPersonalData)) {
            methods.push('online');
        }
        
        // Phone number would need to be manually verified
        // Email contact would need to be manually verified
        
        return methods;
    }

    hasRequestVerification(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('verify') || 
            endpoint.path.includes('confirm')
        );
    }

    hasMinorHandlingProcedures(dataMap) {
        // This requires manual verification of procedures
        return false;
    }
}

module.exports = { CCPAValidator };
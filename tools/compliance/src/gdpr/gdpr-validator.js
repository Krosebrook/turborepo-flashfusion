/**
 * GDPR Compliance Validator
 * Validates General Data Protection Regulation compliance
 */

class GDPRValidator {
    constructor(config = {}) {
        this.config = {
            requireExplicitConsent: true,
            dataRetentionMaxDays: 1095, // 3 years default
            requirePrivacyPolicy: true,
            requireDataProcessingAgreement: true,
            requireRightToPortability: true,
            requireRightToErasure: true,
            requireDataProtectionOfficer: false, // Only required for certain organizations
            ...config
        };
    }

    async validate(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Article 6: Lawfulness of processing
        const lawfulnessResults = await this.validateLawfulnessOfProcessing(dataMap);
        violations.push(...lawfulnessResults.violations);
        warnings.push(...lawfulnessResults.warnings);
        compliant.push(...lawfulnessResults.compliant);

        // Article 7: Conditions for consent
        const consentResults = await this.validateConsent(dataMap);
        violations.push(...consentResults.violations);
        warnings.push(...consentResults.warnings);
        compliant.push(...consentResults.compliant);

        // Article 12-14: Information and access to personal data
        const informationResults = await this.validateInformationProvision(dataMap);
        violations.push(...informationResults.violations);
        warnings.push(...informationResults.warnings);
        compliant.push(...informationResults.compliant);

        // Article 15: Right of access
        const accessResults = await this.validateRightOfAccess(dataMap);
        violations.push(...accessResults.violations);
        warnings.push(...accessResults.warnings);
        compliant.push(...accessResults.compliant);

        // Article 16: Right to rectification
        const rectificationResults = await this.validateRightToRectification(dataMap);
        violations.push(...rectificationResults.violations);
        warnings.push(...rectificationResults.warnings);
        compliant.push(...rectificationResults.compliant);

        // Article 17: Right to erasure
        const erasureResults = await this.validateRightToErasure(dataMap);
        violations.push(...erasureResults.violations);
        warnings.push(...erasureResults.warnings);
        compliant.push(...erasureResults.compliant);

        // Article 20: Right to data portability
        const portabilityResults = await this.validateRightToPortability(dataMap);
        violations.push(...portabilityResults.violations);
        warnings.push(...portabilityResults.warnings);
        compliant.push(...portabilityResults.compliant);

        // Article 25: Data protection by design and by default
        const designResults = await this.validateDataProtectionByDesign(dataMap);
        violations.push(...designResults.violations);
        warnings.push(...designResults.warnings);
        compliant.push(...designResults.compliant);

        // Article 30: Records of processing activities
        const recordsResults = await this.validateRecordsOfProcessing(dataMap);
        violations.push(...recordsResults.violations);
        warnings.push(...recordsResults.warnings);
        compliant.push(...recordsResults.compliant);

        // Article 32: Security of processing
        const securityResults = await this.validateSecurityOfProcessing(dataMap);
        violations.push(...securityResults.violations);
        warnings.push(...securityResults.warnings);
        compliant.push(...securityResults.compliant);

        // Article 33-34: Data breach notification
        const breachResults = await this.validateDataBreachNotification(dataMap);
        violations.push(...breachResults.violations);
        warnings.push(...breachResults.warnings);
        compliant.push(...breachResults.compliant);

        // Article 35: Data protection impact assessment
        const dpiResults = await this.validateDataProtectionImpactAssessment(dataMap);
        violations.push(...dpiResults.violations);
        warnings.push(...dpiResults.warnings);
        compliant.push(...dpiResults.compliant);

        return { violations, warnings, compliant };
    }

    async validateLawfulnessOfProcessing(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check if there's a legal basis for processing personal data
        for (const database of dataMap.databases) {
            if (database.containsSensitiveData) {
                const hasLegalBasis = database.legalBasis || false;
                
                if (!hasLegalBasis) {
                    violations.push({
                        article: 'GDPR Article 6',
                        type: 'NO_LEGAL_BASIS',
                        severity: 'high',
                        description: 'No legal basis documented for processing personal data',
                        location: `${database.type}: ${database.name}`,
                        recommendation: 'Document legal basis for processing (consent, contract, legal obligation, vital interests, public task, or legitimate interests)',
                        dataTypes: database.dataTypes.filter(dt => dt.personal)
                    });
                }
            }
        }

        // Check API endpoints
        for (const endpoint of dataMap.apiEndpoints) {
            if (endpoint.handlesPersonalData) {
                warnings.push({
                    article: 'GDPR Article 6',
                    type: 'REQUIRES_LEGAL_BASIS_REVIEW',
                    severity: 'medium',
                    description: 'API endpoint handling personal data requires legal basis review',
                    location: `${endpoint.method} ${endpoint.path}`,
                    recommendation: 'Ensure legal basis is documented and implemented for this data processing'
                });
            }
        }

        return { violations, warnings, compliant };
    }

    async validateConsent(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        if (!this.config.requireExplicitConsent) {
            compliant.push({
                article: 'GDPR Article 7',
                type: 'CONSENT_NOT_REQUIRED',
                description: 'Explicit consent not required by configuration'
            });
            return { violations, warnings, compliant };
        }

        // Check for consent management implementation
        const hasConsentManagement = this.hasConsentManagementSystem(dataMap);
        
        if (!hasConsentManagement) {
            violations.push({
                article: 'GDPR Article 7',
                type: 'NO_CONSENT_MANAGEMENT',
                severity: 'high',
                description: 'No consent management system detected',
                location: 'Application-wide',
                recommendation: 'Implement consent management system with explicit consent capture, withdrawal mechanism, and consent records'
            });
        }

        // Check cookie consent (if cookies are used)
        if (dataMap.cookies.length > 0) {
            const hasCookieConsent = dataMap.cookies.some(cookie => 
                cookie.compliance.consent === 'implemented'
            );
            
            if (!hasCookieConsent) {
                violations.push({
                    article: 'GDPR Article 7',
                    type: 'NO_COOKIE_CONSENT',
                    severity: 'medium',
                    description: 'Cookies used without proper consent mechanism',
                    location: 'Cookie implementation',
                    recommendation: 'Implement cookie consent banner with granular choices'
                });
            }
        }

        return { violations, warnings, compliant };
    }

    async validateInformationProvision(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for privacy policy
        if (this.config.requirePrivacyPolicy) {
            const hasPrivacyPolicy = this.hasPrivacyPolicy(dataMap);
            
            if (!hasPrivacyPolicy) {
                violations.push({
                    article: 'GDPR Articles 12-14',
                    type: 'NO_PRIVACY_POLICY',
                    severity: 'high',
                    description: 'No privacy policy found',
                    location: 'Application documentation',
                    recommendation: 'Create comprehensive privacy policy covering data collection, processing purposes, legal basis, retention periods, and individual rights'
                });
            }
        }

        // Check data collection transparency
        for (const endpoint of dataMap.apiEndpoints) {
            if (endpoint.handlesPersonalData) {
                const hasDataCollectionNotice = endpoint.hasDataCollectionNotice || false;
                
                if (!hasDataCollectionNotice) {
                    warnings.push({
                        article: 'GDPR Articles 12-14',
                        type: 'NO_DATA_COLLECTION_NOTICE',
                        severity: 'medium',
                        description: 'Data collection point lacks transparency notice',
                        location: `${endpoint.method} ${endpoint.path}`,
                        recommendation: 'Add clear notice about data collection, purposes, and rights at point of collection'
                    });
                }
            }
        }

        return { violations, warnings, compliant };
    }

    async validateRightOfAccess(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for data access functionality
        const hasDataAccessEndpoint = this.hasDataAccessImplementation(dataMap);
        
        if (!hasDataAccessEndpoint) {
            violations.push({
                article: 'GDPR Article 15',
                type: 'NO_DATA_ACCESS_IMPLEMENTATION',
                severity: 'high',
                description: 'No implementation for data subject access requests',
                location: 'API endpoints',
                recommendation: 'Implement secure endpoint for users to access their personal data'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateRightToRectification(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for data modification capabilities
        const hasDataUpdateEndpoint = this.hasDataUpdateImplementation(dataMap);
        
        if (!hasDataUpdateEndpoint) {
            warnings.push({
                article: 'GDPR Article 16',
                type: 'LIMITED_DATA_RECTIFICATION',
                severity: 'medium',
                description: 'Limited or no data rectification capabilities detected',
                location: 'API endpoints',
                recommendation: 'Implement secure endpoints for users to update their personal data'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateRightToErasure(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        if (!this.config.requireRightToErasure) {
            compliant.push({
                article: 'GDPR Article 17',
                type: 'ERASURE_NOT_REQUIRED',
                description: 'Right to erasure not required by configuration'
            });
            return { violations, warnings, compliant };
        }

        // Check for data deletion capabilities
        const hasDataDeletionEndpoint = this.hasDataDeletionImplementation(dataMap);
        
        if (!hasDataDeletionEndpoint) {
            violations.push({
                article: 'GDPR Article 17',
                type: 'NO_DATA_ERASURE_IMPLEMENTATION',
                severity: 'high',
                description: 'No implementation for data erasure requests',
                location: 'API endpoints',
                recommendation: 'Implement secure data deletion functionality with proper verification'
            });
        }

        // Check data retention policies
        for (const database of dataMap.databases) {
            if (database.containsSensitiveData && !database.retentionPolicy) {
                warnings.push({
                    article: 'GDPR Article 17',
                    type: 'NO_RETENTION_POLICY',
                    severity: 'medium',
                    description: 'No data retention policy defined',
                    location: `${database.type}: ${database.name}`,
                    recommendation: 'Define and implement data retention policies with automatic deletion'
                });
            }
        }

        return { violations, warnings, compliant };
    }

    async validateRightToPortability(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        if (!this.config.requireRightToPortability) {
            compliant.push({
                article: 'GDPR Article 20',
                type: 'PORTABILITY_NOT_REQUIRED',
                description: 'Right to data portability not required by configuration'
            });
            return { violations, warnings, compliant };
        }

        // Check for data export capabilities
        const hasDataExportEndpoint = this.hasDataExportImplementation(dataMap);
        
        if (!hasDataExportEndpoint) {
            violations.push({
                article: 'GDPR Article 20',
                type: 'NO_DATA_PORTABILITY_IMPLEMENTATION',
                severity: 'medium',
                description: 'No implementation for data portability requests',
                location: 'API endpoints',
                recommendation: 'Implement data export functionality in structured, machine-readable format'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateDataProtectionByDesign(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for encryption
        for (const database of dataMap.databases) {
            if (database.containsSensitiveData) {
                if (database.compliance.encryption === 'none' || database.compliance.encryption === 'unknown') {
                    violations.push({
                        article: 'GDPR Article 25',
                        type: 'NO_ENCRYPTION',
                        severity: 'high',
                        description: 'Sensitive data stored without encryption',
                        location: `${database.type}: ${database.name}`,
                        recommendation: 'Implement encryption at rest and in transit for sensitive data'
                    });
                } else {
                    compliant.push({
                        article: 'GDPR Article 25',
                        type: 'ENCRYPTION_IMPLEMENTED',
                        description: 'Data encryption properly implemented',
                        location: `${database.type}: ${database.name}`
                    });
                }
            }
        }

        // Check for data minimization
        warnings.push({
            article: 'GDPR Article 25',
            type: 'DATA_MINIMIZATION_REVIEW_REQUIRED',
            severity: 'low',
            description: 'Data minimization practices require manual review',
            location: 'Data collection points',
            recommendation: 'Review all data collection to ensure only necessary data is processed'
        });

        return { violations, warnings, compliant };
    }

    async validateRecordsOfProcessing(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for processing records
        const hasProcessingRecords = this.hasProcessingRecords(dataMap);
        
        if (!hasProcessingRecords) {
            violations.push({
                article: 'GDPR Article 30',
                type: 'NO_PROCESSING_RECORDS',
                severity: 'medium',
                description: 'No records of processing activities found',
                location: 'Documentation',
                recommendation: 'Maintain records of all personal data processing activities'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateSecurityOfProcessing(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check API security
        for (const endpoint of dataMap.apiEndpoints) {
            if (endpoint.handlesPersonalData) {
                if (!endpoint.compliance.authentication) {
                    violations.push({
                        article: 'GDPR Article 32',
                        type: 'NO_AUTHENTICATION',
                        severity: 'high',
                        description: 'Personal data endpoint lacks authentication',
                        location: `${endpoint.method} ${endpoint.path}`,
                        recommendation: 'Implement proper authentication for all personal data endpoints'
                    });
                }

                if (!endpoint.compliance.authorization) {
                    violations.push({
                        article: 'GDPR Article 32',
                        type: 'NO_AUTHORIZATION',
                        severity: 'high',
                        description: 'Personal data endpoint lacks authorization controls',
                        location: `${endpoint.method} ${endpoint.path}`,
                        recommendation: 'Implement authorization controls to ensure users can only access their own data'
                    });
                }

                if (!endpoint.compliance.validation) {
                    warnings.push({
                        article: 'GDPR Article 32',
                        type: 'NO_INPUT_VALIDATION',
                        severity: 'medium',
                        description: 'Personal data endpoint lacks input validation',
                        location: `${endpoint.method} ${endpoint.path}`,
                        recommendation: 'Implement comprehensive input validation and sanitization'
                    });
                }
            }
        }

        return { violations, warnings, compliant };
    }

    async validateDataBreachNotification(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check for breach detection and notification procedures
        const hasBreachProcedures = this.hasBreachNotificationProcedures(dataMap);
        
        if (!hasBreachProcedures) {
            violations.push({
                article: 'GDPR Articles 33-34',
                type: 'NO_BREACH_PROCEDURES',
                severity: 'high',
                description: 'No data breach detection and notification procedures found',
                location: 'Security procedures',
                recommendation: 'Implement data breach detection, 72-hour authority notification, and individual notification procedures'
            });
        }

        return { violations, warnings, compliant };
    }

    async validateDataProtectionImpactAssessment(dataMap) {
        const violations = [];
        const warnings = [];
        const compliant = [];

        // Check if DPIA is required based on data processing
        const requiresDPIA = this.requiresDataProtectionImpactAssessment(dataMap);
        
        if (requiresDPIA) {
            warnings.push({
                article: 'GDPR Article 35',
                type: 'DPIA_REQUIRED',
                severity: 'medium',
                description: 'Data Protection Impact Assessment may be required',
                location: 'High-risk data processing',
                recommendation: 'Conduct DPIA for high-risk data processing operations'
            });
        }

        return { violations, warnings, compliant };
    }

    // Helper methods
    hasConsentManagementSystem(dataMap) {
        // Check if there are consent-related endpoints or files
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('consent') || 
            endpoint.path.includes('preferences')
        );
    }

    hasPrivacyPolicy(dataMap) {
        // This should be manually verified - for now return false to flag for review
        return false;
    }

    hasDataAccessImplementation(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('export') || 
            endpoint.path.includes('download') ||
            (endpoint.method === 'GET' && endpoint.handlesPersonalData)
        );
    }

    hasDataUpdateImplementation(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            (endpoint.method === 'PUT' || endpoint.method === 'PATCH') && 
            endpoint.handlesPersonalData
        );
    }

    hasDataDeletionImplementation(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.method === 'DELETE' && 
            endpoint.handlesPersonalData
        );
    }

    hasDataExportImplementation(dataMap) {
        return dataMap.apiEndpoints.some(endpoint => 
            endpoint.path.includes('export') || 
            endpoint.path.includes('download')
        );
    }

    hasProcessingRecords(dataMap) {
        // Check if audit logs capture processing activities
        return dataMap.files.some(file => 
            file.type === 'audit_log' && 
            file.dataTypes.some(dt => dt.type === 'audit_trail')
        );
    }

    hasBreachNotificationProcedures(dataMap) {
        // This should be manually verified - check for security monitoring
        return dataMap.files.some(file => 
            file.type === 'audit_log'
        );
    }

    requiresDataProtectionImpactAssessment(dataMap) {
        // High-risk processing that typically requires DPIA
        const hasHighRiskProcessing = dataMap.databases.some(db => 
            db.containsSensitiveData && 
            db.dataTypes.some(dt => dt.category === 'identity' || dt.category === 'security')
        );

        const hasThirdPartyTransfers = dataMap.thirdPartyIntegrations.some(integration =>
            integration.compliance.dataTransfer === 'international'
        );

        return hasHighRiskProcessing || hasThirdPartyTransfers;
    }
}

module.exports = { GDPRValidator };
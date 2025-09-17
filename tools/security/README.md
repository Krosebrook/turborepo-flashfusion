# 🔐 FlashFusion Security Scanning Suite

A comprehensive security scanning infrastructure for the FlashFusion platform that integrates NPM audit, CodeQL static analysis, and OWASP ZAP dynamic testing to provide early identification of security vulnerabilities.

## 🎯 Overview

The Security Scanning Agent implements automated vulnerability detection across multiple security domains:

- **📦 NPM Audit**: Dependency vulnerability scanning
- **🔍 CodeQL**: Static code analysis for security issues
- **🕷️ DAST**: Dynamic application security testing with OWASP ZAP
- **📊 Consolidated Reporting**: Unified vulnerability reports with severity and remediation guidance

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker (for OWASP ZAP)
- npm/pnpm

### Installation

```bash
# Install dependencies
npm install

# Install OWASP ZAP via Docker
npm run security:install-zap
```

### Basic Usage

```bash
# Run all security scans
npm run security:scan

# Run individual scans
npm run security:npm    # NPM audit only
npm run security:dast   # DAST scan only

# Run with custom target
node tools/security/consolidated-reporter.js http://localhost:3000
```

## 🛠️ Security Tools

### 1. NPM Audit Scanner (`npm-audit-scanner.js`)

Scans dependencies for known vulnerabilities and generates detailed reports.

**Features:**
- JSON and human-readable reporting
- Vulnerability severity scoring
- Fix recommendations
- Security score calculation (0-100)

**Usage:**
```bash
node tools/security/npm-audit-scanner.js
```

**Exit Codes:**
- `0`: No significant vulnerabilities
- `1`: Moderate risk detected
- `2`: High risk detected

### 2. CodeQL Static Analysis

GitHub-native static analysis for JavaScript/TypeScript security issues.

**Configuration:** `.github/codeql-config.yml`
**Workflow:** `.github/workflows/codeql.yml`

**Features:**
- Security-focused queries
- Integration with GitHub Security tab
- Automated SARIF uploads
- Weekly scheduled scans

### 3. OWASP ZAP DAST Scanner (`zap-dast-scanner.js`)

Dynamic application security testing for running web applications.

**Features:**
- Docker-based ZAP integration
- Baseline security scans
- HTML and JSON reporting
- Target availability checking

**Usage:**
```bash
# Scan localhost
node tools/security/zap-dast-scanner.js

# Scan custom target
node tools/security/zap-dast-scanner.js https://example.com
```

### 4. Consolidated Reporter (`consolidated-reporter.js`)

Combines results from all scanners into unified reports.

**Features:**
- Multi-format output (JSON, TXT, HTML)
- Risk prioritization
- Remediation timeline
- Executive summaries

## 📊 Report Formats

### Console Output
Real-time scanning progress and summary results.

### JSON Reports
Machine-readable format for integration with other tools:
```json
{
  "metadata": {
    "timestamp": "2025-09-17T10:26:38.211Z",
    "reportId": "security-report-...",
    "scanTypes": ["npm-audit", "codeql", "dast"]
  },
  "summary": {
    "overallRisk": "critical",
    "securityScore": 60,
    "totalVulnerabilities": 6
  },
  "consolidatedFindings": [...],
  "recommendations": [...],
  "remediationPlan": [...]
}
```

### HTML Reports
Visual dashboards with metrics and charts for stakeholder review.

### Text Reports
Human-readable summaries for quick review:
```
================================================================================
              FLASHFUSION CONSOLIDATED SECURITY REPORT
================================================================================
🔍 EXECUTIVE SUMMARY:
   Overall Risk Level: CRITICAL
   Security Score: 60/100
   Total Vulnerabilities: 6
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The security scanning suite integrates with GitHub Actions via `.github/workflows/security-scanning.yml`:

**Triggers:**
- Push to main/develop branches
- Pull requests to main
- Weekly scheduled scans

**Jobs:**
1. **npm-audit**: Dependency vulnerability scanning
2. **dast-scan**: Dynamic application testing
3. **consolidated-report**: Generate unified reports
4. **security-gate**: Quality gate evaluation

**Quality Gates:**
- **CRITICAL**: Blocks deployment
- **HIGH**: Warning with manual review
- **Score < 70**: Warning threshold

### Local Development

```bash
# Pre-commit security check
npm run security:scan

# Quick dependency check
npm run security:npm
```

## 🚨 Vulnerability Management

### Severity Levels

| Level | Score Impact | Action Required |
|-------|-------------|-----------------|
| **Critical** | -25 points | Immediate fix required |
| **High** | -15 points | Fix within 24-48 hours |
| **Medium** | -8 points | Fix within 1-2 weeks |
| **Low** | -3 points | Fix in next release cycle |

### Risk Assessment

- **Critical Risk**: 1+ critical vulnerabilities
- **High Risk**: 1+ high vulnerabilities
- **Medium Risk**: 3+ medium vulnerabilities
- **Low Risk**: Limited medium/low vulnerabilities
- **Minimal Risk**: Few low-severity issues

## 📁 Directory Structure

```
tools/security/
├── npm-audit-scanner.js      # NPM dependency scanner
├── zap-dast-scanner.js       # OWASP ZAP DAST scanner
├── consolidated-reporter.js  # Unified report generator
├── package.json              # Security tools metadata
└── README.md                 # This documentation

security-reports/             # Generated reports
├── npm-audit-*.json         # NPM audit results
├── zap-baseline-*.html      # ZAP scan results
└── consolidated-*.json      # Unified reports

.github/workflows/
├── codeql.yml               # CodeQL static analysis
└── security-scanning.yml   # Complete security suite
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Custom ZAP installation path
ZAP_PATH=/path/to/zap.sh

# Optional: Custom report directory
SECURITY_REPORT_DIR=./custom-reports

# Optional: Target application URL
TARGET_URL=https://staging.example.com
```

### Scanner Options

**NPM Audit Scanner:**
```javascript
const scanner = new NPMAuditScanner({
  reportDir: './custom-reports'
});
```

**DAST Scanner:**
```javascript
const scanner = new ZAPDastScanner({
  targetUrl: 'https://example.com',
  zapPort: 8080,
  zapPath: '/custom/zap/path'
});
```

**Consolidated Reporter:**
```javascript
const reporter = new ConsolidatedSecurityReporter({
  targetUrl: 'https://example.com'
});
```

## 🧪 Testing

### Manual Testing

```bash
# Test NPM scanner
npm run security:npm

# Test DAST scanner (requires running app)
npm run dev &
npm run security:dast

# Test full suite
npm run security:scan
```

### CI Testing

The security workflows are automatically tested in GitHub Actions on every push and pull request.

## 🤝 Contributing

### Adding New Scanners

1. Create scanner class in `tools/security/`
2. Implement required methods:
   - `runScan()`
   - `generateReport()`
   - `getSeverityScore()`
3. Add integration to `consolidated-reporter.js`
4. Update documentation

### Report Format Standards

All scanners should output:
- Standardized severity levels
- Consistent finding structure
- Remediation recommendations
- Human and machine-readable formats

## 📖 Examples

### Basic Security Scan
```bash
npm run security:scan
```

### Custom Target Scan
```bash
node tools/security/consolidated-reporter.js https://staging.myapp.com
```

### NPM Audit Only
```bash
npm run security:npm
```

### View Latest Reports
```bash
ls -la security-reports/
cat security-reports/consolidated-*.txt
```

## 🚀 Deployment Integration

### Vercel Integration
```bash
# Add to vercel.json
{
  "buildCommand": "npm run build && npm run security:scan"
}
```

### Docker Integration
```dockerfile
# Add to Dockerfile
RUN npm run security:scan
```

### Pre-deployment Check
```bash
npm run security:scan && npm run deploy
```

## 📞 Support

For questions or issues with the security scanning suite:

1. Check existing security reports in `security-reports/`
2. Review GitHub Actions logs for CI issues
3. Consult individual scanner documentation
4. Open an issue in the repository

## 🔒 Security Best Practices

1. **Regular Scanning**: Run scans on every commit and weekly
2. **Immediate Response**: Address critical vulnerabilities within 24 hours
3. **Dependency Management**: Keep dependencies updated
4. **Code Review**: Include security review in pull requests
5. **Documentation**: Maintain security documentation and runbooks

---

**Generated by FlashFusion Security Scanner v1.0.0**
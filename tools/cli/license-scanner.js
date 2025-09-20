#!/usr/bin/env node

/**
 * License Compliance Scanner
 * Scans all dependencies for license types and flags incompatible or risky licenses
 * 
 * @author FlashFusion Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const licenseChecker = require('license-checker');

// License Policy Configuration
const LICENSE_POLICY = {
  // Approved licenses (low risk)
  approved: [
    'MIT',
    'Apache-2.0',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'ISC',
    'CC0-1.0',
    'Unlicense',
    'WTFPL'
  ],
  
  // Conditional licenses (medium risk - need review)
  conditional: [
    'LGPL-2.1',
    'LGPL-3.0',
    'MPL-2.0',
    'EPL-1.0',
    'EPL-2.0',
    'CDDL-1.0',
    'CDDL-1.1',
    'CPL-1.0'
  ],
  
  // Restricted licenses (high risk - forbidden)
  restricted: [
    'GPL-2.0',
    'GPL-3.0',
    'AGPL-1.0',
    'AGPL-3.0',
    'CC-BY-SA-4.0',
    'SSPL-1.0',
    'OSL-3.0',
    'EUPL-1.1',
    'EUPL-1.2'
  ],
  
  // Commercial/Proprietary (requires manual review)
  commercial: [
    'Custom',
    'Proprietary',
    'Commercial',
    'UNLICENSED'
  ]
};

// Color utilities for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`)
};

/**
 * Normalize license names to standard SPDX identifiers
 */
function normalizeLicense(license) {
  if (!license) return 'UNKNOWN';
  
  const normalizedLicense = license.toString().trim();
  
  // Handle common variations
  const licenseMap = {
    'Apache License 2.0': 'Apache-2.0',
    'Apache 2.0': 'Apache-2.0',
    'Apache License, Version 2.0': 'Apache-2.0',
    'Apache-2': 'Apache-2.0',
    'BSD 3-Clause': 'BSD-3-Clause',
    'BSD 2-Clause': 'BSD-2-Clause',
    'MIT License': 'MIT',
    'The MIT License': 'MIT',
    'GNU General Public License v2.0': 'GPL-2.0',
    'GNU General Public License v3.0': 'GPL-3.0',
    'GNU Lesser General Public License v2.1': 'LGPL-2.1',
    'GNU Lesser General Public License v3.0': 'LGPL-3.0',
    'Mozilla Public License 2.0': 'MPL-2.0',
    'Eclipse Public License 1.0': 'EPL-1.0',
    'Eclipse Public License 2.0': 'EPL-2.0',
    'Creative Commons Zero v1.0 Universal': 'CC0-1.0',
    'The Unlicense': 'Unlicense',
    '(MIT OR CC0-1.0)': 'MIT OR CC0-1.0',
    '(MIT AND CC-BY-3.0)': 'MIT AND CC-BY-3.0'
  };
  
  return licenseMap[normalizedLicense] || normalizedLicense;
}

/**
 * Classify license risk level
 */
function classifyLicense(license) {
  const normalizedLicense = normalizeLicense(license);
  
  if (LICENSE_POLICY.approved.includes(normalizedLicense)) {
    return { level: 'approved', color: colors.green };
  }
  
  if (LICENSE_POLICY.conditional.includes(normalizedLicense)) {
    return { level: 'conditional', color: colors.yellow };
  }
  
  if (LICENSE_POLICY.restricted.includes(normalizedLicense)) {
    return { level: 'restricted', color: colors.red };
  }
  
  if (LICENSE_POLICY.commercial.some(comm => normalizedLicense.includes(comm))) {
    return { level: 'commercial', color: colors.magenta };
  }
  
  // Unknown licenses need manual review
  return { level: 'unknown', color: colors.yellow };
}

/**
 * Scan licenses in a specific directory
 */
async function scanLicenses(directory, options = {}) {
  return new Promise((resolve, reject) => {
    const checkerOptions = {
      start: directory,
      production: options.productionOnly || false,
      development: !options.productionOnly,
      excludePrivatePackages: true,
      onlyAllow: undefined, // We'll handle policy ourselves
      failOn: undefined,    // We'll handle failures ourselves
      customPath: {
        licenses: path.join(directory, 'node_modules'),
        licenseFile: undefined
      }
    };

    licenseChecker.init(checkerOptions, (err, packages) => {
      if (err) {
        reject(err);
        return;
      }
      
      const results = [];
      
      for (const [packageName, packageInfo] of Object.entries(packages)) {
        const classification = classifyLicense(packageInfo.licenses);
        
        results.push({
          name: packageName,
          version: packageInfo.version || 'unknown',
          license: normalizeLicense(packageInfo.licenses),
          repository: packageInfo.repository || 'unknown',
          publisher: packageInfo.publisher || 'unknown',
          email: packageInfo.email || 'unknown',
          url: packageInfo.url || 'unknown',
          licenseFile: packageInfo.licenseFile || 'unknown',
          classification: classification.level,
          risk: classification.level,
          path: packageInfo.path || 'unknown'
        });
      }
      
      resolve(results);
    });
  });
}

/**
 * Scan all workspaces in the monorepo
 */
async function scanAllWorkspaces(rootDir = process.cwd()) {
  log.title('🔍 License Compliance Scanner');
  log.info('Scanning all workspaces for license compliance...\n');
  
  try {
    // Read package.json to get workspace configuration
    const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const workspaces = rootPackageJson.workspaces || [];
    
    // Find all workspace directories
    const workspaceDirs = [];
    
    for (const workspace of workspaces) {
      const workspacePattern = workspace.replace('/*', '');
      const workspaceBase = path.join(rootDir, workspacePattern);
      
      if (fs.existsSync(workspaceBase)) {
        const subdirs = fs.readdirSync(workspaceBase)
          .filter(dir => fs.statSync(path.join(workspaceBase, dir)).isDirectory())
          .map(dir => path.join(workspaceBase, dir))
          .filter(dir => fs.existsSync(path.join(dir, 'package.json')));
        
        workspaceDirs.push(...subdirs);
      }
    }
    
    // Also scan root directory
    workspaceDirs.unshift(rootDir);
    
    const allResults = [];
    const summaryStats = {
      total: 0,
      approved: 0,
      conditional: 0,
      restricted: 0,
      commercial: 0,
      unknown: 0,
      violations: []
    };
    
    // Scan each workspace
    for (const workspaceDir of workspaceDirs) {
      const workspaceName = workspaceDir === rootDir ? 'root' : path.basename(workspaceDir);
      
      try {
        log.info(`Scanning workspace: ${workspaceName}...`);
        
        if (!fs.existsSync(path.join(workspaceDir, 'node_modules'))) {
          log.warn(`No node_modules found in ${workspaceName}, skipping...`);
          continue;
        }
        
        const results = await scanLicenses(workspaceDir);
        
        for (const result of results) {
          result.workspace = workspaceName;
          allResults.push(result);
          
          // Update statistics
          summaryStats.total++;
          summaryStats[result.classification]++;
          
          // Track violations
          if (result.classification === 'restricted' || result.classification === 'commercial') {
            summaryStats.violations.push({
              package: result.name,
              license: result.license,
              workspace: workspaceName,
              risk: result.classification
            });
          }
        }
        
        log.success(`Workspace ${workspaceName}: ${results.length} packages scanned`);
        
      } catch (error) {
        log.error(`Failed to scan workspace ${workspaceName}: ${error.message}`);
      }
    }
    
    return {
      packages: allResults,
      summary: summaryStats,
      timestamp: new Date().toISOString(),
      scanConfig: {
        policy: LICENSE_POLICY,
        workspaces: workspaceDirs.length
      }
    };
    
  } catch (error) {
    log.error(`License scan failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate compliance report
 */
function generateReport(scanResults, options = {}) {
  const { packages, summary } = scanResults;
  
  log.title('\n📊 License Compliance Report');
  log.info(`Generated: ${new Date(scanResults.timestamp).toLocaleString()}`);
  log.info(`Total packages scanned: ${summary.total}\n`);
  
  // Summary statistics
  console.log(`${colors.bright}📈 License Distribution:${colors.reset}`);
  console.log(`  ${colors.green}✓ Approved:${colors.reset}     ${summary.approved} packages`);
  console.log(`  ${colors.yellow}⚠ Conditional:${colors.reset}  ${summary.conditional} packages`);
  console.log(`  ${colors.red}✗ Restricted:${colors.reset}   ${summary.restricted} packages`);
  console.log(`  ${colors.magenta}◯ Commercial:${colors.reset}   ${summary.commercial} packages`);
  console.log(`  ${colors.yellow}? Unknown:${colors.reset}      ${summary.unknown} packages\n`);
  
  // Violations
  if (summary.violations.length > 0) {
    console.log(`${colors.bright}${colors.red}🚨 LICENSE VIOLATIONS DETECTED:${colors.reset}`);
    
    for (const violation of summary.violations) {
      const riskColor = violation.risk === 'restricted' ? colors.red : colors.magenta;
      console.log(`  ${riskColor}✗${colors.reset} ${violation.package} (${violation.license}) - ${violation.workspace}`);
    }
    console.log('');
  } else {
    console.log(`${colors.bright}${colors.green}✅ NO LICENSE VIOLATIONS DETECTED${colors.reset}\n`);
  }
  
  // License breakdown by type
  if (options.detailed) {
    const licenseGroups = {};
    packages.forEach(pkg => {
      if (!licenseGroups[pkg.license]) {
        licenseGroups[pkg.license] = [];
      }
      licenseGroups[pkg.license].push(pkg);
    });
    
    console.log(`${colors.bright}📋 License Breakdown:${colors.reset}`);
    Object.entries(licenseGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([license, pkgs]) => {
        const classification = classifyLicense(license);
        console.log(`  ${classification.color}${license}${colors.reset}: ${pkgs.length} packages`);
      });
    console.log('');
  }
  
  // Risk assessment
  const riskScore = calculateRiskScore(summary);
  const riskLevel = getRiskLevel(riskScore);
  
  console.log(`${colors.bright}⚖️  Compliance Assessment:${colors.reset}`);
  console.log(`  Risk Score: ${riskLevel.color}${riskScore}/100${colors.reset}`);
  console.log(`  Risk Level: ${riskLevel.color}${riskLevel.name}${colors.reset}`);
  console.log(`  Recommendation: ${riskLevel.recommendation}\n`);
  
  return {
    summary,
    riskScore,
    riskLevel: riskLevel.name,
    violations: summary.violations
  };
}

/**
 * Calculate risk score based on license distribution
 */
function calculateRiskScore(summary) {
  if (summary.total === 0) return 0;
  
  const restrictedWeight = 50;
  const commercialWeight = 30;
  const unknownWeight = 20;
  const conditionalWeight = 10;
  
  const score = (
    (summary.restricted * restrictedWeight) +
    (summary.commercial * commercialWeight) +
    (summary.unknown * unknownWeight) +
    (summary.conditional * conditionalWeight)
  ) / summary.total;
  
  return Math.min(100, Math.round(score));
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score) {
  if (score >= 75) {
    return {
      name: 'CRITICAL',
      color: colors.red,
      recommendation: 'Immediate action required. Replace restricted licenses.'
    };
  } else if (score >= 50) {
    return {
      name: 'HIGH',
      color: colors.red,
      recommendation: 'Review and replace problematic licenses soon.'
    };
  } else if (score >= 25) {
    return {
      name: 'MEDIUM',
      color: colors.yellow,
      recommendation: 'Monitor conditional licenses and plan replacements.'
    };
  } else if (score >= 10) {
    return {
      name: 'LOW',
      color: colors.yellow,
      recommendation: 'Review unknown licenses when convenient.'
    };
  } else {
    return {
      name: 'MINIMAL',
      color: colors.green,
      recommendation: 'License compliance looks good!'
    };
  }
}

/**
 * Export results to file
 */
function exportResults(scanResults, format = 'json', filename = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `license-compliance-${timestamp}`;
  const outputFile = filename || `${defaultFilename}.${format}`;
  
  try {
    let output;
    
    switch (format.toLowerCase()) {
      case 'json':
        output = JSON.stringify(scanResults, null, 2);
        break;
        
      case 'csv':
        output = generateCSV(scanResults.packages);
        break;
        
      case 'html':
        output = generateHTML(scanResults);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    fs.writeFileSync(outputFile, output, 'utf8');
    log.success(`Report exported to: ${outputFile}`);
    
    return outputFile;
    
  } catch (error) {
    log.error(`Export failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate CSV output
 */
function generateCSV(packages) {
  const headers = ['Package', 'Version', 'License', 'Risk Level', 'Workspace', 'Repository', 'Publisher'];
  const rows = packages.map(pkg => [
    pkg.name,
    pkg.version,
    pkg.license,
    pkg.classification,
    pkg.workspace,
    pkg.repository,
    pkg.publisher
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Generate HTML report
 */
function generateHTML(scanResults) {
  const { packages, summary } = scanResults;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>License Compliance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #ddd; }
        .approved { border-left-color: #28a745; }
        .conditional { border-left-color: #ffc107; }
        .restricted { border-left-color: #dc3545; }
        .commercial { border-left-color: #6f42c1; }
        .unknown { border-left-color: #fd7e14; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .violation { background-color: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>License Compliance Report</h1>
        <p>Generated: ${new Date(scanResults.timestamp).toLocaleString()}</p>
        <p>Total packages scanned: ${summary.total}</p>
    </div>
    
    <div class="summary">
        <div class="stat approved">
            <h3>${summary.approved}</h3>
            <p>Approved</p>
        </div>
        <div class="stat conditional">
            <h3>${summary.conditional}</h3>
            <p>Conditional</p>
        </div>
        <div class="stat restricted">
            <h3>${summary.restricted}</h3>
            <p>Restricted</p>
        </div>
        <div class="stat commercial">
            <h3>${summary.commercial}</h3>
            <p>Commercial</p>
        </div>
        <div class="stat unknown">
            <h3>${summary.unknown}</h3>
            <p>Unknown</p>
        </div>
    </div>
    
    <h2>Package Details</h2>
    <table>
        <thead>
            <tr>
                <th>Package</th>
                <th>Version</th>
                <th>License</th>
                <th>Risk Level</th>
                <th>Workspace</th>
                <th>Repository</th>
            </tr>
        </thead>
        <tbody>
            ${packages.map(pkg => `
                <tr class="${pkg.classification === 'restricted' || pkg.classification === 'commercial' ? 'violation' : ''}">
                    <td>${pkg.name}</td>
                    <td>${pkg.version}</td>
                    <td>${pkg.license}</td>
                    <td>${pkg.classification}</td>
                    <td>${pkg.workspace}</td>
                    <td>${pkg.repository}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
`;
}

module.exports = {
  scanAllWorkspaces,
  generateReport,
  exportResults,
  classifyLicense,
  LICENSE_POLICY,
  log
};
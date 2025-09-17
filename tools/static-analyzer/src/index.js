const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const SecurityRules = require('./rules/security');
const QualityRules = require('./rules/quality');

class StaticAnalyzer {
  constructor(options = {}) {
    this.options = {
      includeSecurity: true,
      includeQuality: true,
      minSeverity: 'low',
      excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      ...options
    };
    
    this.securityRules = new SecurityRules();
    this.qualityRules = new QualityRules();
    this.severityLevels = ['low', 'medium', 'high', 'critical'];
  }

  async scan(targetPath) {
    console.log(chalk.blue('🔍 Starting static analysis...'));
    
    const startTime = Date.now();
    const files = await this.getFilesToScan(targetPath);
    
    console.log(chalk.gray(`Found ${files.length} files to analyze`));
    
    const findings = [];
    const stats = {
      filesScanned: 0,
      securityIssues: 0,
      qualityIssues: 0,
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 }
    };

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const fileFindings = await this.analyzeFile(file, content);
        
        findings.push(...fileFindings);
        stats.filesScanned++;
        
        // Update stats
        fileFindings.forEach(finding => {
          if (finding.category === 'security') stats.securityIssues++;
          if (finding.category === 'quality') stats.qualityIssues++;
          stats.severityBreakdown[finding.severity]++;
        });
        
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Could not analyze ${file}: ${error.message}`));
      }
    }

    const duration = Date.now() - startTime;
    
    return {
      findings: this.filterBySeverity(findings),
      stats,
      duration,
      timestamp: new Date().toISOString(),
      scanPath: targetPath
    };
  }

  async getFilesToScan(targetPath) {
    const patterns = [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx', 
      '**/*.tsx',
      '**/*.json',
      '**/*.env*',
      '**/*.yml',
      '**/*.yaml'
    ];

    const allFiles = [];
    
    for (const pattern of patterns) {
      const files = glob.sync(path.join(targetPath, pattern), {
        ignore: this.options.excludePatterns.map(p => path.join(targetPath, p))
      });
      allFiles.push(...files);
    }

    // Remove duplicates and normalize paths
    return [...new Set(allFiles)].map(file => path.resolve(file));
  }

  async analyzeFile(filePath, content) {
    const findings = [];
    const ext = path.extname(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    // Security analysis
    if (this.options.includeSecurity) {
      const securityFindings = await this.securityRules.analyze(filePath, content, ext);
      findings.push(...securityFindings.map(f => ({
        ...f,
        file: relativePath,
        category: 'security'
      })));
    }

    // Quality analysis
    if (this.options.includeQuality) {
      const qualityFindings = await this.qualityRules.analyze(filePath, content, ext);
      findings.push(...qualityFindings.map(f => ({
        ...f,
        file: relativePath,
        category: 'quality'
      })));
    }

    return findings;
  }

  filterBySeverity(findings) {
    const minIndex = this.severityLevels.indexOf(this.options.minSeverity);
    return findings.filter(finding => {
      const findingIndex = this.severityLevels.indexOf(finding.severity);
      return findingIndex >= minIndex;
    });
  }

  printResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.blue('📊 STATIC ANALYSIS REPORT'));
    console.log('='.repeat(60));
    
    // Summary
    console.log(chalk.bold('\n📈 SUMMARY'));
    console.log(`Files scanned: ${results.stats.filesScanned}`);
    console.log(`Total findings: ${results.findings.length}`);
    console.log(`Security issues: ${results.stats.securityIssues}`);
    console.log(`Quality issues: ${results.stats.qualityIssues}`);
    console.log(`Scan duration: ${results.duration}ms`);
    
    // Severity breakdown
    console.log(chalk.bold('\n🚨 SEVERITY BREAKDOWN'));
    Object.entries(results.stats.severityBreakdown).forEach(([severity, count]) => {
      if (count > 0) {
        const color = this.getSeverityColor(severity);
        console.log(`${color(severity.toUpperCase())}: ${count}`);
      }
    });

    // Detailed findings
    if (results.findings.length > 0) {
      console.log(chalk.bold('\n🔍 DETAILED FINDINGS'));
      console.log('-'.repeat(60));
      
      // Group by severity
      const grouped = results.findings.reduce((acc, finding) => {
        if (!acc[finding.severity]) acc[finding.severity] = [];
        acc[finding.severity].push(finding);
        return acc;
      }, {});

      ['critical', 'high', 'medium', 'low'].forEach(severity => {
        if (grouped[severity]) {
          console.log(chalk.bold(`\n${this.getSeverityColor(severity)(severity.toUpperCase())} ISSUES:`));
          grouped[severity].forEach((finding, index) => {
            console.log(`\n${index + 1}. ${chalk.bold(finding.title)}`);
            console.log(`   File: ${finding.file}:${finding.line || 'N/A'}`);
            console.log(`   Rule: ${finding.rule}`);
            console.log(`   Category: ${finding.category}`);
            console.log(`   Description: ${finding.description}`);
            if (finding.recommendation) {
              console.log(`   💡 ${chalk.green('Recommendation:')} ${finding.recommendation}`);
            }
          });
        }
      });
    } else {
      console.log(chalk.green('\n✅ No issues found!'));
    }
    
    console.log('\n' + '='.repeat(60));
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return chalk.red.bold;
      case 'high': return chalk.red;
      case 'medium': return chalk.yellow;
      case 'low': return chalk.blue;
      default: return chalk.gray;
    }
  }

  async exportResults(results, outputPath, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        break;
      case 'html':
        const html = this.generateHTMLReport(results);
        await fs.writeFile(outputPath, html);
        break;
      case 'text':
      default:
        const text = this.generateTextReport(results);
        await fs.writeFile(outputPath, text);
        break;
    }
  }

  generateHTMLReport(results) {
    const severityColors = {
      critical: '#dc3545',
      high: '#fd7e14', 
      medium: '#ffc107',
      low: '#17a2b8'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>FlashFusion Static Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; flex: 1; }
        .finding { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; }
        .critical { border-left-color: ${severityColors.critical}; }
        .high { border-left-color: ${severityColors.high}; }
        .medium { border-left-color: ${severityColors.medium}; }
        .low { border-left-color: ${severityColors.low}; }
        .severity { padding: 2px 8px; border-radius: 3px; color: white; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 FlashFusion Static Analysis Report</h1>
        <p>Generated: ${results.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <h3>Files Scanned</h3>
            <p>${results.stats.filesScanned}</p>
        </div>
        <div class="stat-card">
            <h3>Total Findings</h3>
            <p>${results.findings.length}</p>
        </div>
        <div class="stat-card">
            <h3>Security Issues</h3>
            <p>${results.stats.securityIssues}</p>
        </div>
        <div class="stat-card">
            <h3>Quality Issues</h3>
            <p>${results.stats.qualityIssues}</p>
        </div>
    </div>

    <h2>Findings</h2>
    ${results.findings.map(finding => `
        <div class="finding ${finding.severity}">
            <h3>${finding.title}</h3>
            <span class="severity" style="background-color: ${severityColors[finding.severity]}">${finding.severity.toUpperCase()}</span>
            <p><strong>File:</strong> ${finding.file}:${finding.line || 'N/A'}</p>
            <p><strong>Rule:</strong> ${finding.rule}</p>
            <p><strong>Category:</strong> ${finding.category}</p>
            <p><strong>Description:</strong> ${finding.description}</p>
            ${finding.recommendation ? `<p><strong>💡 Recommendation:</strong> ${finding.recommendation}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  generateTextReport(results) {
    let report = 'FlashFusion Static Analysis Report\n';
    report += '='.repeat(40) + '\n\n';
    report += `Generated: ${results.timestamp}\n`;
    report += `Scan Duration: ${results.duration}ms\n\n`;
    
    report += 'SUMMARY\n';
    report += '-------\n';
    report += `Files scanned: ${results.stats.filesScanned}\n`;
    report += `Total findings: ${results.findings.length}\n`;
    report += `Security issues: ${results.stats.securityIssues}\n`;
    report += `Quality issues: ${results.stats.qualityIssues}\n\n`;
    
    if (results.findings.length > 0) {
      report += 'DETAILED FINDINGS\n';
      report += '-----------------\n\n';
      
      results.findings.forEach((finding, index) => {
        report += `${index + 1}. ${finding.title}\n`;
        report += `   File: ${finding.file}:${finding.line || 'N/A'}\n`;
        report += `   Severity: ${finding.severity.toUpperCase()}\n`;
        report += `   Rule: ${finding.rule}\n`;
        report += `   Category: ${finding.category}\n`;
        report += `   Description: ${finding.description}\n`;
        if (finding.recommendation) {
          report += `   Recommendation: ${finding.recommendation}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }

  listRules() {
    console.log(chalk.bold.blue('📋 Available Analysis Rules'));
    console.log('='.repeat(40));
    
    console.log(chalk.bold('\n🔒 Security Rules:'));
    this.securityRules.listRules().forEach(rule => {
      console.log(`  • ${rule.id}: ${rule.description}`);
    });
    
    console.log(chalk.bold('\n🎯 Quality Rules:'));
    this.qualityRules.listRules().forEach(rule => {
      console.log(`  • ${rule.id}: ${rule.description}`);
    });
  }
}

module.exports = StaticAnalyzer;
#!/usr/bin/env node

/**
 * FlashFusion Dependency Update Agent
 * Automated dependency checking and PR creation for security and updates
 * 
 * @author FlashFusion Team
 * @version 1.0.0
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load environment variables
require('dotenv').config();

// Configuration
const AGENT_VERSION = '1.0.0';
const REPO_ROOT = process.cwd();
const PACKAGES_TO_SCAN = [
    'package.json',
    'apps/*/package.json', 
    'packages/*/package.json',
    'tools/*/package.json'
];

// Color utilities for better output
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
    title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
    command: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`)
};

// Utility functions
const exec = (command, options = {}) => {
    try {
        return execSync(command, { 
            stdio: options.silent ? 'pipe' : 'inherit', 
            encoding: 'utf8',
            ...options 
        });
    } catch (error) {
        if (!options.silent) {
            log.error(`Command failed: ${command}`);
        }
        throw error;
    }
};

const execSilent = (command) => {
    try {
        return execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    } catch (error) {
        return null;
    }
};

/**
 * Find all package.json files in the monorepo
 */
function findPackageJsonFiles() {
    const files = [];
    
    // Add root package.json
    if (fs.existsSync('package.json')) {
        files.push('package.json');
    }
    
    // Find workspace packages
    const workspaceDirs = ['apps', 'packages', 'tools'];
    
    workspaceDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const subdirs = fs.readdirSync(dir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            subdirs.forEach(subdir => {
                const pkgPath = path.join(dir, subdir, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    files.push(pkgPath);
                }
            });
        }
    });
    
    return files;
}

/**
 * Check for outdated dependencies using npm-check-updates
 */
function checkOutdatedDependencies() {
    log.title('🔍 Scanning for Outdated Dependencies');
    
    const packageFiles = findPackageJsonFiles();
    const outdatedPackages = new Map();
    const totalOutdated = { count: 0, packages: [] };
    
    // Check if npm-check-updates is available
    const ncuAvailable = execSilent('npx npm-check-updates --version');
    if (!ncuAvailable) {
        log.warn('npm-check-updates not available. Installing globally...');
        try {
            exec('npm install -g npm-check-updates', { silent: true });
        } catch (error) {
            log.error('Failed to install npm-check-updates. Please install manually: npm i -g npm-check-updates');
            return { outdatedPackages, totalOutdated };
        }
    }
    
    packageFiles.forEach(pkgFile => {
        log.info(`Checking ${pkgFile}...`);
        
        try {
            // Check for outdated dependencies
            const output = execSilent(`npx npm-check-updates --packageFile ${pkgFile} --jsonUpgraded`);
            if (output) {
                const updates = JSON.parse(output);
                if (Object.keys(updates).length > 0) {
                    outdatedPackages.set(pkgFile, updates);
                    totalOutdated.count += Object.keys(updates).length;
                    totalOutdated.packages.push(pkgFile);
                    
                    log.warn(`Found ${Object.keys(updates).length} outdated dependencies in ${pkgFile}`);
                    Object.entries(updates).forEach(([pkg, version]) => {
                        console.log(`  ${colors.yellow}${pkg}${colors.reset}: ${version}`);
                    });
                }
            }
        } catch (error) {
            log.error(`Failed to check ${pkgFile}: ${error.message}`);
        }
    });
    
    return { outdatedPackages, totalOutdated };
}

/**
 * Check for security vulnerabilities using npm audit
 */
function checkVulnerabilities() {
    log.title('🛡️ Scanning for Security Vulnerabilities');
    
    const vulnerabilities = {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        packages: []
    };
    
    try {
        // Run npm audit and capture JSON output
        const auditOutput = execSilent('npm audit --json');
        if (auditOutput) {
            const audit = JSON.parse(auditOutput);
            
            if (audit.metadata && audit.metadata.vulnerabilities) {
                const vulns = audit.metadata.vulnerabilities;
                vulnerabilities.total = vulns.total || 0;
                vulnerabilities.critical = vulns.critical || 0;
                vulnerabilities.high = vulns.high || 0;
                vulnerabilities.moderate = vulns.moderate || 0;
                vulnerabilities.low = vulns.low || 0;
                
                if (audit.vulnerabilities) {
                    vulnerabilities.packages = Object.entries(audit.vulnerabilities).map(([pkg, vuln]) => ({
                        package: pkg,
                        severity: vuln.severity,
                        title: vuln.title,
                        url: vuln.url
                    }));
                }
            }
        }
    } catch (error) {
        log.warn('Unable to run security audit. This may be normal if no vulnerabilities exist.');
    }
    
    if (vulnerabilities.total > 0) {
        log.warn(`Found ${vulnerabilities.total} vulnerabilities:`);
        console.log(`  Critical: ${vulnerabilities.critical}`);
        console.log(`  High: ${vulnerabilities.high}`);
        console.log(`  Moderate: ${vulnerabilities.moderate}`);
        console.log(`  Low: ${vulnerabilities.low}`);
    } else {
        log.success('No security vulnerabilities found!');
    }
    
    return vulnerabilities;
}

/**
 * Create a pull request for dependency updates
 */
async function createPullRequest(branchName, report) {
    log.title('🔀 Creating Pull Request for Dependency Updates');
    
    // Check if GITHUB_TOKEN is available
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        log.warn('No GITHUB_TOKEN found in environment. Cannot create PR automatically.');
        log.info('To create PR manually:');
        log.command(`git push origin ${branchName}`);
        log.command(`gh pr create --title "chore: update dependencies" --body "..."`);
        return null;
    }
    
    try {
        // Get current repository info
        const repoUrl = execSilent('git config --get remote.origin.url');
        if (!repoUrl) {
            log.error('Unable to determine repository URL');
            return null;
        }
        
        // Extract owner and repo from URL
        const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)\.git/);
        if (!match) {
            log.error('Unable to parse repository URL');
            return null;
        }
        
        const [, owner, repo] = match;
        
        // Generate PR title and body
        const title = `chore: update ${report.summary.outdated_dependencies} outdated dependencies`;
        const body = generatePRBody(report);
        
        // Create PR using GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'User-Agent': 'FlashFusion-DependencyAgent/1.0.0'
            },
            body: JSON.stringify({
                title,
                head: branchName,
                base: 'main',
                body,
                draft: false
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            log.error(`Failed to create PR: ${error.message}`);
            return null;
        }
        
        const pr = await response.json();
        log.success(`Pull request created: ${pr.html_url}`);
        return pr;
        
    } catch (error) {
        log.error(`Failed to create PR: ${error.message}`);
        return null;
    }
}

/**
 * Generate PR body content
 */
function generatePRBody(report) {
    const { summary, outdated_dependencies, vulnerabilities } = report;
    
    let body = `## 🔄 Dependency Updates
    
This automated PR updates ${summary.outdated_dependencies} outdated dependencies across ${summary.packages_with_outdated} packages.

### 📊 Update Summary
- **Total packages scanned**: ${summary.total_packages_scanned}
- **Outdated dependencies**: ${summary.outdated_dependencies}
- **Security vulnerabilities**: ${summary.security_vulnerabilities}
- **Critical vulnerabilities**: ${summary.critical_vulnerabilities}

### 📦 Updated Packages
`;

    // List updated packages by file
    Object.entries(outdated_dependencies).forEach(([file, updates]) => {
        body += `\n#### ${file}\n`;
        Object.entries(updates).forEach(([pkg, version]) => {
            body += `- \`${pkg}\`: ${version}\n`;
        });
    });
    
    if (vulnerabilities.total > 0) {
        body += `\n### 🛡️ Security Updates
        
This update addresses ${vulnerabilities.total} security vulnerabilities:
- Critical: ${vulnerabilities.critical}
- High: ${vulnerabilities.high}
- Moderate: ${vulnerabilities.moderate}
- Low: ${vulnerabilities.low}
`;
    }
    
    body += `

### ✅ Testing
- [ ] Build passes
- [ ] Tests pass
- [ ] No breaking changes introduced

### 🤖 Automated by
FlashFusion Dependency Update Agent v${AGENT_VERSION}
Generated on: ${new Date().toISOString()}
`;

    return body;
}
function generateReport(outdatedData, vulnerabilities) {
    log.title('📊 Generating Dependency Update Report');
    
    const timestamp = new Date().toISOString();
    const reportPath = path.join(REPO_ROOT, 'dependency-update-report.json');
    
    const report = {
        timestamp,
        summary: {
            total_packages_scanned: findPackageJsonFiles().length,
            outdated_dependencies: outdatedData.totalOutdated.count,
            packages_with_outdated: outdatedData.totalOutdated.packages.length,
            security_vulnerabilities: vulnerabilities.total,
            critical_vulnerabilities: vulnerabilities.critical
        },
        outdated_dependencies: Object.fromEntries(outdatedData.outdatedPackages),
        vulnerabilities: vulnerabilities,
        recommendations: []
    };
    
    // Add recommendations based on findings
    if (outdatedData.totalOutdated.count > 0) {
        report.recommendations.push({
            type: 'dependency_updates',
            priority: 'medium',
            action: 'Update outdated dependencies to latest versions',
            command: 'npm run update-dependencies'
        });
    }
    
    if (vulnerabilities.critical > 0) {
        report.recommendations.push({
            type: 'security_critical',
            priority: 'high',
            action: 'Address critical security vulnerabilities immediately',
            command: 'npm audit fix --force'
        });
    }
    
    if (vulnerabilities.high > 0) {
        report.recommendations.push({
            type: 'security_high',
            priority: 'high',
            action: 'Address high severity security vulnerabilities',
            command: 'npm audit fix'
        });
    }
    
    // Write report to file
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.success(`Report saved to: ${reportPath}`);
    
    return report;
}

/**
 * Create a branch for dependency updates
 */
function createUpdateBranch() {
    const branchName = `dependency-updates-${new Date().toISOString().split('T')[0]}`;
    
    try {
        // Check if we're in a git repository
        execSilent('git status');
        
        // Create and checkout new branch
        exec(`git checkout -b ${branchName}`, { silent: true });
        log.success(`Created branch: ${branchName}`);
        return branchName;
    } catch (error) {
        log.warn('Not in a git repository or unable to create branch');
        return null;
    }
}

/**
 * Apply dependency updates
 */
function applyUpdates(outdatedData) {
    if (outdatedData.totalOutdated.count === 0) {
        log.info('No updates to apply');
        return false;
    }
    
    log.title('🔄 Applying Dependency Updates');
    
    let updatesApplied = false;
    
    outdatedData.outdatedPackages.forEach((updates, packageFile) => {
        log.info(`Updating dependencies in ${packageFile}...`);
        
        try {
            // Use npm-check-updates to update the package.json file
            exec(`npx npm-check-updates -u --packageFile ${packageFile}`, { silent: true });
            updatesApplied = true;
            log.success(`Updated ${packageFile}`);
        } catch (error) {
            log.error(`Failed to update ${packageFile}: ${error.message}`);
        }
    });
    
    if (updatesApplied) {
        log.info('Installing updated dependencies...');
        try {
            exec('npm install');
            log.success('Dependencies installed successfully');
        } catch (error) {
            log.error('Failed to install updated dependencies. Please run npm install manually.');
        }
    }
    
    return updatesApplied;
}

/**
 * Main dependency update agent function
 */
async function runDependencyUpdateAgent(options = {}) {
    log.title(`🤖 FlashFusion Dependency Update Agent v${AGENT_VERSION}`);
    log.info('Starting dependency analysis...');
    
    // Check for outdated dependencies
    const outdatedData = checkOutdatedDependencies();
    
    // Check for vulnerabilities
    const vulnerabilities = checkVulnerabilities();
    
    // Generate report
    const report = generateReport(outdatedData, vulnerabilities);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    log.title('📋 DEPENDENCY UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Packages scanned: ${report.summary.total_packages_scanned}`);
    console.log(`Outdated dependencies: ${report.summary.outdated_dependencies}`);
    console.log(`Security vulnerabilities: ${report.summary.security_vulnerabilities}`);
    console.log(`Critical vulnerabilities: ${report.summary.critical_vulnerabilities}`);
    console.log('='.repeat(60) + '\n');
    
    // If --apply flag is passed, create PR branch and apply updates
    if (options.apply && outdatedData.totalOutdated.count > 0) {
        const branch = createUpdateBranch();
        if (branch) {
            const applied = applyUpdates(outdatedData);
            if (applied) {
                // Test build after updates
                log.info('Testing build after updates...');
                try {
                    exec('npm run build', { silent: true });
                    log.success('Build successful after updates');
                    
                    // Commit changes
                    exec('git add .', { silent: true });
                    exec(`git commit -m "chore: update ${outdatedData.totalOutdated.count} outdated dependencies"`, { silent: true });
                    
                    // Push branch
                    exec(`git push origin ${branch}`, { silent: true });
                    log.success(`Changes pushed to branch: ${branch}`);
                    
                    // Create PR if GitHub token is available
                    const pr = await createPullRequest(branch, report);
                    if (pr) {
                        log.success(`🎉 Dependency update PR created successfully!`);
                        log.info(`PR URL: ${pr.html_url}`);
                    }
                    
                } catch (error) {
                    log.error(`Build failed after updates: ${error.message}`);
                    log.warn('Rolling back changes...');
                    exec('git checkout .', { silent: true });
                }
            }
        }
    }
    
    return report;
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        apply: args.includes('--apply') || args.includes('-a'),
        help: args.includes('--help') || args.includes('-h')
    };
    
    if (options.help) {
        console.log(`
${colors.bright}FlashFusion Dependency Update Agent v${AGENT_VERSION}${colors.reset}

Usage: node dependency-update-agent.js [options]

Options:
  --apply, -a    Apply updates and create branch for PR
  --help, -h     Show this help message

Examples:
  node dependency-update-agent.js              # Check for updates (dry run)
  node dependency-update-agent.js --apply      # Check and apply updates
        `);
        process.exit(0);
    }
    
    (async () => {
        try {
            await runDependencyUpdateAgent(options);
        } catch (error) {
            log.error(`Agent failed: ${error.message}`);
            process.exit(1);
        }
    })();
}

module.exports = { runDependencyUpdateAgent };
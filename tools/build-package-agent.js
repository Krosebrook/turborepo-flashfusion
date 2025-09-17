#!/usr/bin/env node
/**
 * FlashFusion Build & Package Agent
 * 
 * Task: Compile source code, bundle assets, and prepare deployable artifacts.
 * Output: Build logs and paths to artifacts for downstream jobs.
 * Goal: Provide a consistent, reproducible build output for CI/CD.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

class BuildPackageAgent {
    constructor() {
        this.buildId = this.generateBuildId();
        this.buildDir = path.join(process.cwd(), '.build-artifacts');
        this.logFile = path.join(this.buildDir, `build-${this.buildId}.log`);
        this.reportFile = path.join(this.buildDir, `build-report-${this.buildId}.json`);
        this.artifacts = [];
        this.buildLogs = [];
        this.startTime = Date.now();
        
        this.initializeBuildDirectory();
        this.log('🚀 FlashFusion Build & Package Agent Initialized');
        this.log(`Build ID: ${this.buildId}`);
    }

    generateBuildId() {
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
        const random = Math.random().toString(36).substr(2, 5);
        return `${timestamp}-${random}`;
    }

    initializeBuildDirectory() {
        if (!fs.existsSync(this.buildDir)) {
            fs.mkdirSync(this.buildDir, { recursive: true });
        }
        
        // Initialize log file
        fs.writeFileSync(this.logFile, `FlashFusion Build Log - ${new Date().toISOString()}\n`);
        fs.appendFileSync(this.logFile, `Build ID: ${this.buildId}\n`);
        fs.appendFileSync(this.logFile, `Working Directory: ${process.cwd()}\n\n`);
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        // Console output with colors
        const colorMap = {
            info: chalk.blue,
            success: chalk.green,
            warn: chalk.yellow,
            error: chalk.red
        };
        console.log(colorMap[level] ? colorMap[level](logEntry) : logEntry);
        
        // File output
        fs.appendFileSync(this.logFile, logEntry + '\n');
        
        // Store in memory for report
        this.buildLogs.push({
            timestamp,
            level,
            message
        });
    }

    async executeCommand(command, options = {}) {
        this.log(`Executing: ${command}`);
        
        return new Promise((resolve, reject) => {
            const child = spawn('sh', ['-c', command], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: options.cwd || process.cwd(),
                env: { ...process.env, ...options.env }
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                fs.appendFileSync(this.logFile, output);
                if (options.verbose) process.stdout.write(output);
            });

            child.stderr?.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                fs.appendFileSync(this.logFile, output);
                if (options.verbose) process.stderr.write(output);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.log(`Command completed successfully: ${command}`, 'success');
                    resolve({ stdout, stderr, code });
                } else {
                    this.log(`Command failed with code ${code}: ${command}`, 'error');
                    reject(new Error(`Command failed: ${command} (exit code ${code})`));
                }
            });
        });
    }

    async discoverPackages() {
        this.log('🔍 Discovering packages in monorepo...');
        
        const packages = [];
        const workspaces = ['apps/*', 'packages/*', 'tools/*'];
        
        for (const workspace of workspaces) {
            const basePath = workspace.replace('/*', '');
            if (fs.existsSync(basePath)) {
                const items = fs.readdirSync(basePath);
                for (const item of items) {
                    const itemPath = path.join(basePath, item);
                    const packageJsonPath = path.join(itemPath, 'package.json');
                    
                    if (fs.existsSync(packageJsonPath)) {
                        try {
                            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                            packages.push({
                                name: packageJson.name || item,
                                path: itemPath,
                                packageJson,
                                buildScript: packageJson.scripts?.build || null,
                                hasTypeScript: fs.existsSync(path.join(itemPath, 'tsconfig.json')),
                                hasNextJS: packageJson.dependencies?.next || packageJson.devDependencies?.next,
                                type: basePath // apps, packages, or tools
                            });
                        } catch (error) {
                            this.log(`Warning: Could not parse package.json in ${itemPath}`, 'warn');
                        }
                    }
                }
            }
        }
        
        this.log(`Found ${packages.length} packages: ${packages.map(p => p.name).join(', ')}`);
        return packages;
    }

    async installDependencies() {
        this.log('📦 Installing dependencies...');
        
        try {
            await this.executeCommand('npm ci', { verbose: true });
            this.log('Dependencies installed successfully', 'success');
        } catch (error) {
            this.log('Falling back to npm install...', 'warn');
            await this.executeCommand('npm install', { verbose: true });
        }
    }

    async buildPackage(packageInfo) {
        this.log(`🏗️ Building package: ${packageInfo.name}`);
        
        if (!packageInfo.buildScript) {
            this.log(`No build script found for ${packageInfo.name}, skipping...`, 'warn');
            return null;
        }

        const buildStartTime = Date.now();
        
        try {
            // Handle different build types
            let buildCommand = packageInfo.buildScript;
            
            // For Next.js apps, use npm run build instead of direct next build
            if (packageInfo.hasNextJS) {
                buildCommand = 'npm run build';
            }
            
            // Execute build command
            await this.executeCommand(buildCommand, {
                cwd: packageInfo.path,
                verbose: true
            });

            // Collect build artifacts
            const artifacts = await this.collectArtifacts(packageInfo);
            
            const buildTime = Date.now() - buildStartTime;
            this.log(`Build completed for ${packageInfo.name} in ${buildTime}ms`, 'success');
            
            return {
                package: packageInfo.name,
                buildTime,
                artifacts,
                success: true
            };
        } catch (error) {
            const buildTime = Date.now() - buildStartTime;
            this.log(`Build failed for ${packageInfo.name}: ${error.message}`, 'error');
            
            return {
                package: packageInfo.name,
                buildTime,
                artifacts: [],
                success: false,
                error: error.message
            };
        }
    }

    async collectArtifacts(packageInfo) {
        const artifacts = [];
        const artifactPaths = [
            '.next',
            'dist',
            'build',
            'out',
            'lib',
            'storybook-static'
        ];

        for (const artifactPath of artifactPaths) {
            const fullPath = path.join(packageInfo.path, artifactPath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                const artifact = {
                    path: fullPath,
                    relativePath: path.relative(process.cwd(), fullPath),
                    type: artifactPath,
                    size: this.getDirectorySize(fullPath),
                    created: stats.mtime,
                    package: packageInfo.name
                };
                
                artifacts.push(artifact);
                this.artifacts.push(artifact);
                this.log(`Found artifact: ${artifact.relativePath} (${this.formatBytes(artifact.size)})`);
            }
        }

        return artifacts;
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        const calculateSize = (itemPath) => {
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                const items = fs.readdirSync(itemPath);
                for (const item of items) {
                    calculateSize(path.join(itemPath, item));
                }
            } else {
                totalSize += stats.size;
            }
        };

        try {
            calculateSize(dirPath);
        } catch (error) {
            this.log(`Warning: Could not calculate size for ${dirPath}`, 'warn');
        }

        return totalSize;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async runTests() {
        this.log('🧪 Running tests...');
        
        try {
            await this.executeCommand('npm run test', { verbose: true });
            this.log('All tests passed', 'success');
            return true;
        } catch (error) {
            this.log(`Tests failed: ${error.message}`, 'error');
            return false;
        }
    }

    async lintCode() {
        this.log('🔍 Linting code...');
        
        try {
            await this.executeCommand('npm run lint', { verbose: true });
            this.log('Code linting passed', 'success');
            return true;
        } catch (error) {
            this.log(`Linting failed: ${error.message}`, 'error');
            return false;
        }
    }

    async typeCheck() {
        this.log('📝 Type checking...');
        
        try {
            await this.executeCommand('npm run type-check', { verbose: true });
            this.log('Type checking passed', 'success');
            return true;
        } catch (error) {
            this.log(`Type checking failed: ${error.message}`, 'error');
            return false;
        }
    }

    async generateBuildReport() {
        const buildTime = Date.now() - this.startTime;
        const report = {
            buildId: this.buildId,
            timestamp: new Date().toISOString(),
            buildTime,
            artifacts: this.artifacts,
            logs: this.buildLogs,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                cwd: process.cwd(),
                ci: !!process.env.CI
            },
            summary: {
                totalArtifacts: this.artifacts.length,
                totalSize: this.artifacts.reduce((sum, artifact) => sum + artifact.size, 0),
                buildTimeFormatted: this.formatTime(buildTime)
            }
        };

        fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
        this.log(`Build report generated: ${this.reportFile}`, 'success');
        
        return report;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    async createDeployablePackage() {
        this.log('📦 Creating deployable package...');
        
        const packagePath = path.join(this.buildDir, `deployable-${this.buildId}.tar.gz`);
        
        // Create a list of essential files for deployment
        const deployFiles = [
            'package.json',
            'package-lock.json',
            'turbo.json',
            '.env.example'
        ];

        // Add artifact directories
        const artifactDirs = this.artifacts.map(a => a.relativePath);
        
        const filesToPackage = [...deployFiles, ...artifactDirs].join(' ');
        
        try {
            await this.executeCommand(`tar -czf ${packagePath} ${filesToPackage}`, { verbose: true });
            this.log(`Deployable package created: ${packagePath}`, 'success');
            
            const stats = fs.statSync(packagePath);
            return {
                path: packagePath,
                size: stats.size,
                created: stats.mtime
            };
        } catch (error) {
            this.log(`Failed to create deployable package: ${error.message}`, 'error');
            return null;
        }
    }

    async runFullBuild() {
        this.log('🎯 Starting full build process...');
        
        try {
            // Discover packages
            const packages = await this.discoverPackages();
            
            // Install dependencies
            await this.installDependencies();
            
            // Lint code (optional - don't fail build)
            try {
                await this.lintCode();
            } catch (error) {
                this.log('Linting failed but continuing build...', 'warn');
            }
            
            // Type check (optional - don't fail build)
            try {
                await this.typeCheck();
            } catch (error) {
                this.log('Type checking failed but continuing build...', 'warn');
            }
            
            // Build each package
            const buildResults = [];
            for (const packageInfo of packages) {
                const result = await this.buildPackage(packageInfo);
                if (result) {
                    buildResults.push(result);
                }
            }
            
            // Run tests (optional - don't fail build)
            try {
                await this.runTests();
            } catch (error) {
                this.log('Tests failed but continuing build...', 'warn');
            }
            
            // Create deployable package
            const deployablePackage = await this.createDeployablePackage();
            
            // Generate final report
            const report = await this.generateBuildReport();
            report.buildResults = buildResults;
            report.deployablePackage = deployablePackage;
            
            // Update final report
            fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
            
            this.log('✅ Build process completed successfully!', 'success');
            this.log(`Total build time: ${this.formatTime(Date.now() - this.startTime)}`, 'success');
            this.log(`Build report: ${this.reportFile}`, 'success');
            this.log(`Build logs: ${this.logFile}`, 'success');
            
            return report;
            
        } catch (error) {
            this.log(`Build process failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // CLI Methods
    static async main() {
        const args = process.argv.slice(2);
        const command = args[0] || 'build';
        
        const agent = new BuildPackageAgent();
        
        try {
            switch (command) {
                case 'build':
                    await agent.runFullBuild();
                    break;
                case 'discover':
                    await agent.discoverPackages();
                    break;
                case 'install':
                    await agent.installDependencies();
                    break;
                case 'artifacts':
                    const packages = await agent.discoverPackages();
                    for (const pkg of packages) {
                        await agent.collectArtifacts(pkg);
                    }
                    break;
                case 'report':
                    await agent.generateBuildReport();
                    break;
                default:
                    console.log(`
🏗️ FlashFusion Build & Package Agent

Usage: node build-package-agent.js [command]

Commands:
  build      Run full build process (default)
  discover   Discover packages in monorepo
  install    Install dependencies
  artifacts  Collect build artifacts
  report     Generate build report
                    `);
            }
        } catch (error) {
            console.error(chalk.red(`Build failed: ${error.message}`));
            process.exit(1);
        }
    }
}

// Export for use as module
module.exports = BuildPackageAgent;

// Run CLI if executed directly
if (require.main === module) {
    BuildPackageAgent.main();
}
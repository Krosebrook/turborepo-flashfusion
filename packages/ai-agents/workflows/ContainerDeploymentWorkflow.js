/**
 * Container Deployment Workflow
 * Orchestrates the container building and publishing process using the Container Publish Agent
 */

const { ContainerPublishAgent } = require('../../core/ContainerPublishAgent');
const logger = console;

class ContainerDeploymentWorkflow {
    constructor(config = {}) {
        this.agent = new ContainerPublishAgent(config);
        this.workflowId = null;
        this.deploymentTargets = {
            'development': {
                registry: 'localhost:5000',
                tags: ['dev', 'latest'],
                push: false  // Local builds only
            },
            'staging': {
                registry: 'ghcr.io',
                tags: ['staging', 'v${version}'],
                push: true
            },
            'production': {
                registry: 'docker.io',
                tags: ['latest', 'v${version}', 'stable'],
                push: true
            }
        };
    }

    /**
     * Initialize the workflow
     */
    async initialize() {
        try {
            logger.info('🚀 Initializing Container Deployment Workflow...');
            
            const initResult = await this.agent.initialize();
            if (!initResult.success) {
                throw new Error(`Agent initialization failed: ${initResult.error}`);
            }

            this.workflowId = this.generateWorkflowId();
            logger.info(`✅ Container Deployment Workflow initialized: ${this.workflowId}`);
            
            return { success: true, workflowId: this.workflowId };
        } catch (error) {
            logger.error('❌ Failed to initialize Container Deployment Workflow:', error);
            throw error;
        }
    }

    /**
     * Execute deployment workflow for a specific environment
     */
    async deployToEnvironment(environment, options = {}) {
        try {
            const target = this.deploymentTargets[environment];
            if (!target) {
                throw new Error(`Unknown deployment environment: ${environment}`);
            }

            logger.info(`🚀 Starting deployment to ${environment}...`);

            const {
                sourcePath = process.cwd(),
                imageName = options.imageName || this.extractImageNameFromPath(sourcePath),
                version = options.version || await this.getVersionFromPackage(sourcePath),
                dockerfile = 'Dockerfile',
                buildArgs = {},
                ...customOptions
            } = options;

            // Prepare deployment configuration
            const deployConfig = {
                sourcePath,
                imageName,
                tags: this.processTags(target.tags, { version }),
                dockerfile,
                buildArgs: {
                    NODE_ENV: environment,
                    BUILD_VERSION: version,
                    BUILD_DATE: new Date().toISOString(),
                    ...buildArgs
                },
                registry: target.registry,
                push: target.push,
                ...customOptions
            };

            logger.info(`📋 Deployment configuration:`, {
                environment,
                imageName: deployConfig.imageName,
                tags: deployConfig.tags,
                registry: deployConfig.registry,
                push: deployConfig.push
            });

            // Execute the build and deployment
            const result = await this.agent.buildImage(deployConfig);

            const deploymentResult = {
                success: true,
                workflowId: this.workflowId,
                environment,
                deployment: result,
                timestamp: new Date().toISOString()
            };

            logger.info(`✅ Successfully deployed to ${environment}`);
            return deploymentResult;

        } catch (error) {
            logger.error(`❌ Deployment to ${environment} failed:`, error);
            throw error;
        }
    }

    /**
     * Deploy to multiple environments in sequence
     */
    async deployToMultipleEnvironments(environments, options = {}) {
        const results = [];
        const errors = [];

        for (const environment of environments) {
            try {
                const result = await this.deployToEnvironment(environment, options);
                results.push(result);
                logger.info(`✅ ${environment} deployment completed`);
            } catch (error) {
                const errorInfo = {
                    environment,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                errors.push(errorInfo);
                logger.error(`❌ ${environment} deployment failed:`, error.message);
                
                // Continue with other environments unless critical failure
                if (options.stopOnError) {
                    break;
                }
            }
        }

        return {
            success: errors.length === 0,
            results,
            errors,
            workflowId: this.workflowId
        };
    }

    /**
     * Execute CI/CD pipeline deployment
     */
    async executeCIPipeline(options = {}) {
        const {
            branch = 'main',
            environment = this.inferEnvironmentFromBranch(branch),
            runTests = true,
            ...deployOptions
        } = options;

        try {
            logger.info(`🔄 Starting CI/CD pipeline for branch: ${branch}`);

            // Run tests if requested
            if (runTests) {
                await this.runTests(deployOptions.sourcePath);
            }

            // Deploy to appropriate environment
            const result = await this.deployToEnvironment(environment, deployOptions);

            logger.info(`✅ CI/CD pipeline completed successfully`);
            return result;

        } catch (error) {
            logger.error(`❌ CI/CD pipeline failed:`, error);
            throw error;
        }
    }

    /**
     * Run tests before deployment
     */
    async runTests(sourcePath = process.cwd()) {
        try {
            logger.info('🧪 Running tests before deployment...');
            
            const { execSync } = require('child_process');
            
            // Check if package.json exists and has test script
            const packagePath = require('path').join(sourcePath, 'package.json');
            if (require('fs').existsSync(packagePath)) {
                const pkg = JSON.parse(require('fs').readFileSync(packagePath, 'utf8'));
                if (pkg.scripts && pkg.scripts.test) {
                    execSync('npm test', { 
                        cwd: sourcePath, 
                        stdio: 'inherit',
                        timeout: 300000 // 5 minutes
                    });
                    logger.info('✅ Tests passed');
                    return;
                }
            }
            
            logger.info('ℹ️ No test script found, skipping tests');
        } catch (error) {
            throw new Error(`Tests failed: ${error.message}`);
        }
    }

    /**
     * Process tags with variable substitution
     */
    processTags(tags, variables) {
        return tags.map(tag => {
            let processedTag = tag;
            for (const [key, value] of Object.entries(variables)) {
                processedTag = processedTag.replace(`\${${key}}`, value);
            }
            return processedTag;
        });
    }

    /**
     * Extract image name from source path
     */
    extractImageNameFromPath(sourcePath) {
        const path = require('path');
        const packageJsonPath = path.join(sourcePath, 'package.json');
        
        try {
            if (require('fs').existsSync(packageJsonPath)) {
                const pkg = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
                return pkg.name || path.basename(sourcePath);
            }
        } catch (error) {
            // Fallback to directory name
        }
        
        return path.basename(sourcePath);
    }

    /**
     * Get version from package.json
     */
    async getVersionFromPackage(sourcePath) {
        const path = require('path');
        const packageJsonPath = path.join(sourcePath, 'package.json');
        
        try {
            if (require('fs').existsSync(packageJsonPath)) {
                const pkg = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
                return pkg.version || '1.0.0';
            }
        } catch (error) {
            logger.warn('Could not read version from package.json:', error.message);
        }
        
        return '1.0.0';
    }

    /**
     * Infer environment from branch name
     */
    inferEnvironmentFromBranch(branch) {
        if (branch === 'main' || branch === 'master') {
            return 'production';
        } else if (branch === 'develop' || branch === 'staging') {
            return 'staging';
        } else {
            return 'development';
        }
    }

    /**
     * Generate unique workflow ID
     */
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    /**
     * Get workflow status
     */
    getStatus() {
        return {
            workflowId: this.workflowId,
            agent: this.agent.getStatus(),
            deploymentTargets: Object.keys(this.deploymentTargets)
        };
    }

    /**
     * Get deployment history
     */
    getDeploymentHistory() {
        // This would typically fetch from a database or log file
        // For now, return current agent tasks
        return this.agent.getActiveTasks();
    }
}

module.exports = { ContainerDeploymentWorkflow };
/**
 * Container Publish Agent - AI Agent for Docker image building and registry publishing
 * Part of the FlashFusion AI Agent Ecosystem
 */

const { EventEmitter } = require('events');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = console;

class ContainerPublishAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.id = 'container_publisher';
        this.name = 'Container Publish Agent';
        this.role = 'DevOps automation for container building and publishing';
        this.capabilities = [
            'docker_build',
            'image_tagging',
            'registry_push',
            'multi_registry_support',
            'build_optimization'
        ];
        this.status = 'idle';
        this.config = {
            defaultRegistry: config.defaultRegistry || 'docker.io',
            buildTimeout: config.buildTimeout || 900000, // 15 minutes
            retryAttempts: config.retryAttempts || 3,
            buildArgs: config.buildArgs || {},
            ...config
        };
        this.activeBuildTasks = new Map();
    }

    /**
     * Initialize the Container Publish Agent
     */
    async initialize() {
        try {
            logger.info('🐳 Initializing Container Publish Agent...');
            
            // Verify Docker is available
            await this.verifyDockerAvailable();
            
            // Setup registry configurations
            this.setupRegistryConfigs();
            
            this.status = 'ready';
            logger.info('✅ Container Publish Agent initialized successfully');
            
            this.emit('agent_ready', {
                agentId: this.id,
                capabilities: this.capabilities,
                status: this.status
            });
            
            return { success: true, agent: this.id, capabilities: this.capabilities };
        } catch (error) {
            this.status = 'error';
            logger.error('❌ Failed to initialize Container Publish Agent:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify Docker is available and accessible
     */
    async verifyDockerAvailable() {
        try {
            execSync('docker --version', { stdio: 'pipe' });
            execSync('docker info', { stdio: 'pipe' });
            logger.info('✅ Docker is available and running');
        } catch (error) {
            throw new Error('Docker is not available or not running. Please install Docker and ensure it\'s running.');
        }
    }

    /**
     * Setup registry configurations
     */
    setupRegistryConfigs() {
        this.registries = {
            'docker.io': {
                name: 'Docker Hub',
                url: 'docker.io',
                authRequired: true
            },
            'ghcr.io': {
                name: 'GitHub Container Registry',
                url: 'ghcr.io',
                authRequired: true
            },
            'gcr.io': {
                name: 'Google Container Registry',
                url: 'gcr.io',
                authRequired: true
            },
            'local': {
                name: 'Local Registry',
                url: 'localhost:5000',
                authRequired: false
            }
        };
    }

    /**
     * Build Docker image from source code
     * @param {Object} buildRequest - Build configuration
     * @returns {Promise<Object>} Build result with image tags and metadata
     */
    async buildImage(buildRequest) {
        const taskId = this.generateTaskId();
        
        try {
            this.status = 'building';
            logger.info(`🔨 Starting Docker build task: ${taskId}`);
            
            const {
                sourcePath,
                imageName,
                tags = ['latest'],
                dockerfile = 'Dockerfile',
                buildArgs = {},
                registry = this.config.defaultRegistry,
                context = '.',
                push = true
            } = buildRequest;

            // Validate required parameters
            this.validateBuildRequest(buildRequest);

            // Create build task tracking
            const buildTask = {
                id: taskId,
                imageName,
                tags,
                registry,
                startTime: new Date(),
                status: 'building'
            };
            this.activeBuildTasks.set(taskId, buildTask);

            // Build the Docker image
            const buildResult = await this.executeBuild({
                sourcePath,
                imageName,
                tags,
                dockerfile,
                buildArgs,
                registry,
                context
            });

            // Push to registry if requested
            let pushResults = [];
            if (push) {
                pushResults = await this.pushToRegistry({
                    imageName,
                    tags,
                    registry
                });
            }

            // Complete the task
            const finalResult = {
                success: true,
                taskId,
                imageName,
                tags: buildResult.tags,
                registry,
                registryUrls: pushResults.map(r => r.url),
                buildTime: Date.now() - buildTask.startTime,
                imageSize: buildResult.imageSize,
                imageId: buildResult.imageId,
                metadata: {
                    buildDate: new Date().toISOString(),
                    sourceCommit: await this.getSourceCommit(sourcePath),
                    buildArgs,
                    dockerfile
                }
            };

            buildTask.status = 'completed';
            buildTask.result = finalResult;
            this.status = 'ready';
            
            logger.info(`✅ Successfully built and published: ${imageName}`);
            this.emit('build_completed', finalResult);
            
            return finalResult;

        } catch (error) {
            this.status = 'error';
            logger.error(`❌ Build failed for task ${taskId}:`, error);
            
            const errorResult = {
                success: false,
                taskId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.emit('build_failed', errorResult);
            throw error;
        } finally {
            this.status = 'ready';
        }
    }

    /**
     * Validate build request parameters
     */
    validateBuildRequest(request) {
        const required = ['sourcePath', 'imageName'];
        for (const field of required) {
            if (!request[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!fs.existsSync(request.sourcePath)) {
            throw new Error(`Source path does not exist: ${request.sourcePath}`);
        }

        const dockerfilePath = path.join(request.sourcePath, request.dockerfile || 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
            throw new Error(`Dockerfile not found: ${dockerfilePath}`);
        }
    }

    /**
     * Execute Docker build command
     */
    async executeBuild({ sourcePath, imageName, tags, dockerfile, buildArgs, registry, context }) {
        const fullImageName = `${registry}/${imageName}`;
        const taggedImages = tags.map(tag => `${fullImageName}:${tag}`);
        
        // Prepare build arguments
        const buildArgsString = Object.entries(buildArgs)
            .map(([key, value]) => `--build-arg ${key}=${value}`)
            .join(' ');

        // Prepare tag arguments
        const tagArgsString = taggedImages
            .map(tag => `-t ${tag}`)
            .join(' ');

        const buildCommand = [
            'docker build',
            `-f ${dockerfile}`,
            tagArgsString,
            buildArgsString,
            context
        ].filter(Boolean).join(' ');

        logger.info(`📦 Building: ${buildCommand}`);

        try {
            // Execute build with timeout
            const output = await this.executeWithTimeout(buildCommand, {
                cwd: sourcePath,
                timeout: this.config.buildTimeout
            });

            // Get image information
            const imageInfo = await this.getImageInfo(taggedImages[0]);

            return {
                tags: taggedImages,
                imageId: imageInfo.id,
                imageSize: imageInfo.size,
                buildOutput: output
            };
        } catch (error) {
            throw new Error(`Docker build failed: ${error.message}`);
        }
    }

    /**
     * Push images to registry
     */
    async pushToRegistry({ imageName, tags, registry }) {
        const fullImageName = `${registry}/${imageName}`;
        const pushResults = [];

        for (const tag of tags) {
            const taggedImage = `${fullImageName}:${tag}`;
            
            try {
                logger.info(`📤 Pushing ${taggedImage} to registry...`);
                
                const pushCommand = `docker push ${taggedImage}`;
                await this.executeWithTimeout(pushCommand, {
                    timeout: this.config.buildTimeout
                });

                pushResults.push({
                    tag,
                    url: `${registry}/${imageName}:${tag}`,
                    status: 'success'
                });

                logger.info(`✅ Successfully pushed ${taggedImage}`);
            } catch (error) {
                logger.error(`❌ Failed to push ${taggedImage}:`, error);
                pushResults.push({
                    tag,
                    url: `${registry}/${imageName}:${tag}`,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return pushResults;
    }

    /**
     * Get image information
     */
    async getImageInfo(imageName) {
        try {
            const output = execSync(`docker inspect ${imageName} --format="{{.Id}} {{.Size}}"`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            const [id, size] = output.trim().split(' ');
            return {
                id: id.replace('sha256:', '').substring(0, 12),
                size: parseInt(size) || 0
            };
        } catch (error) {
            return { id: 'unknown', size: 0 };
        }
    }

    /**
     * Get source commit hash if in git repository
     */
    async getSourceCommit(sourcePath) {
        try {
            const output = execSync('git rev-parse HEAD', {
                cwd: sourcePath,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            return output.trim().substring(0, 8);
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Execute command with timeout
     */
    async executeWithTimeout(command, options = {}) {
        const { timeout = this.config.buildTimeout, ...execOptions } = options;
        
        return new Promise((resolve, reject) => {
            try {
                const output = execSync(command, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout,
                    ...execOptions
                });
                resolve(output);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `build_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    /**
     * Get build task status
     */
    getBuildStatus(taskId) {
        return this.activeBuildTasks.get(taskId) || null;
    }

    /**
     * List all active build tasks
     */
    getActiveTasks() {
        return Array.from(this.activeBuildTasks.values());
    }

    /**
     * Registry authentication (placeholder for future implementation)
     */
    async authenticateRegistry(registryConfig) {
        // This would implement registry-specific authentication
        // For now, assumes docker login has been done externally
        logger.info(`Registry authentication for ${registryConfig.name} (external login required)`);
        return { success: true };
    }

    /**
     * Get agent status and capabilities
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            status: this.status,
            capabilities: this.capabilities,
            activeTasks: this.getActiveTasks().length,
            registries: Object.keys(this.registries)
        };
    }
}

module.exports = { ContainerPublishAgent };
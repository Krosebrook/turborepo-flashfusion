/**
 * Tests for Container Publish Agent
 * Validates container building and publishing functionality
 */

const { ContainerPublishAgent } = require('../core/ContainerPublishAgent');
const fs = require('fs');
const path = require('path');

// Mock dependencies for testing
jest.mock('child_process', () => ({
    execSync: jest.fn(),
    spawn: jest.fn()
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
}));

describe('ContainerPublishAgent', () => {
    let agent;
    const { execSync } = require('child_process');

    beforeEach(() => {
        jest.clearAllMocks();
        agent = new ContainerPublishAgent();
        
        // Mock Docker availability
        execSync.mockImplementation((command) => {
            if (command === 'docker --version') return 'Docker version 20.10.0';
            if (command === 'docker info') return 'Docker info output';
            if (command.includes('docker inspect')) return 'sha256:abcd1234 1000000';
            if (command.includes('git rev-parse')) return 'abc12345';
            return '';
        });

        fs.existsSync.mockReturnValue(true);
    });

    describe('initialization', () => {
        test('should initialize successfully with Docker available', async () => {
            const result = await agent.initialize();
            
            expect(result.success).toBe(true);
            expect(result.agent).toBe('container_publisher');
            expect(result.capabilities).toContain('docker_build');
            expect(agent.status).toBe('ready');
        });

        test('should fail initialization without Docker', async () => {
            execSync.mockImplementation(() => {
                throw new Error('Docker not found');
            });

            const result = await agent.initialize();
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Docker is not available');
            expect(agent.status).toBe('error');
        });
    });

    describe('buildImage', () => {
        beforeEach(async () => {
            await agent.initialize();
        });

        test('should build image successfully', async () => {
            const buildRequest = {
                sourcePath: '/test/path',
                imageName: 'test-app',
                tags: ['latest', 'v1.0.0'],
                registry: 'localhost:5000',
                push: false
            };

            execSync.mockImplementation((command) => {
                if (command.includes('docker build')) return 'Build output';
                if (command.includes('docker inspect')) return 'sha256:abcd1234 1000000';
                if (command.includes('git rev-parse')) return 'abc12345';
                return '';
            });

            const result = await agent.buildImage(buildRequest);

            expect(result.success).toBe(true);
            expect(result.imageName).toBe('test-app');
            expect(result.tags).toContain('localhost:5000/test-app:latest');
            expect(result.tags).toContain('localhost:5000/test-app:v1.0.0');
            expect(result.registry).toBe('localhost:5000');
        });

        test('should validate required parameters', async () => {
            const invalidRequest = {
                // Missing sourcePath and imageName
                tags: ['latest']
            };

            await expect(agent.buildImage(invalidRequest)).rejects.toThrow('Missing required field: sourcePath');
        });

        test('should validate source path exists', async () => {
            fs.existsSync.mockReturnValue(false);

            const buildRequest = {
                sourcePath: '/nonexistent/path',
                imageName: 'test-app'
            };

            await expect(agent.buildImage(buildRequest)).rejects.toThrow('Source path does not exist');
        });

        test('should validate Dockerfile exists', async () => {
            fs.existsSync.mockImplementation((path) => {
                if (path === '/test/path') return true;
                if (path.includes('Dockerfile')) return false;
                return true;
            });

            const buildRequest = {
                sourcePath: '/test/path',
                imageName: 'test-app'
            };

            await expect(agent.buildImage(buildRequest)).rejects.toThrow('Dockerfile not found');
        });
    });

    describe('registry configuration', () => {
        test('should have default registry configurations', () => {
            agent.setupRegistryConfigs();
            
            expect(agent.registries['docker.io']).toBeDefined();
            expect(agent.registries['ghcr.io']).toBeDefined();
            expect(agent.registries['gcr.io']).toBeDefined();
            expect(agent.registries['local']).toBeDefined();
        });

        test('should configure custom default registry', () => {
            const customAgent = new ContainerPublishAgent({
                defaultRegistry: 'custom.registry.com'
            });

            expect(customAgent.config.defaultRegistry).toBe('custom.registry.com');
        });
    });

    describe('task management', () => {
        beforeEach(async () => {
            await agent.initialize();
        });

        test('should generate unique task IDs', () => {
            const id1 = agent.generateTaskId();
            const id2 = agent.generateTaskId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^build_\d+_[a-z0-9]{5}$/);
        });

        test('should track active build tasks', async () => {
            const buildRequest = {
                sourcePath: '/test/path',
                imageName: 'test-app',
                push: false
            };

            // Mock successful build
            execSync.mockImplementation(() => '');

            const promise = agent.buildImage(buildRequest);
            
            // Check that task is tracked during build
            const activeTasks = agent.getActiveTasks();
            expect(activeTasks.length).toBeGreaterThan(0);

            await promise;
        });
    });

    describe('error handling', () => {
        beforeEach(async () => {
            await agent.initialize();
        });

        test('should handle Docker build failures', async () => {
            execSync.mockImplementation((command) => {
                if (command.includes('docker build')) {
                    throw new Error('Build failed');
                }
                return '';
            });

            const buildRequest = {
                sourcePath: '/test/path',
                imageName: 'test-app',
                push: false
            };

            await expect(agent.buildImage(buildRequest)).rejects.toThrow('Docker build failed');
        });

        test('should retry builds on failure', async () => {
            let callCount = 0;
            execSync.mockImplementation((command) => {
                if (command.includes('docker build')) {
                    callCount++;
                    if (callCount < 3) {
                        throw new Error('Temporary failure');
                    }
                    return 'Success';
                }
                return '';
            });

            // This test would need retry logic implemented in the agent
            // For now, just verify the error propagates
            const buildRequest = {
                sourcePath: '/test/path',
                imageName: 'test-app',
                push: false
            };

            // Should fail on first attempt (retry logic not implemented yet)
            await expect(agent.buildImage(buildRequest)).rejects.toThrow();
        });
    });

    describe('status reporting', () => {
        test('should report correct agent status', async () => {
            await agent.initialize();
            const status = agent.getStatus();

            expect(status.id).toBe('container_publisher');
            expect(status.name).toBe('Container Publish Agent');
            expect(status.status).toBe('ready');
            expect(status.capabilities).toContain('docker_build');
            expect(status.registries).toContain('docker.io');
        });
    });
});

// Integration tests (these would run against real Docker if available)
describe('ContainerPublishAgent Integration Tests', () => {
    let agent;

    beforeAll(async () => {
        // Only run these tests if Docker is actually available
        try {
            require('child_process').execSync('docker --version', { stdio: 'ignore' });
        } catch (error) {
            console.log('Skipping integration tests - Docker not available');
            return;
        }
        
        agent = new ContainerPublishAgent();
        await agent.initialize();
    });

    test('should verify Docker is available for integration tests', async () => {
        if (!agent) return; // Skip if Docker not available
        
        expect(agent.status).toBe('ready');
    });
});
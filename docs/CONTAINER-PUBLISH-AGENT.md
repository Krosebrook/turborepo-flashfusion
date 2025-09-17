# Container Publish Agent

The Container Publish Agent is an AI-powered DevOps automation agent that handles Docker image building and publishing to container registries. It's part of the FlashFusion AI Agent ecosystem and provides seamless container deployment workflows.

## Features

- 🐳 **Docker Image Building**: Automated Docker image creation from source code
- 🏷️ **Smart Tagging**: Intelligent image tagging strategies
- 🌐 **Multi-Registry Support**: Supports Docker Hub, GitHub Container Registry, Google Container Registry, and private registries  
- 📦 **Build Optimization**: Efficient build processes with caching and layer optimization
- 🔄 **CI/CD Integration**: Seamless integration with continuous deployment pipelines
- 📊 **Build Monitoring**: Real-time build status tracking and reporting
- 🛡️ **Error Handling**: Robust error handling with retry mechanisms

## Quick Start

### CLI Usage

```bash
# Build image locally
ff container:build my-app

# Build and publish to registry
ff container:publish my-app docker.io

# Deploy to environment
ff container:deploy staging

# Run CI/CD pipeline
ff container:ci main

# Check agent status
ff container:status
```

### Programmatic Usage

```javascript
const { ContainerPublishAgent } = require('@flashfusion/ai-agents/core/ContainerPublishAgent');

// Initialize the agent
const agent = new ContainerPublishAgent();
await agent.initialize();

// Build and publish an image
const result = await agent.buildImage({
    sourcePath: '/path/to/source',
    imageName: 'my-application',
    tags: ['latest', 'v1.0.0'],
    registry: 'docker.io',
    push: true
});

console.log('Published image:', result.registryUrls);
```

## Configuration

### Environment Variables

```bash
# Docker Registry Authentication
DOCKER_REGISTRY_USERNAME=your-username
DOCKER_REGISTRY_PASSWORD=your-password

# GitHub Container Registry
GITHUB_TOKEN=ghp_your-github-token

# Google Container Registry
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Agent Configuration

```javascript
const agent = new ContainerPublishAgent({
    defaultRegistry: 'ghcr.io',
    buildTimeout: 900000,     // 15 minutes
    retryAttempts: 3,
    buildArgs: {
        NODE_ENV: 'production'
    }
});
```

## Supported Registries

| Registry | URL | Authentication |
|----------|-----|----------------|
| Docker Hub | `docker.io` | Username/Password or Token |
| GitHub Container Registry | `ghcr.io` | GitHub Token |
| Google Container Registry | `gcr.io` | Service Account |
| Local Registry | `localhost:5000` | None |

## Workflow Integration

### Container Deployment Workflow

```javascript
const { ContainerDeploymentWorkflow } = require('@flashfusion/ai-agents/workflows/ContainerDeploymentWorkflow');

const workflow = new ContainerDeploymentWorkflow();
await workflow.initialize();

// Deploy to staging
const result = await workflow.deployToEnvironment('staging', {
    sourcePath: './my-app',
    imageName: 'my-application',
    version: '1.2.3'
});
```

### Environment Configurations

#### Development
- Registry: `localhost:5000`
- Tags: `['dev', 'latest']`
- Push: `false` (local builds only)

#### Staging
- Registry: `ghcr.io`
- Tags: `['staging', 'v${version}']`
- Push: `true`

#### Production
- Registry: `docker.io`
- Tags: `['latest', 'v${version}', 'stable']`
- Push: `true`

## Docker Configuration

### Dockerfile Requirements

The agent expects a `Dockerfile` in the source path. Here's a recommended structure for Node.js applications:

```dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

## API Reference

### ContainerPublishAgent

#### Methods

##### `initialize()`
Initializes the agent and verifies Docker availability.

```javascript
const result = await agent.initialize();
// Returns: { success: boolean, agent: string, capabilities: string[] }
```

##### `buildImage(buildRequest)`
Builds a Docker image from source code.

**Parameters:**
- `sourcePath` (string): Path to source code directory
- `imageName` (string): Name of the image
- `tags` (string[]): Array of tags to apply
- `dockerfile` (string, optional): Dockerfile name (default: 'Dockerfile')
- `buildArgs` (object, optional): Build arguments
- `registry` (string, optional): Target registry
- `push` (boolean, optional): Whether to push to registry

**Returns:**
```javascript
{
    success: boolean,
    taskId: string,
    imageName: string,
    tags: string[],
    registry: string,
    registryUrls: string[],
    buildTime: number,
    imageSize: number,
    imageId: string,
    metadata: {
        buildDate: string,
        sourceCommit: string,
        buildArgs: object,
        dockerfile: string
    }
}
```

##### `getStatus()`
Returns the current status of the agent.

```javascript
const status = agent.getStatus();
// Returns: { id, name, role, status, capabilities, activeTasks, registries }
```

##### `getActiveTasks()`
Returns a list of currently active build tasks.

##### `getBuildStatus(taskId)`
Returns the status of a specific build task.

### ContainerDeploymentWorkflow

#### Methods

##### `deployToEnvironment(environment, options)`
Deploys to a specific environment (development, staging, production).

##### `deployToMultipleEnvironments(environments, options)`
Deploys to multiple environments in sequence.

##### `executeCIPipeline(options)`
Runs a complete CI/CD pipeline including tests and deployment.

## Error Handling

The agent provides comprehensive error handling with specific error types:

- **Docker Not Available**: Docker daemon is not running or not installed
- **Build Failed**: Docker build command failed
- **Push Failed**: Registry push failed (authentication, network, etc.)
- **Validation Error**: Invalid build parameters or missing files
- **Timeout Error**: Build or push operation exceeded time limit

## Examples

### Basic Local Build

```javascript
const agent = new ContainerPublishAgent();
await agent.initialize();

const result = await agent.buildImage({
    sourcePath: '.',
    imageName: 'my-app',
    tags: ['dev'],
    push: false
});
```

### Production Deployment

```javascript
const workflow = new ContainerDeploymentWorkflow();
await workflow.initialize();

const result = await workflow.deployToEnvironment('production', {
    imageName: 'my-production-app',
    version: '2.1.0'
});
```

### CI/CD Pipeline

```javascript
const workflow = new ContainerDeploymentWorkflow();
await workflow.initialize();

const result = await workflow.executeCIPipeline({
    branch: 'main',
    runTests: true,
    environment: 'production'
});
```

## Monitoring and Logging

The agent provides detailed logging for all operations:

- Build start/completion times
- Image sizes and IDs  
- Registry push status
- Error details and stack traces
- Performance metrics

## Security Considerations

- Store registry credentials securely (environment variables, secrets management)
- Use least-privilege access for registry authentication
- Regularly update base images for security patches
- Scan images for vulnerabilities before deployment
- Use multi-stage builds to minimize attack surface

## Troubleshooting

### Common Issues

**Docker not available**
```bash
# Verify Docker is running
docker --version
docker info
```

**Build failures**
- Check Dockerfile syntax
- Verify source code is accessible
- Ensure sufficient disk space
- Check build context size

**Registry push failures**
- Verify authentication credentials
- Check registry URL format
- Ensure proper network connectivity
- Verify registry permissions

**Permission errors**
- Check Docker daemon permissions
- Verify file ownership in build context
- Ensure registry write permissions

## Contributing

To contribute to the Container Publish Agent:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This agent is part of the FlashFusion platform and follows the same licensing terms.
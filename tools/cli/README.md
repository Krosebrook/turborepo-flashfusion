# FlashFusion CLI

## Overview

The FlashFusion CLI (`@flashfusion/cli`) provides powerful development tools and utilities for creating, managing, and deploying FlashFusion applications. It streamlines common development tasks and enforces best practices across projects.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @flashfusion/cli
```

### Local Installation

```bash
npm install @flashfusion/cli
npx flashfusion --help
```

## Usage

The CLI is available via two commands:
- `flashfusion` (full command)
- `ff` (short alias)

### Available Commands

```bash
flashfusion --help
```

## Commands

### Project Creation

#### Create New App

```bash
# Create a new Next.js application
flashfusion create app my-app --template=nextjs

# Create a new Express API
flashfusion create app my-api --template=express

# Create with TypeScript
flashfusion create app my-app --template=nextjs --typescript
```

#### Create New Package

```bash
# Create a new shared package
flashfusion create package my-package --type=shared

# Create a UI component package
flashfusion create package my-ui --type=ui

# Create an AI agent package
flashfusion create package my-agents --type=ai-agents
```

### Development Tools

#### Generate Components

```bash
# Generate a new React component
flashfusion generate component MyComponent --package=ui

# Generate with TypeScript and tests
flashfusion generate component MyButton --package=ui --typescript --tests
```

#### Generate Agents

```bash
# Generate a new AI agent
flashfusion generate agent DataProcessor --package=ai-agents

# Generate with workflow template
flashfusion generate agent UserOnboarding --package=ai-agents --workflow
```

### Project Management

#### Install Dependencies

```bash
# Install dependencies across all packages
flashfusion install

# Install in specific package
flashfusion install --package=web
```

#### Build Projects

```bash
# Build all packages
flashfusion build

# Build specific package
flashfusion build --package=ui

# Build with watch mode
flashfusion build --watch
```

#### Run Tests

```bash
# Run all tests
flashfusion test

# Run tests for specific package
flashfusion test --package=shared

# Run tests in watch mode
flashfusion test --watch
```

### GitLab Integration

#### Setup CI/CD

```bash
# Initialize GitLab CI/CD pipeline
flashfusion gitlab init

# Update pipeline configuration
flashfusion gitlab update-pipeline

# Deploy to environment
flashfusion gitlab deploy --env=staging
```

#### Create Merge Request

```bash
# Create MR with template
flashfusion gitlab mr create --template=feature

# Create MR with auto-approval
flashfusion gitlab mr create --auto-approve
```

### Code Quality

#### Lint Code

```bash
# Lint all packages
flashfusion lint

# Lint and fix issues
flashfusion lint --fix

# Lint specific package
flashfusion lint --package=web
```

#### Format Code

```bash
# Format all code
flashfusion format

# Format specific files
flashfusion format src/components/**/*.tsx
```

### Database Management

#### Run Migrations

```bash
# Run pending migrations
flashfusion db migrate

# Rollback migrations
flashfusion db migrate --rollback

# Reset database
flashfusion db reset
```

#### Generate Models

```bash
# Generate Prisma models
flashfusion db generate

# Update schema
flashfusion db push
```

### Deployment

#### Deploy Application

```bash
# Deploy to staging
flashfusion deploy --env=staging

# Deploy to production
flashfusion deploy --env=production --confirm

# Deploy with rollback plan
flashfusion deploy --env=production --rollback-plan
```

#### Environment Management

```bash
# List environments
flashfusion env list

# Switch environment
flashfusion env switch staging

# Validate environment
flashfusion env validate
```

## Configuration

### Global Configuration

Create `~/.flashfusion/config.json`:

```json
{
  "defaultTemplate": "nextjs",
  "typescript": true,
  "gitlabUrl": "https://gitlab.company.com",
  "deploymentStrategy": "blue-green",
  "editor": "vscode"
}
```

### Project Configuration

Create `flashfusion.config.js` in project root:

```javascript
module.exports = {
  packages: {
    web: {
      framework: 'nextjs',
      port: 3000
    },
    api: {
      framework: 'express', 
      port: 3001
    }
  },
  deployment: {
    strategy: 'blue-green',
    environments: ['staging', 'production']
  },
  gitlab: {
    projectId: '12345',
    pipelineConfig: '.gitlab-ci.yml'
  }
};
```

## Templates

### Application Templates

- `nextjs` - Next.js 14 with TypeScript
- `express` - Express.js API server
- `react` - React SPA application
- `vue` - Vue 3 application
- `nuxt` - Nuxt 3 application

### Package Templates

- `shared` - Shared utilities and types
- `ui` - UI components library
- `ai-agents` - AI agent implementations
- `api-client` - API client library

### Component Templates

- `component` - Basic React component
- `page` - Next.js page component
- `layout` - Layout component
- `hook` - Custom React hook
- `service` - Service class

## Examples

### Create Complete Project

```bash
# Create new project
flashfusion create project my-project

# Add web application
flashfusion create app web --template=nextjs

# Add API server
flashfusion create app api --template=express

# Add shared package
flashfusion create package shared --type=shared

# Setup GitLab CI/CD
flashfusion gitlab init

# Deploy to staging
flashfusion deploy --env=staging
```

### Component Development Workflow

```bash
# Generate new component
flashfusion generate component UserCard --package=ui

# Start development server
flashfusion dev --package=ui

# Run tests
flashfusion test --package=ui --watch

# Build and publish
flashfusion build --package=ui
flashfusion publish --package=ui
```

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure CLI is installed globally
2. **Permission errors**: Check file permissions and npm configuration
3. **Build failures**: Verify all dependencies are installed
4. **GitLab connection**: Check authentication and project access

### Debug Mode

```bash
# Enable debug logging
flashfusion --debug command

# Verbose output
flashfusion --verbose command
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](../../LICENSE) for details.
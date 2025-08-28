# Krosebrook Repository Organization

This document outlines the organization strategy for Krosebrook's 164 repositories into a structured turborepo monorepo.

## Repository Categories

Based on the knowledge base analysis, repositories are organized into the following categories:

### 1. FlashFusion Ecosystem (35 repositories)
Core FlashFusion applications and related projects:
- `FlashFusion` - Main FlashFusion application
- `FlashFusion-Unified` - Unified FlashFusion platform
- `flashfusion-ide` - FlashFusion IDE
- `flashfusion-commerce-forge` - E-commerce builder
- `flashfusion-genesis` - Project generator
- `flashfusion-loveable` - Loveable integration

**Workspace Location**: `apps/flashfusion-*`

### 2. AI Agents (28 repositories)
AI agent implementations and related tools:
- `tessa` - AI assistant
- `enhanced-firecrawl-scraper` - Web scraping agent
- `theaidashboard` - AI management dashboard
- `cortex-second-brain-4589` - Knowledge management
- `knowledge-base-app` - Knowledge base application

**Workspace Location**: `packages/ai-agents/`

### 3. Development Tools (31 repositories)
Utilities, CLI tools, and development aids:
- `turborepo-flashfusion` - This repository (core template)
- `claude-flow` - Claude workflow tools
- `SuperClaude` - Enhanced Claude interface
- `cui` - Command-line interface
- `OAuth` - Authentication utilities
- `CGDSTARTER` - Project starter

**Workspace Location**: `tools/`

### 4. Templates & Starters (25 repositories)
Reusable project templates and starter kits:
- `nextjs-with-supabase` - Next.js + Supabase template
- `nextjs-commerce` - E-commerce template
- `react-template` - React starter
- `typescript-starter` - TypeScript template

**Workspace Location**: `apps/templates/`

### 5. Applications (22 repositories)
Standalone applications:
- `DevChat` - Developer chat application
- `HabboHotel` - Virtual world application
- `LifeWins` - Productivity application
- `fusionforge-studio` - Studio application
- `FFSignup` - Signup application

**Workspace Location**: `apps/`

### 6. Libraries & Utilities (23 repositories)
Shared libraries and utility packages:
- `d1-rest` - REST API utilities
- `api-helpers` - API helper functions
- `ui-components` - UI component library
- `shared-utilities` - Common utilities

**Workspace Location**: `packages/`

## Organization Strategy

### Phase 1: Core Infrastructure
- [x] Set up turborepo configuration
- [x] Create workspace directory structure
- [ ] Add core utility packages
- [ ] Set up shared configuration packages

### Phase 2: Key Applications
- [ ] Add primary FlashFusion applications
- [ ] Integrate AI agent packages
- [ ] Set up development tools

### Phase 3: Templates & Libraries
- [ ] Migrate template repositories
- [ ] Add shared library packages
- [ ] Set up component libraries

### Phase 4: Standalone Applications
- [ ] Integrate standalone applications
- [ ] Set up application-specific configurations
- [ ] Create deployment configurations

## Adding New Repositories

### 1. Using Turbo Generator
```bash
# For new applications
npx turbo gen workspace --name=app-name --type=app

# For new packages
npx turbo gen workspace --name=package-name --type=package
```

### 2. Manual Migration
```bash
# 1. Create workspace directory
mkdir -p apps/my-app

# 2. Copy repository content
# (Manual process for existing repos)

# 3. Add package.json workspace configuration
# 4. Update import paths
# 5. Add to turbo.json if needed
```

### 3. Repository Types

#### Applications (`apps/`)
- Next.js applications
- Standalone React apps
- Node.js services
- Desktop applications

#### Packages (`packages/`)
- UI component libraries
- Utility libraries
- API clients
- Shared configurations

#### Tools (`tools/`)
- CLI applications
- Development utilities
- Build tools
- Scripts

## Framework Distribution

Based on the analysis:
- **Next.js**: 25+ applications
- **React**: 30+ components/apps
- **Node.js**: 20+ services/tools
- **TypeScript**: 40+ typed projects
- **Supabase**: 15+ database-connected apps
- **Turborepo**: Monorepo management
- **Docker**: Containerized deployments
- **Vercel**: Serverless deployments

## Migration Checklist

For each repository being migrated:

- [ ] Assess repository type and target workspace
- [ ] Create workspace directory
- [ ] Copy source code and assets
- [ ] Update package.json for monorepo
- [ ] Fix import paths and dependencies
- [ ] Update build and deployment configurations
- [ ] Test in monorepo context
- [ ] Update documentation
- [ ] Archive original repository (if appropriate)

## Deployment Strategy

### Vercel Apps
- Individual app deployments from monorepo
- Shared environment variables
- Automated deployments on push

### Docker Services
- Multi-stage builds for different services
- Shared base images
- Container orchestration

### GitHub Actions
- Workspace-aware CI/CD
- Parallel builds and tests
- Conditional deployments

## Maintenance

### Regular Tasks
- Dependency updates across workspaces
- Security vulnerability scanning
- Performance monitoring
- Documentation updates

### Automation
- Automated dependency updates
- Continuous integration testing
- Automated deployment pipelines
- Repository health monitoring
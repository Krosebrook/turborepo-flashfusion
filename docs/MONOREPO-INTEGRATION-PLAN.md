# Monorepo Integration Plan for turborepo-flashfusion

This document provides a comprehensive integration plan for all Krosebrook repositories into the `turborepo-flashfusion` monorepo. The plan ensures safe migration with git history preservation and minimal disruption to existing development workflows.

## Repository Categories Overview

Based on the problem statement, repositories are organized into the following categories:

### 🤖 AI & Agent Orchestration
### 🌐 Web Crawling & Data  
### 📊 Monitoring, Observability & Infra
### 🧑‍💻 Dev Tools & Templates
### 🧠 Memory, Context & Research
### 📦 Business / SaaS Systems
### 🛠 Misc / Utilities

## Current Monorepo Structure

```
turborepo-flashfusion/
├── apps/
│   ├── web/                    # Main Next.js application (existing)
│   └── api/                    # Express API (existing)
├── packages/
│   ├── ai-agents/              # AI agents (existing)
│   └── shared/                 # Utilities (existing)
└── tools/
    └── cli/                    # Enhanced CLI (existing)
```

## Target Monorepo Structure

```
turborepo-flashfusion/
├── apps/
│   ├── web/                    # Main Next.js application
│   ├── api/                    # Express API
│   ├── ide/                    # Web IDE (from flashfusion-ide)
│   ├── dashboard/              # AI Dashboard (from theaidashboard)
│   ├── agent-marketplace/      # Agent marketplace
│   ├── workflow-builder/       # Visual workflow builder
│   ├── observability/          # Monitoring dashboard
│   └── research-hub/           # Research interface
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── shared/                 # Common utilities
│   ├── ai-agents/              # AI agent implementations
│   ├── ai-models/              # AI model abstractions
│   ├── agent-orchestrator/     # Agent coordination
│   ├── workflow-engine/        # Workflow execution
│   ├── api-client/             # TypeScript API client
│   ├── auth/                   # Authentication
│   ├── database/               # Database services
│   ├── memory/                 # Memory layer
│   ├── data-crawler/           # Web crawling utilities
│   ├── monitoring/             # Observability tools
│   └── security/               # Security utilities
├── tools/
│   ├── cli/                    # Enhanced CLI
│   ├── deployment/             # Deployment tools
│   ├── scraper/                # Web scraping tools
│   └── monitoring/             # Monitoring utilities
└── templates/
    ├── supabase/               # Next.js + Supabase
    ├── commerce/               # E-commerce template
    ├── agent/                  # Agent template
    └── starter/                # Basic starter template
```

## Integration Plan by Category

## 🤖 AI & Agent Orchestration

### Core Repositories (Keep & Integrate)

#### activepieces
- **Destination**: `packages/workflow-automation/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  # 1. Add as remote and fetch
  git remote add activepieces https://github.com/Krosebrook/activepieces.git
  git fetch activepieces
  
  # 2. Create subtree (preserves history)
  git subtree add --prefix=packages/workflow-automation activepieces main --squash
  
  # 3. Update package.json
  cd packages/workflow-automation
  npm init -y
  # Update name to @flashfusion/workflow-automation
  ```

#### claude-code
- **Destination**: `apps/claude-terminal/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add claude-code https://github.com/Krosebrook/claude-code.git
  git fetch claude-code
  git subtree add --prefix=apps/claude-terminal claude-code main --squash
  ```

#### claude-flow
- **Destination**: `packages/agent-orchestrator/`
- **Technology**: TypeScript
- **Migration Strategy**: Extract core orchestration logic
- **Migration Steps**:
  ```bash
  # Manual extraction approach for complex integration
  git clone https://github.com/Krosebrook/claude-flow.git /tmp/claude-flow
  mkdir -p packages/agent-orchestrator/src
  cp -r /tmp/claude-flow/src/orchestration/* packages/agent-orchestrator/src/
  # Update imports and dependencies
  ```

#### claude-code-by-agents
- **Destination**: `apps/multi-agent-desktop/`
- **Technology**: TypeScript (Desktop)
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add claude-agents https://github.com/Krosebrook/claude-code-by-agents.git
  git fetch claude-agents
  git subtree add --prefix=apps/multi-agent-desktop claude-agents main --squash
  ```

#### claude-code-router
- **Destination**: `packages/claude-middleware/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add claude-router https://github.com/Krosebrook/claude-code-router.git
  git fetch claude-router
  git subtree add --prefix=packages/claude-middleware claude-router main --squash
  ```

#### agentops
- **Destination**: `packages/agent-monitoring/`
- **Technology**: Python
- **Migration Strategy**: Git subtree with adaptation layer
- **Migration Steps**:
  ```bash
  git remote add agentops https://github.com/Krosebrook/agentops.git
  git fetch agentops
  git subtree add --prefix=packages/agent-monitoring agentops main --squash
  # Create TypeScript wrapper in packages/agent-monitoring/wrapper/
  ```

#### Roo-Code
- **Destination**: `apps/ai-dev-team/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add roo-code https://github.com/Krosebrook/Roo-Code.git
  git fetch roo-code
  git subtree add --prefix=apps/ai-dev-team roo-code main --squash
  ```

### MCP Frameworks (Archive - Reference Only)
These will be archived as the problem statement suggests keeping only a subset:

#### Keep for Integration:
- **crewai** → `packages/mcp-integrations/crewai/`
- **autogen** → `packages/mcp-integrations/autogen/`
- **langgraph** → `packages/mcp-integrations/langgraph/`

#### Archive (Reference Only):
- langgraphjs, langflow, langfuse, metamcp, fastmcp, fastmcp-1
- context7, hub-mcp, zen-mcp-server, awesome-mcp-servers
- swarms, superagentx, agent-zero

#### Migration Steps for Keep Items:
```bash
# Example for crewai
git remote add crewai https://github.com/Krosebrook/crewai.git
git fetch crewai
git subtree add --prefix=packages/mcp-integrations/crewai crewai main --squash
```

## 🌐 Web Crawling & Data

### Consolidate into flashfusion-data package

#### firecrawl
- **Destination**: `packages/data-crawler/core/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add firecrawl https://github.com/Krosebrook/firecrawl.git
  git fetch firecrawl
  git subtree add --prefix=packages/data-crawler/core firecrawl main --squash
  ```

#### firecrawl-app-examples
- **Destination**: `packages/data-crawler/examples/`
- **Technology**: Jupyter/TypeScript
- **Migration Strategy**: Copy examples
- **Migration Steps**:
  ```bash
  git clone https://github.com/Krosebrook/firecrawl-app-examples.git /tmp/firecrawl-examples
  mkdir -p packages/data-crawler/examples
  cp -r /tmp/firecrawl-examples/* packages/data-crawler/examples/
  ```

#### firecrawl-docs
- **Destination**: `packages/data-crawler/docs/`
- **Technology**: MDX
- **Migration Strategy**: Documentation integration
- **Migration Steps**:
  ```bash
  git clone https://github.com/Krosebrook/firecrawl-docs.git /tmp/firecrawl-docs
  mkdir -p packages/data-crawler/docs
  cp -r /tmp/firecrawl-docs/* packages/data-crawler/docs/
  ```

#### firecrawl-mcp-server
- **Destination**: `packages/data-crawler/mcp/`
- **Technology**: JavaScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add firecrawl-mcp https://github.com/Krosebrook/firecrawl-mcp-server.git
  git fetch firecrawl-mcp
  git subtree add --prefix=packages/data-crawler/mcp firecrawl-mcp main --squash
  ```

#### enhanced-firecrawl-scraper
- **Destination**: `tools/enhanced-scraper/`
- **Technology**: HTML/JavaScript
- **Migration Strategy**: Tool integration
- **Migration Steps**:
  ```bash
  git remote add enhanced-scraper https://github.com/Krosebrook/enhanced-firecrawl-scraper.git
  git fetch enhanced-scraper
  git subtree add --prefix=tools/enhanced-scraper enhanced-scraper main --squash
  ```

#### open-lovable
- **Destination**: `tools/react-cloner/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add open-lovable https://github.com/Krosebrook/open-lovable.git
  git fetch open-lovable
  git subtree add --prefix=tools/react-cloner open-lovable main --squash
  ```

## 📊 Monitoring, Observability & Infra

### Core Infrastructure (Integrate)

#### Checkmate
- **Destination**: `packages/monitoring/server-monitoring/`
- **Technology**: JavaScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add checkmate https://github.com/Krosebrook/Checkmate.git
  git fetch checkmate
  git subtree add --prefix=packages/monitoring/server-monitoring checkmate main --squash
  ```

#### uptime-kuma
- **Destination**: `apps/uptime-dashboard/`
- **Technology**: JavaScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add uptime-kuma https://github.com/Krosebrook/uptime-kuma.git
  git fetch uptime-kuma
  git subtree add --prefix=apps/uptime-dashboard uptime-kuma main --squash
  ```

#### oneuptime
- **Destination**: `apps/observability-platform/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add oneuptime https://github.com/Krosebrook/oneuptime.git
  git fetch oneuptime
  git subtree add --prefix=apps/observability-platform oneuptime main --squash
  ```

### Backend Stack (Keep Core Components)

#### supabase
- **Destination**: `packages/database/supabase/`
- **Technology**: TypeScript
- **Migration Strategy**: Extract relevant utilities
- **Migration Steps**:
  ```bash
  git clone https://github.com/Krosebrook/supabase.git /tmp/supabase
  mkdir -p packages/database/supabase
  cp -r /tmp/supabase/packages/supabase-js/* packages/database/supabase/
  ```

#### firebase-tools
- **Destination**: `tools/firebase/`
- **Technology**: JavaScript
- **Migration Strategy**: Tool integration
- **Migration Steps**:
  ```bash
  git remote add firebase-tools https://github.com/Krosebrook/firebase-tools.git
  git fetch firebase-tools
  git subtree add --prefix=tools/firebase firebase-tools main --squash
  ```

### Infrastructure Utilities (Reference/Template)

#### terraform
- **Destination**: `templates/infrastructure/terraform/`
- **Technology**: HCL
- **Migration Strategy**: Template extraction
- **Migration Steps**:
  ```bash
  git clone https://github.com/Krosebrook/terraform.git /tmp/terraform
  mkdir -p templates/infrastructure/terraform
  cp -r /tmp/terraform/examples/* templates/infrastructure/terraform/
  ```

## 🧑‍💻 Dev Tools & Templates

### UI Framework Stack (Keep HeroUI)

#### heroui
- **Destination**: `packages/ui/heroui/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add heroui https://github.com/Krosebrook/heroui.git
  git fetch heroui
  git subtree add --prefix=packages/ui/heroui heroui main --squash
  ```

#### heroui-cli
- **Destination**: `tools/heroui-cli/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add heroui-cli https://github.com/Krosebrook/heroui-cli.git
  git fetch heroui-cli
  git subtree add --prefix=tools/heroui-cli heroui-cli main --squash
  ```

### Templates (Keep FlashFusion-specific)

#### vite-react-heroui-template
- **Destination**: `templates/vite-heroui/`
- **Technology**: TypeScript
- **Migration Strategy**: Template integration
- **Migration Steps**:
  ```bash
  git remote add vite-template https://github.com/Krosebrook/vite-react-heroui-template.git
  git fetch vite-template
  git subtree add --prefix=templates/vite-heroui vite-template main --squash
  ```

#### next-app-template
- **Destination**: `templates/nextjs-app/`
- **Technology**: TypeScript
- **Migration Strategy**: Template integration
- **Migration Steps**:
  ```bash
  git remote add next-template https://github.com/Krosebrook/next-app-template.git
  git fetch next-template
  git subtree add --prefix=templates/nextjs-app next-template main --squash
  ```

#### portfolio-template
- **Destination**: `templates/portfolio/`
- **Technology**: TypeScript
- **Migration Strategy**: Template integration
- **Migration Steps**:
  ```bash
  git remote add portfolio-template https://github.com/Krosebrook/portfolio-template.git
  git fetch portfolio-template
  git subtree add --prefix=templates/portfolio portfolio-template main --squash
  ```

### Core Libraries

#### zod
- **Destination**: `packages/schema-validation/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add zod https://github.com/Krosebrook/zod.git
  git fetch zod
  git subtree add --prefix=packages/schema-validation zod main --squash
  ```

#### stagehand
- **Destination**: `packages/ui-automation/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add stagehand https://github.com/Krosebrook/stagehand.git
  git fetch stagehand
  git subtree add --prefix=packages/ui-automation stagehand main --squash
  ```

### Archive (Legacy)
- bootstrap → Archive (Legacy UI)
- lottie-android → Archive (Android-specific)

## 🧠 Memory, Context & Research

### Core Memory Systems

#### mem0
- **Destination**: `packages/memory/mem0/`
- **Technology**: Python
- **Migration Strategy**: Git subtree with TypeScript wrapper
- **Migration Steps**:
  ```bash
  git remote add mem0 https://github.com/Krosebrook/mem0.git
  git fetch mem0
  git subtree add --prefix=packages/memory/mem0 mem0 main --squash
  # Create TypeScript wrapper
  mkdir -p packages/memory/mem0/typescript-wrapper
  ```

#### letta
- **Destination**: `packages/memory/letta/`
- **Technology**: Python
- **Migration Strategy**: Git subtree with TypeScript wrapper
- **Migration Steps**:
  ```bash
  git remote add letta https://github.com/Krosebrook/letta.git
  git fetch letta
  git subtree add --prefix=packages/memory/letta letta main --squash
  # Create TypeScript wrapper
  mkdir -p packages/memory/letta/typescript-wrapper
  ```

#### gpt-researcher
- **Destination**: `packages/research/gpt-researcher/`
- **Technology**: Python
- **Migration Strategy**: Git subtree with TypeScript wrapper
- **Migration Steps**:
  ```bash
  git remote add gpt-researcher https://github.com/Krosebrook/gpt-researcher.git
  git fetch gpt-researcher
  git subtree add --prefix=packages/research/gpt-researcher gpt-researcher main --squash
  # Create TypeScript wrapper
  mkdir -p packages/research/gpt-researcher/typescript-wrapper
  ```

### Knowledge Repositories (Reference Only)

#### awesome-* repositories
- **Destination**: `docs/references/`
- **Technology**: Markdown
- **Migration Strategy**: Documentation reference
- **Migration Steps**:
  ```bash
  # Clone and copy documentation
  mkdir -p docs/references/awesome-collections
  # Copy relevant awesome lists as reference documentation
  ```

### Terminal AI Tools (Reference/Inspiration)

#### open-interpreter
- **Destination**: `docs/references/terminal-ai/`
- **Technology**: Python
- **Migration Strategy**: Reference documentation
- **Migration Steps**:
  ```bash
  # Extract patterns and document integration strategies
  mkdir -p docs/references/terminal-ai
  # Document integration patterns for terminal AI tools
  ```

## 📦 Business / SaaS Systems

These are marked as "inspiration" repositories in the problem statement, so we'll create reference documentation rather than full integration.

### Reference Integration

#### InvenTree
- **Destination**: `docs/references/business-systems/inventory/`
- **Technology**: Python
- **Migration Strategy**: Pattern extraction
- **Migration Steps**:
  ```bash
  mkdir -p docs/references/business-systems/inventory
  # Document patterns for inventory management
  ```

#### budibase
- **Destination**: `docs/references/business-systems/no-code/`
- **Technology**: TypeScript
- **Migration Strategy**: Pattern extraction
- **Migration Steps**:
  ```bash
  mkdir -p docs/references/business-systems/no-code
  # Document no-code platform patterns
  ```

#### n8n
- **Destination**: `docs/references/business-systems/workflow/`
- **Technology**: TypeScript
- **Migration Strategy**: Pattern extraction
- **Migration Steps**:
  ```bash
  mkdir -p docs/references/business-systems/workflow
  # Document workflow automation patterns
  ```

## 🛠 Misc / Utilities

### API & Integration Tools

#### pipedream
- **Destination**: `packages/api-connectors/`
- **Technology**: JavaScript
- **Migration Strategy**: Extract connector patterns
- **Migration Steps**:
  ```bash
  git clone https://github.com/Krosebrook/pipedream.git /tmp/pipedream
  mkdir -p packages/api-connectors
  # Extract connector patterns and utilities
  ```

#### d1-rest
- **Destination**: `packages/database/d1-rest/`
- **Technology**: TypeScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add d1-rest https://github.com/Krosebrook/d1-rest.git
  git fetch d1-rest
  git subtree add --prefix=packages/database/d1-rest d1-rest main --squash
  ```

### Authentication

#### login
- **Destination**: `packages/auth/login/`
- **Technology**: JavaScript
- **Migration Strategy**: Git subtree
- **Migration Steps**:
  ```bash
  git remote add login https://github.com/Krosebrook/login.git
  git fetch login
  git subtree add --prefix=packages/auth/login login main --squash
  ```

### Utilities

#### sqlfluff
- **Destination**: `tools/sql-formatter/`
- **Technology**: Python
- **Migration Strategy**: Tool integration
- **Migration Steps**:
  ```bash
  git remote add sqlfluff https://github.com/Krosebrook/sqlfluff.git
  git fetch sqlfluff
  git subtree add --prefix=tools/sql-formatter sqlfluff main --squash
  ```

#### yt-dlp
- **Destination**: `tools/media-downloader/`
- **Technology**: Python
- **Migration Strategy**: Tool integration
- **Migration Steps**:
  ```bash
  git remote add yt-dlp https://github.com/Krosebrook/yt-dlp.git
  git fetch yt-dlp
  git subtree add --prefix=tools/media-downloader yt-dlp main --squash
  ```

### Security Tools (Reference Only)

#### ghidra, GhostTrack, Nettacker, zaproxy
- **Destination**: `docs/references/security/`
- **Technology**: Various
- **Migration Strategy**: Reference documentation
- **Migration Steps**:
  ```bash
  mkdir -p docs/references/security
  # Document security tool integration patterns
  ```

## Migration Execution Plan

### Phase 1: Core Platform (Weeks 1-2) 🔴 HIGH PRIORITY

1. **AI Agent Orchestration**
   ```bash
   # Priority order
   1. claude-flow → packages/agent-orchestrator/
   2. activepieces → packages/workflow-automation/
   3. agentops → packages/agent-monitoring/
   ```

2. **Data & Crawling**
   ```bash
   # Consolidate firecrawl ecosystem
   1. firecrawl → packages/data-crawler/core/
   2. firecrawl-mcp-server → packages/data-crawler/mcp/
   3. enhanced-firecrawl-scraper → tools/enhanced-scraper/
   ```

### Phase 2: Development Tools (Weeks 3-4) 🟡 MEDIUM PRIORITY

1. **UI Framework Integration**
   ```bash
   1. heroui → packages/ui/heroui/
   2. heroui-cli → tools/heroui-cli/
   3. zod → packages/schema-validation/
   ```

2. **Templates & Starters**
   ```bash
   1. vite-react-heroui-template → templates/vite-heroui/
   2. next-app-template → templates/nextjs-app/
   3. portfolio-template → templates/portfolio/
   ```

### Phase 3: Applications (Weeks 5-6) 🟢 LOW PRIORITY

1. **Core Applications**
   ```bash
   1. claude-code → apps/claude-terminal/
   2. Roo-Code → apps/ai-dev-team/
   3. claude-code-by-agents → apps/multi-agent-desktop/
   ```

2. **Monitoring & Observability**
   ```bash
   1. uptime-kuma → apps/uptime-dashboard/
   2. oneuptime → apps/observability-platform/
   3. Checkmate → packages/monitoring/server-monitoring/
   ```

### Phase 4: Memory & Research (Weeks 7-8) 🟣 SPECIALIZED

1. **Memory Systems**
   ```bash
   1. mem0 → packages/memory/mem0/
   2. letta → packages/memory/letta/
   3. gpt-researcher → packages/research/gpt-researcher/
   ```

2. **Reference Documentation**
   ```bash
   1. Create docs/references/ structure
   2. Document integration patterns
   3. Archive obsolete repositories
   ```

## Git History Preservation Strategies

### Strategy 1: Git Subtree (Recommended)
- **Pros**: Preserves complete history, simple to use
- **Cons**: Can create large commits
- **Best for**: Active repositories that will continue development

```bash
git remote add <repo-name> <repo-url>
git fetch <repo-name>
git subtree add --prefix=<destination-path> <repo-name> <branch> --squash
```

### Strategy 2: Git Filter-Repo (Advanced)
- **Pros**: Clean history, can filter specific paths
- **Cons**: More complex, requires git-filter-repo tool
- **Best for**: Large repositories where only parts are needed

```bash
# Install git-filter-repo first
pip install git-filter-repo

# Clone and filter
git clone <repo-url> /tmp/<repo-name>
cd /tmp/<repo-name>
git filter-repo --path <relevant-path>

# Then add as subtree
cd /path/to/turborepo-flashfusion
git remote add <repo-name> /tmp/<repo-name>
git fetch <repo-name>
git subtree add --prefix=<destination-path> <repo-name> main
```

### Strategy 3: Manual Copy (Simple)
- **Pros**: Clean, simple for templates
- **Cons**: Loses git history
- **Best for**: Templates, reference material, small utilities

```bash
git clone <repo-url> /tmp/<repo-name>
cp -r /tmp/<repo-name>/* <destination-path>/
git add <destination-path>
git commit -m "Add <repo-name> content"
```

## Risk Mitigation

### High-Risk Integrations

1. **Large Python Repositories** (mem0, letta, gpt-researcher)
   - **Risk**: Language mixing complexity
   - **Mitigation**: Create TypeScript wrappers, use Docker containers

2. **Complex Applications** (oneuptime, uptime-kuma)
   - **Risk**: Build system conflicts
   - **Mitigation**: Isolate in separate apps/, maintain original build systems

3. **Legacy Repositories** (bootstrap, older tools)
   - **Risk**: Outdated dependencies
   - **Mitigation**: Archive as reference, don't integrate directly

### Backup Strategy

1. **Create backup branch before each integration**
   ```bash
   git checkout -b backup-before-<repo-name>
   git push origin backup-before-<repo-name>
   ```

2. **Test builds after each integration**
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

3. **Rollback plan**
   ```bash
   git reset --hard <previous-commit>
   # or
   git revert <problematic-commit>
   ```

## Post-Integration Tasks

### 1. Update Configuration Files

#### turbo.json
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        "dist/**",
        "build/**",
        "storybook-static/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

#### Root package.json
```json
{
  "scripts": {
    "dev:all": "turbo dev --parallel",
    "dev:apps": "turbo dev --filter='./apps/*' --parallel",
    "dev:packages": "turbo dev --filter='./packages/*' --parallel",
    "build:packages": "turbo build --filter='./packages/*'",
    "test:unit": "turbo test --filter='./packages/*'",
    "test:integration": "turbo test --filter='./apps/*'"
  }
}
```

### 2. Create Package Dependencies

Update each package.json with proper dependencies and workspace references:

```json
{
  "dependencies": {
    "@flashfusion/shared": "workspace:*",
    "@flashfusion/ui": "workspace:*"
  }
}
```

### 3. Documentation Updates

- Update README.md with new structure
- Create integration guides for each major component
- Document development workflows
- Create troubleshooting guides

## Success Metrics

### Technical Metrics
- ✅ All packages build successfully
- ✅ No TypeScript errors
- ✅ Test coverage >80%
- ✅ Build time <10 minutes
- ✅ Development server starts <60 seconds

### Functional Metrics
- ✅ All AI agents functional
- ✅ Workflow automation working
- ✅ Data crawling operational
- ✅ UI components usable
- ✅ Templates functional

### Developer Experience Metrics
- ✅ Hot reload working across apps
- ✅ Shared components usable
- ✅ CLI tools functional
- ✅ Documentation complete
- ✅ Onboarding time <2 hours

## Conclusion

This comprehensive integration plan provides a structured approach to consolidating all Krosebrook repositories into the turborepo-flashfusion monorepo. The phased approach ensures minimal risk while maximizing the benefits of a unified development environment.

Key benefits:
- **Unified Development**: Single repository for all components
- **Shared Dependencies**: Reduced duplication and improved consistency
- **Better Collaboration**: Centralized development and documentation
- **Improved CI/CD**: Unified build and deployment pipelines
- **Version Management**: Coordinated releases across all components

The plan prioritizes high-value integrations first while providing clear migration paths for all repositories, ensuring the FlashFusion ecosystem remains robust and maintainable.
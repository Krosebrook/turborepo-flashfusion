# Implementation Guide: Required Repositories Integration

This guide provides concrete steps to integrate the identified repositories into the turborepo-flashfusion monorepo following best practices.

## Quick Start: Essential Repositories

### 1. Immediate Integration (Priority 1)

#### A. Integrate flashfusion-ide as apps/ide

```bash
# 1. Add flashfusion-ide as a new app
cd /home/runner/work/turborepo-flashfusion/turborepo-flashfusion

# 2. Create ide app directory
mkdir -p apps/ide

# 3. Copy flashfusion-ide content (would be done via git submodule or direct copy)
# Note: In production, use: git subtree add --prefix=apps/ide https://github.com/Krosebrook/flashfusion-ide.git main

# 4. Update ide package.json for turborepo compatibility
cat > apps/ide/package.json << 'EOF'
{
  "name": "@flashfusion/ide",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "@tailwindcss/postcss": "^4.1.11",
    "@types/node": "^24.1.0",
    "@xterm/addon-fit": "^0.10.0",
    "@xterm/xterm": "^5.5.0",
    "autoprefixer": "^10.4.21",
    "axios": "^1.11.0",
    "lucide-react": "^0.534.0",
    "monaco-editor": "^0.52.2",
    "postcss": "^8.5.6",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "socket.io-client": "^4.8.1",
    "tailwindcss": "^4.1.11",
    "xterm": "^5.3.0",
    "zustand": "^5.0.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.1",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.30.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.35.1",
    "vite": "^7.0.4"
  }
}
EOF

# 5. Update root package.json to include ide workspace
# (This would be done by modifying the workspaces array)
```

#### B. Create UI Components Package

```bash
# 1. Create UI package directory
mkdir -p packages/ui

# 2. Initialize UI package
cat > packages/ui/package.json << 'EOF'
{
  "name": "@flashfusion/ui",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^3.3.6",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
EOF

# 3. Create basic UI component structure
mkdir -p packages/ui/src/components
mkdir -p packages/ui/src/hooks
mkdir -p packages/ui/src/utils

cat > packages/ui/src/index.ts << 'EOF'
// Components
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Card } from './components/Card';
export { Modal } from './components/Modal';

// Hooks
export { useTheme } from './hooks/useTheme';
export { useLocalStorage } from './hooks/useLocalStorage';

// Utils
export { cn } from './utils/cn';
export { formatDate } from './utils/formatDate';

// Types
export type { ButtonProps } from './components/Button';
export type { InputProps } from './components/Input';
EOF
```

#### C. Create API Client Package

```bash
# 1. Create API client package
mkdir -p packages/api-client

cat > packages/api-client/package.json << 'EOF'
{
  "name": "@flashfusion/api-client",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "generate": "openapi-typescript https://api.flashfusion.co/openapi.json -o src/types/api.ts"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "eslint": "^8.0.0",
    "openapi-typescript": "^6.7.0"
  }
}
EOF

mkdir -p packages/api-client/src/{endpoints,types,utils}

cat > packages/api-client/src/index.ts << 'EOF'
// Main client
export { FlashFusionClient } from './client';

// Endpoints
export { AgentsAPI } from './endpoints/agents';
export { WorkflowsAPI } from './endpoints/workflows';
export { ProjectsAPI } from './endpoints/projects';

// Types
export type * from './types/api';
export type * from './types/common';

// Utils
export { createAuthenticatedClient } from './utils/auth';
export { handleApiError } from './utils/errors';
EOF
```

### 2. Development Infrastructure (Priority 2)

#### A. Enhanced CLI Tools

```bash
# 1. Enhance existing CLI
mkdir -p tools/cli/commands
mkdir -p tools/cli/generators
mkdir -p tools/cli/templates

cat > tools/cli/package.json << 'EOF'
{
  "name": "@flashfusion/cli",
  "version": "1.0.0",
  "private": true,
  "bin": {
    "ff": "./ff-cli.js",
    "flashfusion": "./ff-cli.js"
  },
  "scripts": {
    "build": "echo 'No build needed for CLI'",
    "dev": "nodemon ff-cli.js",
    "lint": "eslint .",
    "type-check": "echo 'Type checking CLI'"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^4.1.2",
    "inquirer": "^9.0.0",
    "ora": "^6.0.0",
    "fs-extra": "^11.0.0",
    "glob": "^10.0.0",
    "mustache": "^4.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "eslint": "^8.0.0"
  }
}
EOF

cat > tools/cli/ff-cli.js << 'EOF'
#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const package = require('./package.json');

const program = new Command();

program
  .name('flashfusion')
  .description('FlashFusion CLI for development automation')
  .version(package.version);

// Commands
program
  .command('create')
  .description('Create a new FlashFusion project or component')
  .argument('<type>', 'Type to create (app, package, agent, workflow)')
  .argument('<name>', 'Name of the component')
  .action(require('./commands/create'));

program
  .command('dev')
  .description('Start development environment')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(require('./commands/dev'));

program
  .command('build')
  .description('Build all packages')
  .action(require('./commands/build'));

program
  .command('agent')
  .description('Agent management commands')
  .option('--list', 'List all agents')
  .option('--create <name>', 'Create new agent')
  .option('--activate <id>', 'Activate agent')
  .action(require('./commands/agent'));

program
  .command('deploy')
  .description('Deploy to production')
  .option('--env <environment>', 'Target environment', 'production')
  .action(require('./commands/deploy'));

program.parse();
EOF

chmod +x tools/cli/ff-cli.js
```

#### B. Testing Framework

```bash
# 1. Create testing package
mkdir -p packages/testing

cat > packages/testing/package.json << 'EOF'
{
  "name": "@flashfusion/testing",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "playwright": "^1.42.0",
    "vitest": "^1.0.0",
    "jsdom": "^23.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
EOF

mkdir -p packages/testing/src/{e2e,integration,mocks,utils}

cat > packages/testing/src/index.ts << 'EOF'
// Testing utilities
export { renderWithProviders } from './utils/render';
export { createMockServer } from './utils/mock-server';
export { mockAgent } from './mocks/agent';
export { mockWorkflow } from './mocks/workflow';

// E2E utilities
export { setupE2E } from './e2e/setup';
export { createTestUser } from './e2e/user';

// Integration test helpers
export { setupTestDB } from './integration/database';
export { createTestAPI } from './integration/api';
EOF
```

### 3. Update Turborepo Configuration

```bash
# Update turbo.json for new packages
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
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
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "format": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    }
  },
  "globalDependencies": [
    "**/.env.*local",
    "**/.env",
    "**/package.json",
    "**/tsconfig.json",
    "**/tailwind.config.js"
  ],
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "GITHUB_TOKEN",
    "VERCEL_TOKEN"
  ]
}
EOF
```

### 4. Package Management Scripts

```bash
# Update root package.json with new scripts
# This would modify the existing package.json to add:

cat >> package.json << 'EOF'
# Add these scripts to the existing scripts section:
  "dev:all": "turbo dev --parallel",
  "dev:apps": "turbo dev --filter='./apps/*' --parallel",
  "dev:packages": "turbo dev --filter='./packages/*' --parallel",
  "build:packages": "turbo build --filter='./packages/*'",
  "test:unit": "turbo test --filter='./packages/*'",
  "test:integration": "turbo test --filter='./apps/*'",
  "test:e2e": "turbo test:e2e",
  "storybook": "turbo storybook --filter='@flashfusion/ui'",
  "gen:component": "ff create component",
  "gen:agent": "ff create agent",
  "gen:workflow": "ff create workflow"
EOF
```

## Integration Checklist

### Phase 1: Core Integration ✅
- [ ] Integrate flashfusion-ide → `apps/ide/`
- [ ] Create `packages/ui/` component library
- [ ] Create `packages/api-client/` TypeScript client
- [ ] Update turborepo configuration
- [ ] Test build and development workflows

### Phase 2: Enhanced Development ⏳
- [ ] Enhance CLI tools with generators
- [ ] Create testing framework package
- [ ] Set up Storybook for UI components
- [ ] Create development server utilities
- [ ] Add code generation templates

### Phase 3: AI & Workflow Enhancement 📅
- [ ] Extract agent orchestrator from FlashFusion-Unified
- [ ] Create workflow engine package
- [ ] Build agent marketplace app
- [ ] Create visual workflow builder
- [ ] Integrate AI model abstractions

### Phase 4: Production Infrastructure 🚀
- [ ] Set up monitoring and logging
- [ ] Create security toolkit
- [ ] Add deployment automation
- [ ] Implement analytics tracking
- [ ] Create compliance tools

## Validation Steps

After each phase, run these validation commands:

```bash
# 1. Install all dependencies
npm install

# 2. Type check all packages
npm run type-check

# 3. Lint all code
npm run lint

# 4. Build all packages
npm run build

# 5. Run all tests
npm run test

# 6. Test development workflow
npm run dev

# 7. Generate and test components
npm run gen:component TestComponent
npm run gen:agent TestAgent
```

## Monitoring Progress

Track integration progress using:

```bash
# 1. Check package dependencies
npx turbo graph

# 2. Analyze build performance
npx turbo build --dry-run

# 3. Review caching efficiency
npx turbo build --summarize

# 4. Monitor file changes
npx turbo dev --filter='@flashfusion/ui' --parallel
```

This implementation guide provides concrete steps to transform the current turborepo-flashfusion into a comprehensive, production-ready platform by integrating the best repositories from the Krosebrook ecosystem following modern development best practices.
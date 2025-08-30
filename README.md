# 🚀 FlashFusion TurboRepo Template

A modern, production-ready monorepo template built with TurboRepo, featuring AI agent patterns, session management, and a knowledge base system.

## ✨ Features

- **🏗️ Monorepo Structure**: Apps, packages, and tools organized with TurboRepo
- **🤖 AI Agent Patterns**: Pre-built patterns for orchestration, context management, and communication
- **🔄 Session Management**: Automatic state persistence and context restoration
- **📚 Knowledge Base**: Extracted patterns and best practices from 22+ repositories
- **⚡ Fast Development**: Hot reload, TypeScript, Tailwind CSS
- **🧪 Testing Ready**: Jest setup for all packages
- **🚢 Deploy Ready**: Vercel, Docker, and CI/CD configurations

## 📁 Project Structure

```
├── apps/                    # Deployable applications
│   └── web/                # Next.js web application
├── packages/               # Shared libraries
│   ├── ui/                 # React UI components
│   └── shared/             # Common utilities and types
├── tools/                  # CLI tools and utilities
│   └── cli/                # FlashFusion CLI
├── knowledge-base/         # AI patterns and templates
│   ├── agent-patterns.js   # AI agent implementations
│   ├── best-practices.md   # Development guidelines
│   └── deployment-templates.json
├── setup.js               # Automated setup script
├── restore-session.js     # Session management
└── turbo.json            # TurboRepo configuration
```

## 🚀 Quick Start

### Option 1: Use as Template

1. **Click "Use this template" on GitHub** or clone:
   ```bash
   git clone https://github.com/Krosebrook/turborepo-flashfusion.git my-project
   cd my-project
   ```

2. **Run the setup script**:
   ```bash
   npm run setup
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

### Option 2: One-Command Setup

```bash
npx create-turbo@latest --example https://github.com/Krosebrook/turborepo-flashfusion
cd my-turborepo
npm run setup
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all packages |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Type check all TypeScript |
| `npm run clean` | Clean all build artifacts |
| `npm run restore-state` | Restore development session |

## 📦 Adding New Workspaces

### Using Turbo Generator
```bash
# Add a new app
npx turbo gen workspace --name=my-app --type=app

# Add a new package
npx turbo gen workspace --name=my-lib --type=package

# Add a new tool
npx turbo gen workspace --name=my-tool --type=tool
```

### Using FlashFusion CLI
```bash
# Build the CLI first
npm run build

# Use the CLI
npx flashfusion create
npx flashfusion init
npx flashfusion status
```

## 🤖 AI Agent Integration

The template includes pre-built AI agent patterns:

```typescript
import { AgentOrchestrator, ContextManager } from '@flashfusion/shared';

// Initialize agent system
const orchestrator = new AgentOrchestrator();
const context = new ContextManager();

// Execute workflow
const result = await orchestrator.executeWorkflow('myWorkflow', input);
```

See `knowledge-base/agent-patterns.js` for complete implementations.

## 🔧 Configuration

### Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your API keys and configuration

### TypeScript
- Shared configuration in root `tsconfig.json`
- Each workspace extends the base config
- Strict mode enabled by default

### TurboRepo
- Optimized build pipeline in `turbo.json`
- Shared dependency caching
- Remote caching ready (configure in `turbo.json`)

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run deploy
```

### Docker
```bash
# Build image
docker build -t flashfusion .

# Run container
docker run -p 3000:3000 flashfusion
```

### CI/CD
GitHub Actions workflow included:
- Build and test all packages
- Type checking and linting
- Deploy to Vercel on merge to main

## 📚 Knowledge Base

The template includes a curated knowledge base with:

- **Agent Patterns**: Orchestrator, Context Manager, Communication Bus
- **Best Practices**: TypeScript, Testing, Performance, Security
- **Deployment Templates**: Multi-platform deployment configurations
- **Session Management**: Persistent state across development sessions

## 🎯 Session Management

FlashFusion automatically saves your development state:

```bash
# Restore your last session
npm run restore-state

# View current status and next steps
npm run next-steps
```

State includes:
- Current working directory
- Environment status
- Build status
- Suggested next actions

## 🧪 Testing

Each package includes testing setup:

```bash
# Run all tests
npm test

# Run specific package tests
npm test --workspace=@flashfusion/shared

# Run with coverage
npm test -- --coverage
```

## 📖 Guides

### Creating a New App
1. Generate workspace: `npx turbo gen workspace --name=my-app --type=app`
2. Choose framework (Next.js, Express, etc.)
3. Configure in `turbo.json` if needed
4. Start developing: `npm run dev`

### Creating Shared Components
1. Add components to `packages/ui/src/`
2. Export from `packages/ui/src/index.ts`
3. Use in apps: `import { Button } from '@flashfusion/ui'`

### Adding Dependencies
```bash
# Add to root (affects all workspaces)
npm install -D typescript

# Add to specific workspace
npm install react --workspace=@flashfusion/web

# Add workspace dependency
npm install @flashfusion/ui --workspace=@flashfusion/web
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Krosebrook/turborepo-flashfusion/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/Krosebrook/turborepo-flashfusion/discussions)
- **Documentation**: Check the `knowledge-base/` directory

## 🚀 What's Next?

After setup, you'll have:
- ✅ A working Next.js app at `http://localhost:3000`
- ✅ Shared UI components ready to use
- ✅ AI agent patterns ready to implement
- ✅ Session management working automatically
- ✅ Full TypeScript setup with strict mode
- ✅ ESLint and Prettier configured
- ✅ Testing infrastructure ready
- ✅ Deployment configurations ready

Ready to build something amazing! 🎉
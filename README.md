# 🚀 FlashFusion Turborepo

A modern Turborepo monorepo containing the complete FlashFusion AI Business Operating System.

## 🏗️ Architecture

This repository follows Turborepo best practices with the FlashFusion platform integrated into a scalable monorepo structure:

```
turborepo-flashfusion/
├── apps/
│   ├── web/                    # Main Next.js application (FlashFusion Dashboard)
│   └── api/                    # Express.js API server
├── packages/
│   ├── ai-agents/              # AI agent implementations and orchestration
│   ├── shared/                 # Common utilities and types
│   └── ui/                     # Shared UI components (planned)
├── tools/
│   └── cli/                    # FlashFusion CLI tools
├── knowledge-base/             # Extracted patterns and templates
├── restore-session.js          # Session restoration system
└── turbo.json                  # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 10+

### Installation
```bash
# Clone and install
git clone <repository-url>
cd turborepo-flashfusion
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev
```

## 🎯 Project Milestones

FlashFusion follows a structured milestone-driven development approach with 5 defined phases:

### Current Milestone Status
```bash
# View current milestone progress
npm run ff -- milestone status

# Export milestones for GitHub creation
npm run ff -- milestone sync
```

### Development Phases
- **🔴 Phase 1: Core Platform Setup** (HIGH Priority - 2 weeks)
  - Foundational monorepo structure
  - flashfusion-ide integration
  - Agent orchestration system
  - Essential packages creation

- **🟡 Phase 2: Enhanced Development** (MEDIUM Priority - 2 weeks)  
  - Enhanced CLI and development tools
  - Comprehensive testing framework
  - UI component library with Storybook
  - Code generation templates

- **🟢 Phase 3: Production Infrastructure** (LOW Priority - 2 weeks)
  - CI/CD pipeline implementation
  - Security and monitoring utilities
  - Deployment automation
  - Performance optimization

- **🔧 Phase 4: Repository Integration** (SPECIALIZED - 3 weeks)
  - Complete ecosystem integration
  - Memory and research systems
  - Template repositories
  - Multi-language wrappers

- **⚡ Phase 5: Quality & Optimization** (CONTINUOUS)
  - Ongoing code quality improvements
  - Performance monitoring
  - Security enhancements
  - Documentation maintenance

See [docs/MILESTONES.md](./docs/MILESTONES.md) for detailed milestone documentation.

## 📦 Package Scripts

### Root Level Commands
```bash
npm run build          # Build all packages
npm run dev             # Start development servers
npm run lint            # Lint all packages
npm run clean           # Clean all build outputs
npm run restore-state   # Restore session context
npm run ff              # Run FlashFusion CLI
npm run commit-check    # Check staged commit size before committing
```

### 🔒 Commit Size Enforcement

This repository enforces atomic commits to maintain code quality:

```bash
# Automatic enforcement (runs on every commit)
git commit -m "feat: your changes"    # Size checked automatically

# Manual size checking
npm run commit-check                  # Check current staged changes
git commit-size                       # Git alias for size check
git atomic-add file1.js file2.js     # Stage files and show size

# Commit splitting helpers
git unstage-all                       # Clear staging area
git split-commit                      # Undo last commit for splitting
```

**Size Limits:**
- 🚨 **Hard limit**: 500 lines changed (blocks commit)
- ⚠️ **Warning**: 200+ lines changed (allows but warns)
- ⚠️ **File limit**: 10+ files changed (warning)

**Emergency bypass:** `HUSKY=0 git commit -m "large change"`

### 🔄 Repository Migration Commands
```bash
# Migration Management
npm run ff -- migrate help              # Show migration help
npm run ff -- migrate all               # Run complete migration
npm run ff -- migrate phase1-ai         # Integrate AI & Agent repositories
npm run ff -- migrate phase1-data       # Integrate Data & Crawling repositories

# Validation & Testing  
npm run ff -- validate quick            # Quick validation
npm run ff -- validate all              # Complete validation
npm run ff -- validate build            # Test build system

# Documentation
npm run ff -- docs migration            # View migration plan
npm run ff -- docs checklist            # View migration checklist
```

### Individual Package Development
```bash
# Web application
cd apps/web && npm run dev

# API server
cd apps/api && npm run dev

# CLI tools
cd tools/cli && node ff-cli.js
```

## 🧠 FlashFusion Features

All FlashFusion capabilities are now integrated into this monorepo:

- **🤖 AI Agents**: Multi-agent orchestration system
- **🔄 Workflows**: Automated business process workflows  
- **🎛️ Dashboard**: Web-based management interface
- **🔌 Integrations**: Supabase, Anthropic Claude, OpenAI
- **📊 Analytics**: Performance tracking and optimization
- **🛠️ CLI Tools**: Command-line interface for automation

## 🔧 Development

### Adding New Packages
```bash
# Generate new workspace
npx turbo gen workspace --name=my-package --type=package

# Or manually create in packages/ directory
mkdir packages/my-package
cd packages/my-package
npm init -y
```

### Session Management

The repository includes an intelligent session restoration system:

```bash
# Restore your previous working context
npm run restore-state

# View next recommended steps
npm run next-steps
```

This will:
- ✅ Analyze current environment status
- ✅ Restore working directory context
- ✅ Generate next actionable steps
- ✅ Display project health status

## 📚 Knowledge Base

The `knowledge-base/` directory contains:
- **best-practices.md**: Development guidelines and patterns
- **agent-patterns.js**: Reusable AI agent patterns
- **deployment-templates.json**: Deployment configurations

## 🔄 Turborepo Benefits

This monorepo structure provides:

- **⚡ Fast Builds**: Intelligent caching and parallelization
- **🔗 Shared Dependencies**: Optimized package management
- **🎯 Focused Development**: Work on specific packages independently
- **📈 Scalability**: Easy to add new applications and packages
- **🛠️ Developer Experience**: Unified tooling and workflows

## 🚀 Deployment

### Development
```bash
npm run dev
# Web app: http://localhost:3000
# API: http://localhost:8000 (if configured)
```

### Production
```bash
npm run build
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make atomic commits** (follow size limits - see enforcement above)
4. Use conventional commit format: `feat:`, `fix:`, `docs:`, etc.
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

**Commit Guidelines:**
- Use conventional commit format: `type(scope): description`
- Keep commits under 500 lines changed
- Split large changes into logical atomic commits
- Use the commit message template: `git commit` (without -m)

## 📚 Documentation

### Core Documentation
- [FlashFusion Overview](./README-flashfusion.md)
- [Repository Requirements](./REPOSITORY-REQUIREMENTS.md)
- [Best Practices](./knowledge-base/best-practices.md)
- [AI Agent Patterns](./knowledge-base/agent-patterns.js)
- [Commit Workflow Guide](./docs/COMMIT-WORKFLOW.md)
- [AI Development Guide](./CLAUDE.md)
- [Repository Guidelines](./AGENTS.md)

### Migration Documentation
- [**Monorepo Integration Plan**](./docs/MONOREPO-INTEGRATION-PLAN.md) - Complete integration strategy for all Krosebrook repositories
- [**Migration Checklist**](./docs/MIGRATION-CHECKLIST.md) - Step-by-step migration checklist
- [**Migration Tools**](./tools/README.md) - Tools and scripts for repository integration

### External Resources
- [Turborepo Docs](https://turborepo.com/docs)

## 🆘 Support

### Development Support
- Run `npm run restore-state` for context restoration
- Check `knowledge-base/` for development patterns
- Review logs in `.turborepo-state.json` for session history

### Migration Support
- Use `npm run ff -- validate quick` to check integration status
- Review `docs/MIGRATION-CHECKLIST.md` for step-by-step guidance
- Run `npm run ff -- migrate help` for migration commands
- Check `validation-report.txt` for detailed validation results

### Common Issues
- **Build failures**: Run `npm run ff -- validate build` to diagnose
- **Missing repositories**: Check integration plan with `npm run ff -- docs migration`
- **Package issues**: Use `npm run ff -- validate packages` to verify configurations

---

**🎯 Ready to build AI-powered business automation? Start with `npm run dev`**

Built with ❤️ using Turborepo + FlashFusion
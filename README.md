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

## 📦 Package Scripts

### Root Level Commands
```bash
npm run build          # Build all packages
npm run dev             # Start development servers
npm run lint            # Lint all packages
npm run clean           # Clean all build outputs
npm run restore-state   # Restore session context
npm run ff              # Run FlashFusion CLI
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
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📖 Documentation

- [FlashFusion Overview](./README-flashfusion.md)
- [Best Practices](./knowledge-base/best-practices.md)
- [AI Agent Patterns](./knowledge-base/agent-patterns.js)
- [Turborepo Docs](https://turborepo.com/docs)

## 🆘 Support

- Run `npm run restore-state` for context restoration
- Check `knowledge-base/` for development patterns
- Review logs in `.turborepo-state.json` for session history

---

**🎯 Ready to build AI-powered business automation? Start with `npm run dev`**

Built with ❤️ using Turborepo + FlashFusion
# FlashFusion Monorepo Migration Tools

This directory contains tools and scripts for migrating and integrating repositories into the turborepo-flashfusion monorepo.

## 📁 Files Overview

### Migration Scripts
- **`migrate-repositories.sh`** - Automated repository integration script
- **`validate-migration.sh`** - Validation and testing script for migration status

### CLI Integration  
- **`cli/ff-cli.js`** - Enhanced CLI with migration commands

## 🚀 Quick Start

### 1. View Migration Plan
```bash
npm run ff -- docs migration
npm run ff -- docs checklist
```

### 2. Validate Current State
```bash
npm run ff -- validate quick
# or
./tools/validate-migration.sh quick
```

### 3. Run Migration (Phased Approach)
```bash
# Phase 1: Core AI & Data
npm run ff -- migrate phase1-ai
npm run ff -- migrate phase1-data

# Phase 2: Development Tools
npm run ff -- migrate phase2

# Phase 3: Monitoring & Infrastructure  
npm run ff -- migrate phase3

# Phase 4: Memory & Research
npm run ff -- migrate phase4

# Utilities
npm run ff -- migrate utilities
npm run ff -- migrate references

# Configuration Updates
npm run ff -- migrate config
```

### 4. Complete Migration (All at Once)
```bash
npm run ff -- migrate all
```

## 🔍 Available Commands

### Migration Commands
```bash
npm run ff -- migrate help              # Show migration help
npm run ff -- migrate phase1-ai         # Integrate AI & Agent repositories
npm run ff -- migrate phase1-data       # Integrate Data & Crawling repositories
npm run ff -- migrate phase2            # Integrate Development Tools
npm run ff -- migrate phase3            # Integrate Monitoring & Infrastructure
npm run ff -- migrate phase4            # Integrate Memory & Research
npm run ff -- migrate utilities         # Integrate utility repositories
npm run ff -- migrate references        # Create reference documentation
npm run ff -- migrate config            # Update configuration files
npm run ff -- migrate all               # Run complete migration
```

### Validation Commands
```bash
npm run ff -- validate quick            # Quick validation (recommended)
npm run ff -- validate all              # Complete validation
npm run ff -- validate build            # Test build system
npm run ff -- validate packages         # Validate package configurations
npm run ff -- validate structure        # Validate directory structure
npm run ff -- validate phase1-ai        # Validate Phase 1 AI integrations
npm run ff -- validate phase1-data      # Validate Phase 1 Data integrations
npm run ff -- validate phase2           # Validate Phase 2 integrations
npm run ff -- validate phase3           # Validate Phase 3 integrations
npm run ff -- validate phase4           # Validate Phase 4 integrations
npm run ff -- validate utilities        # Validate utility integrations
npm run ff -- validate references       # Validate reference documentation
```

### Documentation Commands
```bash
npm run ff -- docs migration            # View migration plan
npm run ff -- docs checklist            # View migration checklist
```

## 📋 Migration Process

### Pre-Migration Checklist
1. **Backup current state**
   ```bash
   git checkout -b backup-before-migration
   git push origin backup-before-migration
   ```

2. **Verify current build**
   ```bash
   npm install
   npm run build
   npm run test
   ```

3. **Review documentation**
   - Read `docs/MONOREPO-INTEGRATION-PLAN.md`
   - Review `docs/MIGRATION-CHECKLIST.md`

### Migration Phases

#### Phase 1: Core Platform (High Priority)
- **AI & Agent Orchestration**: activepieces, claude-code, claude-flow, agentops, etc.
- **Web Crawling & Data**: firecrawl ecosystem, enhanced-scraper, react-cloner

#### Phase 2: Development Tools (Medium Priority)  
- **UI Framework**: heroui, heroui-cli, zod, stagehand
- **Templates**: vite-heroui, nextjs-app, portfolio templates

#### Phase 3: Monitoring & Infrastructure (Medium Priority)
- **Monitoring**: uptime-kuma, oneuptime, Checkmate
- **Infrastructure**: firebase-tools, supabase components, terraform templates

#### Phase 4: Memory & Research (Specialized)
- **Memory Systems**: mem0, letta (Python with TypeScript wrappers)
- **Research**: gpt-researcher (Python with TypeScript wrapper)

#### Phase 5: Utilities & References
- **Utilities**: d1-rest, login, sqlfluff, yt-dlp, pipedream
- **References**: Business systems, security tools, awesome collections

### Post-Migration Tasks
1. **Update configurations** (turbo.json, package.json)
2. **Test builds and functionality**
3. **Update documentation**
4. **Validate all integrations**

## 🛠 Script Details

### migrate-repositories.sh
- Automated git subtree integration
- Backup creation before each integration
- Build testing after each phase
- Support for both subtree and copy strategies

### validate-migration.sh  
- Directory structure validation
- Package configuration checks
- Build system testing
- Integration status reporting
- Success metrics calculation

## 📊 Success Metrics

### Technical Metrics
- ✅ All packages build successfully
- ✅ No TypeScript errors
- ✅ Build time < 10 minutes
- ✅ Development server starts < 60 seconds

### Functional Metrics
- ✅ AI agents functional
- ✅ Workflow automation working
- ✅ Data crawling operational
- ✅ UI components usable
- ✅ Templates functional

### Developer Experience
- ✅ Hot reload working across apps
- ✅ Shared components usable
- ✅ CLI tools functional
- ✅ Documentation complete
- ✅ Onboarding time < 2 hours

## 🔄 Rollback Procedures

### Emergency Rollback
```bash
git reset --hard backup-before-migration
git push origin main --force-with-lease
```

### Selective Rollback
```bash
git revert <problematic-commit-range>
git push origin main
```

### Package-Level Rollback
```bash
git rm -r <problematic-package>
git commit -m "Remove problematic package integration"
```

## 📚 Documentation

### Primary Documents
- **`docs/MONOREPO-INTEGRATION-PLAN.md`** - Complete integration strategy
- **`docs/MIGRATION-CHECKLIST.md`** - Step-by-step migration checklist

### Generated Reports
- **`validation-report.txt`** - Latest validation results
- **`krosebrook-repositories-*.json`** - Repository discovery data

## 🎯 Best Practices

### Before Migration
1. Always create backup branches
2. Test current build state
3. Review integration plan thoroughly
4. Understand rollback procedures

### During Migration
1. Migrate in phases, not all at once
2. Test builds after each integration
3. Validate functionality before proceeding
4. Document any issues encountered

### After Migration
1. Run complete validation
2. Update team documentation
3. Test all critical workflows
4. Monitor for performance issues

## 🤝 Contributing

When adding new migration capabilities:

1. **Update Scripts**: Add new repository patterns to migration scripts
2. **Update Validation**: Add corresponding validation checks
3. **Update Documentation**: Update integration plan and checklist
4. **Test Thoroughly**: Validate on isolated branch before merging

## 📞 Support

For migration issues:
1. Check validation reports first
2. Review error logs in script output
3. Consult troubleshooting section in migration checklist
4. Create backup and attempt rollback if necessary

---

**Total Estimated Migration Time**: 6-8 weeks
**Recommended Approach**: Phased migration with validation between phases
**Key Success Factor**: Thorough testing and validation at each step
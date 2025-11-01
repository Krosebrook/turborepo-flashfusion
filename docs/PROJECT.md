# TurboRepo FlashFusion Project

## Project Overview
**Repository**: https://github.com/Krosebrook/turborepo-flashfusion.git
**Type**: Monorepo using TurboRepo architecture
**Current Branch**: `cicd-clean`
**Main Branch**: `master`

## ⚠️ Critical Setup Issue

### Current Situation
The git repository is initialized at the Windows user home directory (`C:\Users\kyler`), which means:
- The entire user directory is being version controlled
- Over 35,000 files are being tracked
- This includes personal files, system files, and all installed programs

### Recommended Fix
```bash
# 1. Create a proper project directory
mkdir C:\Users\kyler\projects
cd C:\Users\kyler\projects

# 2. Clone the repository properly
git clone https://github.com/Krosebrook/turborepo-flashfusion.git
cd turborepo-flashfusion

# 3. Work from the project directory
# All development should happen here, not in the home directory
```

## Repository Structure (Current State)

```
C:\Users\kyler\              # ⚠️ Git root (should be project folder)
├── .gitignore              # ✅ Added to exclude dev tools
├── docs/                   # Documentation folder
│   ├── PROGRESS.md        # Current progress tracking
│   ├── PROJECT.md         # This file
│   ├── DECISIONS.md       # Architectural decisions
│   └── TODO.md           # Task tracking
├── .git/                  # Git repository data
├── go/                    # Go modules and packages
├── AppData/              # Windows application data
├── Documents/            # User documents
└── [many other user directories]
```

## Technology Stack
Based on repository analysis:
- **Monorepo Tool**: TurboRepo
- **Languages**: JavaScript/TypeScript, Go, Python
- **Package Managers**: npm, go mod, pip
- **Version Control**: Git with Git LFS
- **CI/CD**: GitHub Actions (inferred from branch name)

## Development Environment
- **OS**: Windows 10/11 (MINGW64_NT-10.0-26100)
- **Shell**: Git Bash (MinGW)
- **Node.js**: Installed (version to be determined)
- **Go**: Installed (with modules in ~/go)
- **Python**: Installed
- **Tools**:
  - Chocolatey package manager
  - Various CLI tools (aws-cli, azure-cli, gh, etc.)
  - Docker (dockerignore present)
  - Encore framework

## Known Issues

### 1. Repository Location
- **Issue**: Git repo at user home directory
- **Impact**: Tracks entire filesystem
- **Solution**: Move to dedicated project directory

### 2. Git LFS Errors
- **Issue**: LFS smudge filter failures in go/pkg/mod
- **Impact**: Some binary files may not sync properly
- **Solution**: Run `git lfs pull` or reconfigure LFS

### 3. Large Repository Size
- **Issue**: Tracking thousands of unnecessary files
- **Impact**: Slow git operations, large clone size
- **Solution**: Properly scope repository to project files only

## Access & Permissions
- **GitHub Repo**: Public/Private status unknown
- **Collaborators**: To be determined
- **Branch Protection**: Not configured (direct commits to branch)

## Next Steps for New Developer

1. **Fix Repository Structure**:
   - Clone repo to proper location
   - Move project files out of home directory
   - Update remote URLs if needed

2. **Clean Working Directory**:
   - Use .gitignore to exclude unnecessary files
   - Remove tracked files that shouldn't be in repo
   - Consider using `git filter-branch` to clean history

3. **Setup Development Environment**:
   - Verify all dependencies are installed
   - Run `npm install` for JavaScript dependencies
   - Configure IDE with proper project root

4. **Review Documentation**:
   - Read CLAUDE.md for AI partnership guidelines
   - Check TODO.md for pending tasks
   - Review DECISIONS.md for architectural context

## Contact & Support
- **Repository Owner**: Krosebrook
- **Project Type**: TurboRepo-based application
- **Documentation**: Located in /docs folder
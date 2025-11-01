# Commit Size Management & Splitting Workflow

## Overview
This document outlines tools and practices for maintaining atomic commits and avoiding large, unwieldy commits in the repository.

## 🚫 The Problem: Large Commits
- **10,000+ line commits** are hard to review, debug, and revert
- Mixed concerns make it difficult to understand changes
- Increases risk of introducing bugs across multiple features
- Makes Git history less useful for debugging

## ✅ The Solution: Atomic Commits

### Installed Tools

#### 1. CommitLint Configuration
- **File**: `commitlint.config.js`
- **Purpose**: Enforces conventional commit format
- **Rules**:
  - Subject max 72 characters
  - Body max 100 characters per line
  - Required type prefixes (feat, fix, docs, etc.)

#### 2. Commit Size Checker
- **File**: `scripts/check-commit-size.js`
- **Limits**:
  - ❌ **Hard limit**: 500 lines changed
  - ⚠️ **Warning**: 200+ lines changed
  - ⚠️ **File count**: 10+ files changed
- **Auto-runs** on every commit via pre-commit hook

#### 3. Git Hooks (Husky)
- **Pre-commit**: Runs size checker before commit
- **Commit-msg**: Validates commit message format
- **Files**: `.husky/pre-commit`, `.husky/commit-msg`

#### 4. Commit Message Template
- **File**: `~/.gitmessage.txt`
- **Usage**: `git commit` (without -m) opens template
- **Includes**: Format guidelines and best practices

## 🔧 New Git Aliases

```bash
# Check size of staged changes
git commit-size

# Stage files and immediately see size impact
git atomic-add <files>

# Unstage everything to start fresh
git unstage-all

# Split the last commit (if you just committed something too large)
git split-commit
```

## 📋 Workflow for Large Changes

### Option 1: Proactive Splitting (Recommended)

```bash
# 1. Start fresh
git unstage-all

# 2. Group related files for first logical change
git add src/auth/login.js src/auth/types.ts
git atomic-add src/auth/login.js src/auth/types.ts  # Shows size
git commit -m "feat(auth): add login service with types"

# 3. Continue with next logical group
git add components/LoginForm.tsx components/SignupForm.tsx
git commit -m "feat(auth): add login and signup UI components"

# 4. Repeat until all changes are committed
```

### Option 2: Reactive Splitting (After Large Commit)

```bash
# If you just made a large commit:
git split-commit                    # Resets to before the commit
git unstage-all                     # Clear staging area
# Now follow Option 1 workflow above
```

### Option 3: Interactive Rebase (History Rewrite)

⚠️ **Use only on your own feature branches**

```bash
# Split multiple large commits
git rebase -i HEAD~3               # Last 3 commits
# In the editor:
# - Change 'pick' to 'edit' for commits to split
# - Save and close

# For each commit marked 'edit':
git reset HEAD~1                   # Split the commit
git unstage-all
# Use Option 1 workflow to create atomic commits
git rebase --continue

# When done:
git push --force-with-lease        # Safely force push
```

## 🎯 Best Practices

### Commit Size Guidelines
- **Ideal**: < 200 lines changed
- **Acceptable**: 200-500 lines changed
- **Avoid**: 500+ lines changed

### Logical Grouping
- **✅ Good**: All files related to one feature/fix
- **✅ Good**: Tests with their corresponding source files
- **❌ Bad**: UI changes mixed with API changes
- **❌ Bad**: Bug fixes mixed with new features

### Commit Message Best Practices
```bash
# ✅ Good examples
feat(auth): add JWT token validation
fix(api): handle null user in profile endpoint
docs: update API documentation for v2 endpoints
refactor(ui): extract common button components

# ❌ Bad examples
fix stuff and add feature and update docs
WIP
Fixed bug
```

## 🚨 Emergency: Bypass Size Limits

If you absolutely must commit a large change:

```bash
# Temporary bypass (use sparingly)
HUSKY=0 git commit -m "feat: large migration - splitting in follow-up commits"

# Then immediately create follow-up commits to split the changes:
git commit -m "refactor: extract user service from migration"
git commit -m "refactor: separate UI components from migration"
```

## 📊 Monitoring & Metrics

### Check Your Commit History
```bash
# See commit sizes over time
git log --oneline --stat | head -20

# Find your largest commits
git rev-list --count HEAD                    # Total commits
git log --pretty=format:"%h %s" --stat | grep -E "files? changed"
```

### Pre-commit Output Example
```
🔍 Running pre-commit checks...
📊 Commit Size Check:
   Files changed: 3
   Total lines changed: 45
✅ Commit size check passed
🔍 Checking commit message format...
✅ Pre-commit checks completed
```

## 🔄 Integration with Existing Workflow

This system integrates with your existing tools:
- **Turborepo**: Size limits apply per commit, not per package
- **ESLint/Prettier**: Run via lint-staged in pre-commit
- **CI/CD**: Hooks ensure clean commits reach main branch
- **Code Review**: Smaller commits = faster, better reviews

## 📚 Additional Resources

- [Conventional Commits](https://conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
- [Atomic Commits Guide](https://www.codewithjason.com/atomic-commits-testing/)

---

**Remember**: The goal is maintainable, reviewable code history. When in doubt, split it out! 🎯
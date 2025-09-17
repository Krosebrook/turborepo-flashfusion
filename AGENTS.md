# Repository Guidelines & Development Standards

## 🎯 Project Structure & Module Organization

- `apps/web/`: Next.js 14 dashboard; page routes live under `pages/` and shared React features under `src/` with Tailwind styles in `styles/`.
- `apps/api/`: Express-based orchestration service; `main.js` bootstraps middleware while agent endpoints and webhooks sit in dedicated folders (`webhooks/`, `auth/`).
- `packages/ai-agents/`: Core agent logic split into `core/`, `orchestration/`, and `workflows/`; import from here instead of duplicating agent code in apps.
- `packages/shared/`: Cross-cutting types and helpers (`types/`, `utils/`); prefer adding new shared contracts here so both web and API stay in sync.
- `tools/cli/`: FlashFusion CLI (`ff-cli.js`) drives migrations and validation; extend this when adding automation tasks.

## 🚀 Build, Test, and Development Commands

- `npm run dev`: Runs `turbo dev` to start all watch-mode targets; narrow scope with `npx turbo run dev --filter @flashfusion/web` (or `@flashfusion/api`) when iterating.
- `npm run build`: Executes `turbo build` across workspaces, respecting dependency graph outputs.
- `npm run lint` / `npm run format`: Aggregated ESLint and Prettier passes; add package-level scripts so these commands stay green.
- `npm run type-check`: Ensures TypeScript projects emit no type errors before merging.
- `npm run test`: Reserved for Turborepo-wide test execution; place coverage reports under `coverage/` to benefit from caching.
- `npm run ff -- <subcommand>`: Access CLI utilities (e.g., `npm run ff -- validate quick`, `npm run ff -- migrate all`).
- `npm run commit-check`: Check staged commit size before committing (enforces 500-line limit).

## 🔒 Commit Size Enforcement & Quality Standards

This repository enforces atomic commits to maintain high code quality and reviewability:

### Automatic Enforcement
Every commit is automatically checked for:
- **Size limits**: Hard 500-line limit, 200-line warning
- **File count**: Warning at 10+ files changed
- **Message format**: Conventional commits required (`feat:`, `fix:`, `docs:`, etc.)

### Commit Workflow Tools
```bash
# Check before committing
npm run commit-check                  # Manual size check
git commit-size                       # Git alias for staged changes
git atomic-add file1.js file2.js     # Stage files and show impact

# Splitting large commits
git unstage-all                       # Clear staging area
git split-commit                      # Undo last commit
git rebase -i HEAD~3                  # Interactive split (own branches only)

# Emergency bypass (use sparingly)
HUSKY=0 git commit -m "large migration - will split in follow-ups"
```

### Best Practices for Atomic Commits
- **One logical change per commit**: If you use "and" in the subject, split it
- **Group related files**: Tests with source, UI components together
- **Dependencies first**: Config changes before code that uses them
- **Documentation with implementation**: Update docs in same commit as feature
- **Breaking changes**: Call out clearly in commit message and body

## 🎨 Coding Style & Naming Conventions

- Format with Prettier defaults (2-space indentation, single quotes) via `npm run format`; never hand-roll whitespace.
- Follow ESLint recommendations; extend `.eslintrc` locally when introducing new syntax and keep warnings at zero.
- React components and TypeScript types use `PascalCase`; hooks and utilities stay `camelCase`; Next.js page files remain `kebab-case`.
- Tailwind classes group by layout → spacing → color to aid diff reviews.

## ✅ Testing Guidelines

- Co-locate unit specs as `*.test.ts` (or `.tsx/.js`) beside the code or in `__tests__/`; lint ignores test-only globals.
- Use Jest + React Testing Library in `apps/web`, and Jest + Supertest for `apps/api`; share fixtures from `packages/shared` when possible.
- Target ≥80% line coverage (per knowledge-base guidance) and commit generated `coverage/` reports only when CI requires proof.
- Document any new test scripts inside the package `README` or `package.json` so `turbo test` can discover them.

## 📝 Commit & Pull Request Guidelines

### Commit Message Format
```bash
# Required format: type(scope): description
feat(auth): add JWT token validation
fix(api): handle null user in profile endpoint
docs: update API documentation for v2 endpoints
refactor(ui): extract common button components

# Avoid these formats
# ❌ "fix stuff and add feature"
# ❌ "WIP"
# ❌ "Fixed bug"
```

### Commit Size Guidelines
- **✅ Ideal**: < 200 lines changed
- **⚠️ Acceptable**: 200-500 lines changed (warning shown)
- **❌ Blocked**: 500+ lines changed (commit rejected)

### Pull Request Standards
- Include focused commits per concern (UI, API, tooling) so partial reverts stay safe in a monorepo.
- Pull requests must outline scope, linked issues, local test commands, and—for UI tweaks—before/after screenshots or Loom links.
- Request reviews from owners of affected workspaces and call out breaking changes in the PR description and `changeset` if applicable.
- **Each PR should pass all size checks**: No commits over 500 lines unless explicitly justified

## 🔐 Security & Configuration Tips

- Duplicate `.env.example` to `.env.local`; never commit secrets. Required vars include `ANTHROPIC_API_KEY`, `SUPABASE_URL`, and datastore URLs referenced in `turbo.json` `globalEnv`.
- When adding new integrations, guard API routes with middleware in `apps/api/auth/` and document required scopes in `docs/`.
- CLI additions should respect the session restoration flow (`npm run restore-state`) so other agents recover context reliably.

## 🔧 Development Workflow Integration

### With Existing Tools
This commit enforcement integrates seamlessly with:
- **Turborepo**: Size limits apply per commit, not per package
- **ESLint/Prettier**: Formatting runs in pre-commit hooks
- **CI/CD**: Clean commits ensure smooth deployments
- **Code Review**: Smaller commits = faster, better reviews

### Session Management Compatibility
The enforcement system works with the existing session restoration:
- `npm run restore-state`: Includes commit size in environment analysis
- `.turborepo-state.json`: Tracks commit enforcement status
- Session context includes recent commit patterns and sizes

### Emergency Procedures
If you absolutely must commit large changes:
1. Use `HUSKY=0 git commit -m "feat: large migration - splitting in follow-ups"`
2. **Immediately** create follow-up commits to break down the change:
   ```bash
   git add specific-files-group-1
   git commit -m "refactor: extract user service from migration"
   git add specific-files-group-2
   git commit -m "refactor: separate UI components from migration"
   ```

## 📊 Quality Metrics & Monitoring

### Tracking Commit Health
```bash
# Check your recent commit sizes
git log --oneline --stat | head -10

# Find largest commits in history
git log --pretty=format:"%h %s" --stat | grep "files changed"

# Repository-wide size analysis
npm run ff -- validate commits  # Future CLI command
```

### Success Indicators
- ✅ Average commit size < 100 lines
- ✅ <5% of commits need warnings
- ✅ Zero commits blocked by size limits
- ✅ Faster code review turnaround
- ✅ Easier debugging with focused commits

---

**🎯 Remember**: These guidelines exist to maintain code quality, enable better reviews, and make the repository easier to navigate and debug. When in doubt, split it out!

For comprehensive commit workflow guidance, see [docs/COMMIT-WORKFLOW.md](./docs/COMMIT-WORKFLOW.md).
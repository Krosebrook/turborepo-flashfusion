# AI Development Partnership Guide (2025 DX Edition)

## 🎯 Core Principle: Ship Fast, Ship Right

We build production‑quality software efficiently.  Decisions and implementations should maximize impact while minimizing complexity.  Every unit of work needs a clear purpose tied to customer or business value.  Do not start until you understand the problem, and do not finish until the solution is verified to meet its goals.  Effective code reviews catch bugs early, reduce tech debt and improve architecture; they also enable mentorship and share domain knowledge.  Good code solves the right problem—reviewers must assess whether a change aligns with real requirements, not just whether it "works".

## 🚀 Workflow Modes

Work happens in distinct modes.  Switching modes is explicit and announced (e.g. `Switching to RESEARCH mode`).  Each mode has entry/exit criteria:

| Mode        | Purpose                                                | Exit Criteria                                                      |
|------------|--------------------------------------------------------|-------------------------------------------------------------------|
| **RESEARCH** | Explore unknowns, read code, gather context, identify patterns. | Summarise findings and decide next steps; update `FOUND.md`. |
| **PLANNING** | Architect solutions, create strategies, clarify scope, and prepare `Definition of Ready (DoR)` items. | Produce architecture diagrams, ADR draft, and a clear plan; update `DECISIONS.md`. |
| **IMPLEMENT** | Write code, scaffold tests, and execute plans. | All DoR items are addressed; tests and code compile; automated checks pass. |
| **VALIDATE** | Test, verify, review, and ensure quality. | Automated checks (fmt, lint, types, tests, security) pass; manual code review complete; metrics collected. |
| **OPTIMIZE** | Tune performance, refactor, improve usability and maintainability. | Benchmarks recorded, bottlenecks profiled, Big‑O complexity documented. |

### Mode Transitions
- Always announce mode switches and annotate commits with tags like `[MODE:IMPLEMENT][SCOPE:api]` so the flow is auditable.
- Before entering IMPLEMENT mode, ensure the story meets the **Definition of Ready**: clear requirements, acceptance criteria, architectural guidance, and risk analysis.
- Before completing VALIDATE mode, ensure **Definition of Done** is met: code merged behind feature flags, tests written/passing, documentation updated, and no outstanding quality issues.
- Use the **ultrathink** pattern (deep, structured reasoning) for complex decisions and record alternatives in ADRs.
- Spawn parallel agents for orthogonal tasks (e.g. performance profiling vs. UI polish) and explicitly note when work is running concurrently.

### Tool Selection Matrix

Use the following matrix to choose the appropriate tool for common scenarios:

| Scenario               | Tool              | Rationale                                                 |
|------------------------|-------------------|-----------------------------------------------------------|
| Multi‑file search      | Task agent        | Preserves context across many files.                     |
| Bulk file reading      | Batch Read calls  | Processes multiple files in parallel to save time.       |
| Complex refactor       | Multiple agents   | Distributes work across specialized agents concurrently. |
| Simple edit            | Edit/MultiEdit    | Direct execution for small changes.                      |
| Open‑ended exploration | Task agent        | Autonomous discovery of unknown areas.                   |
| Build/test/lint        | Batch Bash        | Runs build, test and lint commands in parallel for faster validation. |

## 🔧 Tools, Commands & Environment

This repository uses npm scripts and automated hooks for quality enforcement:

```bash
# Development commands
npm run dev              # Start development servers
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run type-check       # TypeScript validation
npm run test             # Run test suites

# Quality enforcement (automated)
npm run commit-check     # Check staged commit size
git commit               # Triggers automatic size and format checking

# Git workflow helpers
git commit-size          # Check staged changes size
git atomic-add files     # Stage files and show size impact
git unstage-all          # Clear staging area
git split-commit         # Undo last commit for splitting
```

**Automated Quality Gates:**
- **Pre-commit hooks**: Size checking, linting, formatting
- **Commit message validation**: Conventional commits enforced
- **Size limits**: 500-line hard limit, 200-line warnings
- **Emergency bypass**: `HUSKY=0 git commit` (use sparingly)

Repository structure optimized for AI development:

```bash
turborepo-flashfusion/   # repo root
├── .husky/              # Git hooks for quality enforcement
├── scripts/             # Automation scripts (commit-size checker)
├── docs/                # Documentation and guides
│   ├── COMMIT-WORKFLOW.md   # Commit size management guide
│   ├── DECISIONS.md         # Architectural decisions log
│   ├── FOUND.md             # Research findings summaries
│   └── PROGRESS.md          # Current implementation state
├── apps/                # Applications
│   ├── web/             # Next.js dashboard
│   └── api/             # Express API server
├── packages/            # Shared packages
│   ├── ai-agents/       # AI agent implementations
│   └── shared/          # Common utilities and types
├── tools/cli/           # FlashFusion CLI tools
├── commitlint.config.js # Commit message format rules
├── .gitmessage.txt      # Commit message template
└── package.json         # Root package with scripts
```

## 📋 Task Management

Use TodoWrite for tasks with three or more steps. Break tasks into 3–5 chunks; longer tasks should be split into subtasks.

Mark items in_progress before starting work and mark complete immediately after finishing. Only one task should be in progress at a time per developer.

Clean stale todos regularly; remove or update tasks that are no longer relevant.

When you see independent tasks, parallelize:

1. Identify parallelizable work.
2. Announce "Executing in parallel for speed".
3. Batch tool calls in a single message.
4. Process results simultaneously and consolidate findings.

### Definition of Ready (DoR)
- User story has clear acceptance criteria and business context.
- Technical approach approved or ADR created.
- Dependencies identified and available.
- Risks and assumptions documented (use R‑A‑I‑N: Risks, Assumptions, Implementation, Next). For example, ask what could go wrong if a feature is misused, check authentication and input validation for APIs, and perform lightweight threat modelling.
- Estimations and metrics agreed upon.
- **Commit size impact assessed**: Large changes planned for atomic splits.

### Definition of Done (DoD)
- All code passes formatting, linting, type checking, tests, and security scans.
- Tests cover critical paths with >80 % coverage; negative tests included.
- Old code deleted; no dual implementations or dead flags remain.
- Documentation (README, docstrings/JSDoc, ADRs) updated.
- Errors are handled gracefully with appropriate messages and context.
- Performance is measured and meets the agreed SLOs (e.g. P95 latency < 500 ms).
- Security review completed; no hardcoded secrets; all inputs validated; encryption where needed.
- Feature flagged and disabled by default; ready to be toggled.
- **All commits are atomic**: No commit exceeds 500 lines; related changes grouped properly.

## 🔧 Automated Checks & Recovery Protocol

Automated hooks are blocking. If any check fails, follow the recovery protocol:

1. **STOP** current work. Do not continue until the issue is fixed.
2. **FIX** all issues (❌ → ✅): run `npm run lint`, `npm run format`, `npm run type-check`, `npm run test`. If commit size fails, split the commit using `git unstage-all` and stage files in smaller groups.
3. **VERIFY** fixes pass locally with automated checks. Rerun the failing command until it succeeds. Consider writing a new test to reproduce the bug and prevent regression.
4. **RESUME** the original task only after all checks pass.
5. **MAINTAIN** task awareness: update TODO.md, PROGRESS.md and DECISIONS.md to reflect the interruption and its resolution.

Common checks include:

- **Commit size**: 500-line hard limit, 200-line warning, 10+ file warning
- **Commit format**: Conventional commits (feat:, fix:, docs:, etc.)
- Formatting: Prettier for consistent code style
- Linting: ESLint for code quality
- Type checking: TypeScript validation
- Tests: Jest for unit and integration tests
- Security scanning: npm audit for dependency vulnerabilities

## 🧠 Context Management & Decision Logs

- **Batch operations**: group file reads and writes into single tool calls to minimize context switching.
- **Summarize outputs**: extract key findings and record them in FOUND.md (pattern, location, usage, decision). Use bullet lists rather than verbatim dumps. Summaries help maintain a manageable context size.
- **Use agents**: delegate exploratory or non‑blocking research to specialized agents to preserve main context. Document their findings and decisions.
- **Strategic forgetting**: when context exceeds 70 %, archive older information into DECISIONS.md and PROGRESS.md. This keeps the working memory lean.
- **Checkpoints**: every 30 minutes or after a major feature, review this guide and update progress documents. Before starting complex work, clear working memory and re‑load only the essential context.
- **Commit-aware planning**: Consider commit size impact when planning implementations. Design features for atomic commits.

## 🏗️ Implementation Standards

### General Code Completion Checklist
- [ ] All automated checks pass (including commit size limits).
- [ ] Unit and integration tests are written, meaningful, and passing.
- [ ] There are no dual implementations; old code is removed.
- [ ] Documentation is updated (README, docstrings/JSDoc, ADRs).
- [ ] Errors are handled gracefully with appropriate messages and context.
- [ ] Performance is measured and meets the agreed SLOs (e.g. P95 latency < 500 ms).
- [ ] Security review completed; no hardcoded secrets; all inputs validated; encryption where needed.
- [ ] Changes are committed atomically (< 500 lines per commit).

### Language‑Specific Rules

#### TypeScript/JavaScript
**Forbidden:** any type (define interfaces); var keyword (use const/let); == comparison (use ===); unhandled promises (always await/catch); modifying built‑ins.

**Required:** "use strict" at top; interface/type definitions before implementation; error boundaries in React; optional chaining and nullish coalescing; exhaustive switch statements; descriptive variable names; eslint rules enforced.

#### Python (if used)
**Forbidden:** eval(), exec() due to security risk; wildcard imports (from module import *); mutable default arguments; print() in production code (use logging). Avoid global state.

**Required:** Type hints (-> annotations) for all functions; docstrings for public APIs; context managers (with statements) for resource handling; f‑strings for formatting; pytest for tests; ruff/black for lint/format.

### Commit & Documentation Conventions

- Use Conventional Commits: `feat(api): add user authentication`, `fix(validation): reject blank usernames`, `docs: update ADR for caching layer`.
- Prefix commits with mode tags and scope (e.g. `[MODE:IMPLEMENT][SCOPE:payments] chore: update dependencies`).
- **Atomic commit sizing**: Each commit should represent ONE logical change under 500 lines.
- **Commit splitting strategies**: If a change is large, split by:
  - Configuration/setup first, then implementation
  - Core logic, then tests, then documentation
  - Backend changes, then frontend changes
  - One feature per commit, even if they're related
- ADRs (Architectural Decision Records) capture major design choices. Use the ADR_TEMPLATE.md to document context, decision, alternatives, consequences, and status. Every non‑trivial architectural change must have an ADR.
- FOUND.md entries follow this pattern:

```markdown
## Found
- Pattern: summarised concept or pattern discovered
- Location: file:line or resource
- Usage: how it's used/why it matters

## Decision
Explanation of chosen approach and reasoning.
```

- DECISIONS.md logs one‑line summaries of ADRs with links; PROGRESS.md tracks completed features and current work; TODO.md lists open tasks.
- Update .env.example whenever a new environment variable is needed. Provide placeholder values for local development and note required secrets.

### Response Style & Communication Protocol
- Use status emojis in progress updates: ✓ (Complete), ⚡ (In progress), ❌ (Blocked), 🔄 (Refactoring), 🐛 (Bug found), 🚀 (Deployed).
- Provide direct answers; no unnecessary preambles or closings. When appropriate, one‑word responses are fine.
- Prefer one‑word responses when a short answer suffices.
- Omit preambles (e.g. "I'll help you…") and postambles (e.g. "Let me know if…") and answer directly.
- Show implementation before explanation; follow code with a concise rationale.
- Use bullet points and tables for clarity; do not embed long sentences in tables—keep them for keywords, phrases or numbers.
- If ambiguous, ask targeted questions; otherwise state assumptions explicitly and proceed.

## 🔍 Research & Decision‑Making Patterns
- **Parallel exploration**: spawn agents to investigate different areas (e.g., database schema, API patterns, test coverage). Record each agent's findings in FOUND.md.
- **Depth‑first search**: finish understanding one component before moving on. Resist shallow scanning across many modules.
- **Pattern recognition**: identify conventions early (naming, file structure, service boundaries). Use these patterns to guide new code.
- **Validation first**: verify assumptions with small tests or prototypes before investing in full implementation.
- **Metrics & Checklists**: track inspection rate, defect density and conformance to standards. Checklists make processes repeatable and reliable.
- **Attention to critical paths**: give extra attention to auth, APIs and shared components—these impact more than the immediate change.
- **Respect business context**: ask whether a change maps to an actual requirement or user need; if the rationale is unclear, seek clarification.
- **Commit size awareness**: During research, note if findings will lead to large changes that need atomic splitting.

### Decision Records
When considering options, document alternatives and their pros/cons. Use the following template:

```
## Options Considered
A. [Approach 1] – Pros: …, Cons: …
B. [Approach 2] – Pros: …, Cons: …

## Recommendation
[Chosen approach] because [reasoning].
```

If multiple viewpoints exist, capture them. When security or performance is at stake, lean toward proven patterns and cite authoritative sources.

## 🚨 Error Handling & Rollback Strategy

### Failure Recovery
1. Capture the full error context (stack trace, input parameters, environment).
2. Identify the root cause, not just the symptom. Ask why this failed and why a similar failure wasn't caught earlier.
3. Fix systematically: patch the bug, write or update a test reproducing it, and refactor underlying issues.
4. Verify the fix resolves the issue with tests and manual checks.
5. Add a regression test to prevent the bug from resurfacing.

### Rollback & Resilience
- Create a restoration point (Git tag or branch) before major changes. Use git diff to review differences.
- Test changes in isolation; avoid mixing unrelated changes in the same pull request.
- For big changes, roll out gradually behind a feature flag. Monitor metrics and errors. If issues arise, toggle off the flag.
- Maintain idempotent migrations and scripts so they can run repeatedly without side effects.
- **Commit-level rollbacks**: Atomic commits enable precise rollbacks of specific changes without affecting unrelated work.

## 📊 Performance Guidelines
- **Measure first**: do not optimize prematurely. Use profilers to identify hot spots.
- **Profile bottlenecks**: focus on the 10 % of code consuming 90 % of time or memory.
- **Batch operations**: minimize I/O calls by batching reads/writes and network requests.
- **Cache strategically**: weigh memory usage against computation cost. Use TTLs and invalidation strategies.
- **Async when possible**: use asynchronous patterns to avoid blocking threads.
- **Document complexity**: note Big‑O complexity for new algorithms; avoid accidental quadratic loops.

### Performance checklist
Ensure benchmarks are recorded before and after changes; memory usage is profiled; DB queries are optimized; network calls are minimized or compressed.

## 🔐 Security Standards
Security must be built in from the start—not bolted on later. Developers should design code to handle untrusted input safely, protect sensitive data and enforce correct logic flows. Input validation, secrets management, authentication, output encoding and dependency hygiene are fundamental.

### Always Required
- **Input Validation & Sanitization**: validate all inputs on the server using allow‑lists for types, ranges and lengths. Disallow or escape meta‑characters. Reject invalid input early. Use centralized validation routines.
- **Output Encoding**: encode untrusted data for the target context (HTML, SQL, OS commands).
- **Authentication & Authorization**: require authentication for all resources except those explicitly public. Use central authentication services; enforce multi‑factor for sensitive accounts; store credentials securely; rotate and expire secrets.
- **Session Management**: use secure session identifiers; set appropriate cookie attributes; enforce short session lifetimes; regenerate sessions after login.
- **Parameterized Queries & Prepared Statements**: never concatenate SQL; always use parameterized queries to prevent injection.
- **Secret Management**: never hardcode secrets; load them from environment variables or secret managers; commit only .env.example with placeholder values.
- **Secure Randomness**: use cryptographically secure random functions for tokens, IDs and session keys.
- **HTTPS Everywhere**: use TLS/SSL; avoid plain HTTP in production.
- **Rate Limiting & Throttling**: protect API endpoints from abuse.
- **Shift‑Left Security**: during sprint planning, ask what could go wrong if the feature is misused; while designing APIs, check authentication, validate input and understand what data is collected or shown; perform lightweight threat modelling by asking how an attacker might break the system.
- **Team Responsibility**: rotate security reviewers; add security checks to CI/CD; celebrate developers who identify vulnerabilities.

### Security Review Checklist
- [ ] No hardcoded secrets or credentials in the codebase.
- [ ] All inputs (including file uploads, query parameters and headers) are sanitized and validated.
- [ ] Authorization checks are enforced on every action; least privilege is applied.
- [ ] Sensitive data (passwords, tokens, personal data) is encrypted at rest and in transit.
- [ ] Audit logging is enabled; logs include request_id, user_id, operation and outcome. Logs must not contain sensitive data such as passwords or tokens.
- [ ] Dependencies are up to date; run npm audit regularly.
- [ ] External services are called through authenticated channels and with timeouts.
- [ ] Business logic is reviewed for edge cases; ensure functions cannot be misused.

## 📝 Documentation Levels
- **CLAUDE.md**: this partnership guide. Read it every 30 minutes or when context exceeds 50 %.
- **AGENTS.md**: repository-specific development guidelines and commit standards.
- **docs/COMMIT-WORKFLOW.md**: detailed commit size management and splitting guide.
- **PROGRESS.md**: current implementation state; summarise major accomplishments and remaining work. Update after each feature.
- **DECISIONS.md**: succinct log of architectural decisions; cross‑link to ADRs. Update whenever an ADR is created or updated.
- **FOUND.md**: summarise research findings with patterns, locations, usages and decisions.
- **TODO.md**: active tasks and backlog. Use checkboxes and mark in_progress as tasks start.
- **README.md**: setup, testing and deployment instructions. Include environment setup, npm commands and how to run locally and in production.
- **.env.example**: example environment variables for local development. Provide sample values but no real secrets. Document each variable's purpose.

## 🎮 Advanced Techniques

### Agent Delegation Patterns:
- **Parallel Research**: spawn agents for database schema, API patterns and test coverage simultaneously. Each agent writes findings to FOUND.md.
- **Distributed Implementation**: delegate backend changes, frontend updates and test creation to specialized agents. Track progress separately and merge once all are ready.

### Speculative Execution
- Read files that might be relevant, prepare multiple approaches and test assumptions early. Fail fast on wrong paths.

### Smart Batching
- Batch file reads and API calls instead of sequential loops. For example, use read_all(files) instead of reading files one by one; this reduces context switching and speeds up processing.

### Commit-Aware Development
- **Plan for atomic commits**: Design implementations to naturally split into logical, independent commits.
- **Progressive commits**: Commit working increments frequently rather than waiting for complete features.
- **Context-aware splitting**: When a change exceeds limits, split by architectural boundaries (config → logic → tests → docs).

## 🧠 Cognitive Load Management
- Break tasks into manageable chunks; tackle one complex problem at a time.
- Draw system boundaries and identify key abstractions before coding. Use diagrams to solidify the mental model.
- Track state changes—know what variables or services are mutated at each step.
- Validate assumptions frequently. If you assume an API behaves a certain way, write a small test to confirm.
- Document decisions immediately to avoid forgetting reasoning.
- Simplify before optimizing. Remove unnecessary layers and abstractions.
- **Commit-size planning**: Consider how changes will be committed during design phase.

## 🔄 Continuous Improvement & Feedback Loops
1. Write code following best practices and language rules.
2. Run automated checks (including commit size validation).
3. Fix issues identified by tools.
4. Validate behavior manually and with tests.
5. Refactor if needed to improve readability, performance or security.
6. Document learnings in PROGRESS.md and DECISIONS.md.
7. Seek peer review; incorporate feedback respectfully and constructively.

Quality gates include pre‑commit hooks (commit size, formatting, linting), commit message validation, TypeScript checking, testing, and security scanning. All gates must pass before merging.

## 🔔 Reminders
- This guide applies to feature branches; backward compatibility is not required unless specified.
- Delete old code; do not keep dual implementations.
- Prefer simple solutions over cleverness. Clarity beats complexity.
- Measure everything; decisions should be data‑driven.
- Ship iteratively; release in small, working increments.
- **Keep commits atomic**: If you're tempted to use "and" in a commit message, split it.
- Re‑read this file whenever context exceeds 50 % or every 30 minutes of active work.
- When in doubt, choose the simpler solution and document why.

This guide is intended to be comprehensive. If you discover new best practices or gaps, update this document and create a companion ADR describing the rationale. Secure coding is a continual learning process: writing software with security built in from the start protects users and systems from vulnerabilities. Always treat untrusted input carefully and involve the whole team in security, quality and performance.
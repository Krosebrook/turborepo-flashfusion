# GitHub Copilot Custom Agents - Symphony of Roles

## Overview

This directory contains **17 specialized GitHub Copilot Custom Agents** implementing the **Symphony of Roles** architecture for the FlashFusion source-of-truth monorepo.

The Symphony of Roles architecture enables 11+ specialized AI personas to collaborate across 6 development phases using RACI accountability matrices, ensuring clear ownership and handoffs throughout the product lifecycle.

## Agent Directory

| File | Role | Description |
|------|------|-------------|
| `visionary.agent.md` | Product Strategist | Market research, competitive analysis, strategic roadmap |
| `product.agent.md` | Product Manager | User stories, backlog prioritization, sprint planning |
| `ux.agent.md` | UX Designer | User research, personas, journey mapping, wireframes |
| `ui.agent.md` | UI Designer | Design tokens, component specs, brand consistency |
| `mobile.agent.md` | Mobile Developer | React Native, iOS/Android, platform guidelines |
| `database.agent.md` | Database Architect | Supabase schema, RLS policies, migrations |
| `test.agent.md` | QA Engineer | Test planning, unit/E2E tests, coverage analysis |
| `deploy.agent.md` | DevOps Engineer | CI/CD, GitHub Actions, infrastructure |
| `security.agent.md` | Security Analyst | Security audits, OWASP, vulnerability scanning |
| `growth.agent.md` | Growth Strategist | Marketing campaigns, ASO, SEO, retention |
| `analyst.agent.md` | Business Analyst | Requirements gathering, feasibility studies, RACI |
| `docs.agent.md` | Documentation Specialist | README, JSDoc, ADRs, CHANGELOG |
| `api.agent.md` | API Designer | REST design, OpenAPI specs, Zod schemas |
| `automation.agent.md` | Workflow Automation | n8n workflows, webhooks, integrations |
| `review.agent.md` | Code Review Specialist | PR reviews, code quality, security review |
| `refactor.agent.md` | Refactoring Specialist | Code improvement, SOLID principles, DRY |
| `debug.agent.md` | Debugging Specialist | Error tracing, root cause analysis, profiling |

## RACI Matrix by Development Phase

The RACI matrix defines responsibilities across the 6 development phases:

| Phase | Responsible (R) | Accountable (A) | Consulted (C) | Informed (I) |
|-------|-----------------|-----------------|---------------|--------------|
| **Discovery** | Visionary, Analyst | Product | UX, Security | Growth |
| **Design** | UX, UI | Product | Visionary | Growth |
| **Build** | Mobile, Database, Deploy | Product | Security, Test | UI |
| **Release** | Test, Deploy | Product | Security | Growth |
| **Growth** | Growth | Visionary | Product | UX |
| **Maintenance** | Deploy, Test, Security | Product | Database | Visionary |

### RACI Legend
- **R (Responsible)**: Does the work to complete the task
- **A (Accountable)**: Final approval authority and ownership
- **C (Consulted)**: Provides input before decisions are made
- **I (Informed)**: Kept updated on progress and decisions

## Usage Instructions

### GitHub.com

1. Navigate to any issue, PR, or file in the repository
2. Open the Copilot chat panel
3. Invoke an agent using the `@` syntax:
   ```
   @visionary-agent Analyze market positioning for our new feature
   @test-agent Create unit tests for the UserService class
   ```

### VS Code with GitHub Copilot

1. Open the repository in VS Code
2. Open Copilot Chat (Ctrl/Cmd + Shift + I)
3. Use agent invocations:
   ```
   @database-agent Design a schema for user preferences
   @review-agent Review my staged changes for security issues
   ```

### Copilot CLI

```bash
# Use with GitHub Copilot CLI
gh copilot suggest "using @deploy-agent create a GitHub Actions workflow for staging"
```

## Requirements

### Copilot Subscription Tiers

| Feature | Copilot Individual | Copilot Business | Copilot Enterprise |
|---------|-------------------|------------------|-------------------|
| Custom Agents | ❌ | ✅ | ✅ |
| Agent File Support | ❌ | ✅ | ✅ |
| Enterprise Context | ❌ | ❌ | ✅ |

**Minimum Requirement**: GitHub Copilot Business or Enterprise subscription

### Repository Configuration

Custom agents are automatically discovered from `.github/agents/*.agent.md` files. No additional configuration is required.

## Monorepo Context

This FlashFusion monorepo consolidates **53 repositories** with:

- **Package Manager**: pnpm 9.x with workspaces (npm for root)
- **Build Tool**: Turbo for monorepo orchestration
- **Language**: TypeScript throughout
- **Database**: Supabase with Row Level Security
- **CI/CD**: GitHub Actions
- **Security**: gitleaks, Renovate, pnpm audit
- **Testing**: Vitest/Jest with coverage requirements

All agents are pre-configured with this tech stack context.

## Contributing

When adding or modifying agents:

1. Follow the established `.agent.md` file format with YAML frontmatter
2. Include all required sections (Role Definition, Core Responsibilities, Security Boundaries, etc.)
3. Ensure Security Boundaries are specific and actionable
4. Provide 3+ realistic Invocation Examples
5. Test the agent in Copilot Chat before committing

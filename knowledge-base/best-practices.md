# FlashFusion Turborepo Development Best Practices

## Architecture Principles

### Monorepo Structure
```
apps/           # Deployable applications (Next.js, Express, etc.)
packages/       # Shared libraries and components
tools/          # CLI tools and development utilities
knowledge-base/ # Extracted patterns and templates
```

### Package Organization
- **apps/web**: Main Next.js application
- **apps/api**: Express API server
- **apps/dashboard**: Admin dashboard
- **packages/ui**: Shared UI components (React, Tailwind)
- **packages/shared**: Common utilities and types
- **packages/ai-agents**: AI agent implementations
- **tools/cli**: Custom CLI tools

## AI Agent Development

### Core Patterns (from 22 repo analysis)
1. **Orchestrator Pattern**: Central agent coordination
2. **Context Management**: Persistent state across agent interactions
3. **Communication Bus**: Inter-agent messaging system
4. **Workflow Engine**: Step-by-step process execution

### Agent Implementation Guidelines
```typescript
interface Agent {
  id: string;
  type: AgentType;
  execute(task: Task, context: Context): Promise<AgentResult>;
  canHandle(task: Task): boolean;
}
```

## Deployment Best Practices

### Environment Configuration
- Use `.env.local` for local development
- Environment-specific configs in knowledge-base/
- Never commit API keys to repository

### CI/CD Pipeline
1. **Build**: `turbo build` - Builds all packages
2. **Test**: `turbo test` - Runs all test suites
3. **Lint**: `turbo lint` - Code quality checks
4. **Deploy**: Platform-specific deployment configs

## Code Quality Standards

### TypeScript Usage
- Strict mode enabled for all packages
- Shared types in `packages/shared/types`
- Interface-first development

### Testing Strategy
- Unit tests for all utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- 80% minimum test coverage

### Performance Optimization
- Bundle analysis with `turbo analyze`
- Code splitting at package boundaries
- Shared dependencies optimization
- Cache configuration tuning

## State Management

### Session Persistence (.turborepo-state.json)
```json
{
  "lastSession": { "workingDirectory", "currentTask" },
  "environment": { "dependencies", "buildStatus" },
  "knowledgeBase": { "lastScan", "patterns" },
  "nextSteps": ["array of next actions"]
}
```

### Context Restoration
- Automatic working directory restoration
- Environment status checking
- Next steps generation
- Progress tracking

## Security Considerations

### API Key Management
- Environment variables only
- Rotation every 90 days
- Separate keys per environment
- Access logging and monitoring

### Code Security
- ESLint security rules enabled
- Dependency vulnerability scanning
- Input validation on all endpoints
- Rate limiting on public APIs

# GitHub Actions Agent for CI/CD Error Resolution

## Overview

The GitHub Actions Agent is a specialized AI agent within the FlashFusion orchestration system designed to analyze CI/CD pipeline failures and provide automated remediation solutions. This agent can diagnose, categorize, and often automatically fix common GitHub Actions workflow failures.

## Agent Role

The agent is identified by the role `github_actions_agent` within the FlashFusion Digital Product Orchestrator system.

## Key Capabilities

### 🔧 Auto-Fix (Priority 1)
- **Failed Tests**: Detects flaky tests and provides retry patterns
- **Build Errors**: Fixes missing package.json scripts and dependency issues  
- **Linting/Formatting**: Auto-corrects ESLint/Prettier violations

### 🛠️ Guided Fix (Priority 2)  
- **Environment Variables**: Generates templates for missing secrets
- **Permission Issues**: Validates GitHub token scopes and file permissions
- **Dependencies**: Provides lock file recovery and cache invalidation strategies

### 👥 Human Required (Priority 3)
- **Script Failures**: Complex shell command debugging
- **Architecture Issues**: Cross-platform compatibility problems
- **Custom Deployments**: Service-specific deployment failures

## Usage Examples

### Basic Usage

```javascript
const orchestrator = new DigitalProductOrchestrator();

// Create request for CI/CD error resolution
const agent = { role: 'github_actions_agent' };
const request = {
    projectId: 'my-project',
    description: 'CI pipeline failing on test execution with dependency resolution errors'
};
const context = {
    project: {
        phase: 'deployment',
        framework: 'Node.js',
        lastBuildStatus: 'failed',
        environment: 'staging'
    }
};

const prompt = orchestrator.buildFlashFusionAgentPrompt(agent, request, context);
// Send prompt to AI service for analysis and remediation
```

### Sample Output Format

The agent provides structured responses in this format:

```markdown
## 🚨 Critical Fix Required
**Error Type:** Dependency Installation (Priority 2)
**Impact:** Build blocking
**Confidence:** High auto-fix success rate

### Quick Fix (Copy-Paste Ready)
```bash
git checkout -b fix/ci-error-$(date +%s)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json to resolve dependency conflicts"
```

### Workflow File Updates
```yaml
- name: Clear and reinstall dependencies
  if: failure()
  run: |
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install
```

### ROOT CAUSE ANALYSIS
- **What Failed**: Package installation step due to corrupted lock file
- **Why It Failed**: Dependency version conflicts in package-lock.json
- **Blast Radius**: All subsequent build and test steps
- **Prevention**: Add lock file validation to pre-commit hooks

### VALIDATION CHECKLIST
- [x] Local reproduction confirmed
- [x] Fix tested in isolation  
- [x] No breaking changes introduced
- [x] Security implications reviewed
- [x] Performance impact assessed

### ROLLBACK PLAN
```bash
# If fix causes issues, run:
git revert [commit-hash]
# Or restore previous workflow:
git checkout HEAD~1 -- .github/workflows/
```

## Error Categories

### Build Failures
- Missing scripts in package.json
- Outdated dependencies with known vulnerabilities
- Path resolution issues
- Module import/export problems

### Test Failures  
- Flaky tests requiring retry logic
- Environment-specific test failures
- Race conditions in parallel execution
- Missing test dependencies

### Deployment Issues
- Environment variable misconfiguration
- Permission and access token problems
- Service connectivity failures
- Resource allocation limits

### Security Concerns
- Exposed secrets in logs
- Insecure dependency versions
- Permission escalations
- Unvalidated external inputs

## Security Guardrails

### Never Auto-Fix
- Secrets or API keys in logs
- Permission escalations without approval
- External service integrations
- Database migrations or schema changes

### Always Validate
- No sensitive data exposure in fixes
- Least-privilege principle maintained  
- Dependencies from trusted sources only
- Rollback procedures tested

### Escalation Triggers
- Multiple related failures across projects
- Security-related error patterns
- Infrastructure or vendor service issues
- Fixes requiring production access

## Integration with FlashFusion

The GitHub Actions agent integrates seamlessly with:

1. **Digital Product Orchestrator**: Central coordination system
2. **Workflow State Manager**: Tracks deployment pipeline states
3. **Performance Monitor**: Measures fix effectiveness
4. **Context Manager**: Maintains project and error context

## Common Error Patterns

### Test Retry Pattern
```yaml
if: contains(github.event.head_commit.message, 'skip-tests') == false
run: |
  npm test -- --maxWorkers=1 --runInBand || \
  npm test -- --maxWorkers=1 --runInBand || \
  npm test -- --maxWorkers=1 --runInBand
```

### Environment Validation
```yaml
- name: Validate required environment
  run: |
    required_vars=("DATABASE_URL" "API_KEY" "NODE_ENV")
    for var in "${required_vars[@]}"; do
      if [ -z "${!var}" ]; then
        echo "::error::Missing required environment variable: $var"
        exit 1
      fi
    done
```

### Dependency Recovery
```yaml
- name: Clear and reinstall dependencies
  if: failure()
  run: |
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install
```

## Monitoring and Analytics

The agent tracks:
- Fix success rates by error category
- Time to resolution metrics
- Rollback frequency and causes
- Security incident prevention

## Getting Started

1. Ensure FlashFusion orchestrator is initialized
2. Set up GitHub Actions workflows with error handling
3. Configure appropriate secrets and environment variables
4. Enable the agent through the FlashFusion dashboard
5. Monitor CI/CD pipeline health and automated fixes

## Support

For issues or questions about the GitHub Actions agent:
- Check the FlashFusion documentation
- Review agent logs in the orchestrator dashboard
- Escalate complex issues to the DevOps team
- Contribute improvements to the agent prompt system

---

**Target**: Automate 80% of common CI/CD failures with immediate, safe fixes and comprehensive rollback procedures.
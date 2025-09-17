# FlashFusion Dependency Update Agent

Automated dependency checking and PR creation for security and updates in the FlashFusion monorepo.

## Features

- 🔍 **Comprehensive Scanning**: Scans all package.json files across the monorepo
- 🛡️ **Security Vulnerability Detection**: Uses npm audit to identify security issues
- 📊 **Detailed Reporting**: Generates JSON reports with complete update information
- 🔄 **Automated Updates**: Can apply updates automatically with the `--apply` flag
- 🔀 **GitHub PR Creation**: Automatically creates pull requests for dependency updates
- 🧪 **Build Testing**: Tests build after applying updates before committing

## Usage

### Check for outdated dependencies (scan only)
```bash
npm run deps:check
# or
node tools/dependency-update-agent.js
```

### Apply updates and create PR
```bash
npm run deps:update  
# or
node tools/dependency-update-agent.js --apply
```

### Via FF CLI
```bash
npm run ff deps:check      # Scan only
npm run ff deps:update     # Apply updates
```

## Environment Variables

To enable automatic PR creation, set:
- `GITHUB_TOKEN`: Personal access token with repo permissions

## Output

The agent generates:
- **Console Output**: Real-time progress and summary
- **JSON Report**: `dependency-update-report.json` with detailed findings
- **Git Branch**: `dependency-updates-YYYY-MM-DD` (when using --apply)
- **Pull Request**: Automatically created with detailed description

## Report Structure

```json
{
  "timestamp": "2025-09-17T10:21:29.193Z",
  "summary": {
    "total_packages_scanned": 6,
    "outdated_dependencies": 40,
    "packages_with_outdated": 6,
    "security_vulnerabilities": 0,
    "critical_vulnerabilities": 0
  },
  "outdated_dependencies": {
    "package.json": {
      "turbo": "^2.5.6",
      "@turbo/gen": "^2.5.6"
    }
  },
  "vulnerabilities": {...},
  "recommendations": [...]
}
```

## Integration

The dependency update agent is integrated with:
- **FF CLI**: Available as `ff:deps:check` and `ff:deps:update`
- **npm scripts**: `npm run deps:check` and `npm run deps:update`
- **CI/CD**: Can be integrated into workflows for automated dependency monitoring

## Dependencies

Requires:
- `npm-check-updates`: For dependency checking (auto-installed if missing)
- `dotenv`: For environment variable loading
- `git`: For branch management and commits
- GitHub token: For PR creation (optional)

## Examples

### Scan for updates
```bash
$ npm run deps:check

🤖 FlashFusion Dependency Update Agent v1.0.0
ℹ Starting dependency analysis...
🔍 Scanning for Outdated Dependencies
⚠ Found 7 outdated dependencies in package.json
🛡️ Scanning for Security Vulnerabilities
✓ No security vulnerabilities found!
📊 Generating Dependency Update Report
```

### Apply updates and create PR
```bash
$ npm run deps:update

🤖 FlashFusion Dependency Update Agent v1.0.0
🔄 Applying Dependency Updates
🧪 Testing build after updates...
✓ Build successful after updates
🔀 Creating Pull Request for Dependency Updates
✓ Pull request created: https://github.com/owner/repo/pull/123
🎉 Dependency update PR created successfully!
```
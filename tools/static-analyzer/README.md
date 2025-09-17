# FlashFusion Static Analyzer

A comprehensive static analysis tool for detecting security vulnerabilities and code quality issues in the FlashFusion codebase.

## Features

### Security Analysis
- **Hardcoded Secrets Detection**: Finds API keys, passwords, and tokens hardcoded in source code
- **SQL Injection Detection**: Identifies potential SQL injection vulnerabilities
- **XSS Vulnerability Detection**: Detects cross-site scripting risks
- **Weak Cryptography**: Identifies use of deprecated or weak cryptographic methods
- **Prototype Pollution**: Detects potential prototype pollution vulnerabilities
- **Unsafe File Operations**: Identifies path traversal and unsafe file handling
- **Debug Information Exposure**: Finds debug statements that may leak sensitive data
- **Insecure Dependencies**: Detects use of known vulnerable or outdated packages

### Quality Analysis
- **Code Complexity**: Identifies overly complex functions that need refactoring
- **Long Functions**: Detects functions that are too long and hard to maintain
- **Magic Numbers**: Finds hardcoded numbers that should be constants
- **Unused Code**: Identifies unused variables and imports
- **Inconsistent Naming**: Detects naming convention violations
- **Missing Error Handling**: Finds async operations without proper error handling
- **Code Duplication**: Identifies duplicate code patterns
- **Deprecated APIs**: Detects usage of deprecated JavaScript APIs

## Installation

The static analyzer is included as part of the FlashFusion monorepo.

```bash
# Install dependencies (from the root of the repository)
npm install
```

## Usage

### Command Line Interface

```bash
# Analyze the entire codebase
npm run analyze:all

# Security analysis only (medium+ severity)
npm run analyze:security

# Quality analysis only
npm run analyze:quality

# Custom analysis
node tools/static-analyzer/src/cli.js scan [options]
```

### CLI Options

```
Options:
  -p, --path <path>           Path to scan (default: current directory)
  -o, --output <file>         Output report file
  -f, --format <format>       Output format: json, text, html (default: text)
  --severity <level>          Minimum severity: low, medium, high, critical (default: low)
  --include-quality           Include quality checks (default: false)
  --include-security          Include security checks (default: true)
  --exclude <patterns>        Exclude patterns (comma-separated)
```

### Examples

```bash
# Basic security scan
node tools/static-analyzer/src/cli.js scan --include-security

# Full analysis with JSON output
node tools/static-analyzer/src/cli.js scan \
  --include-security \
  --include-quality \
  --output report.json \
  --format json

# High severity issues only
node tools/static-analyzer/src/cli.js scan \
  --include-security \
  --severity high

# Analyze specific directory
node tools/static-analyzer/src/cli.js scan \
  --path apps/web/src \
  --include-quality

# Generate HTML report
node tools/static-analyzer/src/cli.js scan \
  --include-security \
  --include-quality \
  --output security-report.html \
  --format html
```

## Integration with CI/CD

### GitHub Actions

Add to your `.github/workflows/security.yml`:

```yaml
name: Security Analysis
on: [push, pull_request]

jobs:
  security-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run analyze:security
      
      - name: Upload security report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-analysis-report
          path: security-analysis-report.*
```

### Pre-commit Hook

Add to your `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run analyze:security"
    }
  }
}
```

## Configuration

### Excluding Files

Create a `.staticanalyzer.json` config file:

```json
{
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.min.js",
    "**/vendor/**"
  ],
  "rules": {
    "security": {
      "hardcoded-secrets": "error",
      "sql-injection": "error",
      "xss-vulnerability": "error"
    },
    "quality": {
      "console-statements": "warn",
      "todo-comments": "info"
    }
  }
}
```

## Security Rules

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `hardcoded-secrets` | Critical | Detects hardcoded API keys, passwords, and tokens |
| `sql-injection` | High | Identifies potential SQL injection vulnerabilities |
| `xss-vulnerability` | High | Detects cross-site scripting risks |
| `prototype-pollution` | High | Finds prototype pollution vulnerabilities |
| `unsafe-eval` | High | Detects unsafe code execution patterns |
| `weak-crypto` | Medium | Identifies weak cryptographic practices |
| `insecure-random` | Medium | Finds weak random number generation |
| `unsafe-redirect` | Medium | Detects open redirect vulnerabilities |
| `unsafe-file-operations` | Medium | Identifies unsafe file handling |
| `insecure-dependencies` | Medium | Detects vulnerable dependencies |
| `debug-info-exposure` | Low | Finds debug information leaks |

## Quality Rules

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `code-complexity` | Medium | High cyclomatic complexity |
| `missing-error-handling` | Medium | Missing error handling in async code |
| `duplicate-code` | Medium | Potential code duplication |
| `deprecated-apis` | Medium | Usage of deprecated APIs |
| `long-functions` | Low | Functions that are too long |
| `magic-numbers` | Low | Hardcoded numbers without names |
| `todo-comments` | Low | TODO/FIXME comments |
| `unused-variables` | Low | Potentially unused variables |
| `unused-imports` | Low | Unused import statements |
| `inconsistent-naming` | Low | Naming convention violations |
| `console-statements` | Low | Console statements in code |
| `inefficient-loops` | Low | Inefficient loop patterns |

## Output Formats

### Text Format (Default)
Human-readable console output with colors and formatting.

### JSON Format
Machine-readable JSON for integration with other tools:

```json
{
  "findings": [
    {
      "rule": "hardcoded-secrets",
      "title": "Hardcoded Secrets Detection",
      "description": "Detects potentially hardcoded secrets...",
      "severity": "critical",
      "file": "src/config.js",
      "line": 42,
      "category": "security",
      "recommendation": "Move sensitive values to environment variables"
    }
  ],
  "stats": {
    "filesScanned": 150,
    "securityIssues": 5,
    "qualityIssues": 23,
    "severityBreakdown": {
      "critical": 1,
      "high": 2,
      "medium": 8,
      "low": 17
    }
  },
  "duration": 1250,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTML Format
Styled HTML report for sharing and archiving.

## Exit Codes

- `0`: No high or critical severity issues found
- `1`: High or critical severity issues found
- `2`: Analysis failed due to error

## Contributing

### Adding New Rules

1. Add the rule to the appropriate rules file (`src/rules/security.js` or `src/rules/quality.js`)
2. Include regex patterns or implement custom analysis logic
3. Add tests for the new rule
4. Update documentation

### Rule Structure

```javascript
{
  id: 'rule-id',
  name: 'Human Readable Name',
  description: 'Description of what this rule detects',
  severity: 'low|medium|high|critical',
  patterns: [
    /regex-pattern/gi
  ]
}
```

## Troubleshooting

### Common Issues

1. **False Positives**: Adjust regex patterns or add context-aware filtering
2. **Performance**: Large codebases may take time; consider using `--exclude` patterns
3. **Memory Usage**: For very large repositories, analyze in smaller chunks

### Debug Mode

Add `DEBUG=1` environment variable for verbose output:

```bash
DEBUG=1 npm run analyze:security
```

## License

MIT License - see LICENSE file for details.
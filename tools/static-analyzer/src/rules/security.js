class SecurityRules {
  constructor() {
    this.rules = [
      {
        id: 'hardcoded-secrets',
        name: 'Hardcoded Secrets Detection',
        description: 'Detects potentially hardcoded secrets, API keys, and credentials',
        severity: 'critical',
        patterns: [
          /(?:password|pwd|secret|key|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
          /(?:api[_-]?key|access[_-]?token|private[_-]?key)\s*[:=]\s*['"][^'"]{16,}['"]/gi,
          /sk_[a-zA-Z0-9]{24,}/g, // Stripe secret keys
          /pk_[a-zA-Z0-9]{24,}/g, // Stripe public keys
          /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
          /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g, // GitHub fine-grained PATs
          /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
          /AKIA[0-9A-Z]{16}/g, // AWS access keys
          /[a-zA-Z0-9/+]{40}/g // Generic base64 encoded secrets
        ]
      },
      {
        id: 'sql-injection',
        name: 'SQL Injection Vulnerability',
        description: 'Detects potential SQL injection vulnerabilities',
        severity: 'high',
        patterns: [
          /query\s*\(\s*['"][^'"]*\+[^'"]*['"]/gi,
          /execute\s*\(\s*['"][^'"]*\+[^'"]*['"]/gi,
          /\$\{[^}]*\}\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi
        ]
      },
      {
        id: 'xss-vulnerability',
        name: 'Cross-Site Scripting (XSS)',
        description: 'Detects potential XSS vulnerabilities',
        severity: 'high',
        patterns: [
          /innerHTML\s*=\s*[^;]*(?:\+|concat)/gi,
          /document\.write\s*\([^)]*(?:\+|concat)/gi,
          /eval\s*\(/gi,
          /dangerouslySetInnerHTML/gi
        ]
      },
      {
        id: 'weak-crypto',
        name: 'Weak Cryptographic Practices',
        description: 'Detects use of weak or deprecated cryptographic methods',
        severity: 'medium',
        patterns: [
          /\bMD5\b/gi,
          /\bSHA1\b(?![0-9])/gi,
          /\bDES\b(?![a-zA-Z])/gi,
          /\bRC4\b/gi,
          /Math\.random\(\)(?=.*(?:token|key|secret|password|salt))/gi // For cryptographic purposes
        ]
      },
      {
        id: 'insecure-random',
        name: 'Insecure Random Number Generation',
        description: 'Detects use of weak random number generators for security-sensitive operations',
        severity: 'medium',
        patterns: [
          /Math\.random\(\).*(?:token|key|secret|password|salt)/gi
        ]
      },
      {
        id: 'debug-info-exposure',
        name: 'Debug Information Exposure',
        description: 'Detects potential exposure of debug information',
        severity: 'low',
        patterns: [
          /console\.log\s*\([^)]*(?:password|secret|key|token)/gi,
          /console\.error\s*\([^)]*(?:password|secret|key|token)/gi,
          /\.stack/gi
        ]
      },
      {
        id: 'insecure-dependencies',
        name: 'Potentially Insecure Dependencies',
        description: 'Detects use of potentially insecure or outdated dependencies',
        severity: 'medium',
        patterns: [
          /"express"\s*:\s*"[^"]*\^?[0-3]\./gi, // Old Express versions
          /"lodash"\s*:\s*"[^"]*\^?[0-3]\./gi, // Old Lodash versions
          /"moment"\s*:/gi // Deprecated moment.js
        ]
      },
      {
        id: 'prototype-pollution',
        name: 'Prototype Pollution',
        description: 'Detects potential prototype pollution vulnerabilities',
        severity: 'high',
        patterns: [
          /\[['"]__proto__['"]\]/gi,
          /\[['"]constructor['"]\]/gi,
          /\[['"]prototype['"]\]/gi,
          /Object\.assign\s*\(\s*[^,]*,\s*(?!{})[^)]*\)/gi
        ]
      },
      {
        id: 'unsafe-redirect',
        name: 'Unsafe Redirect',
        description: 'Detects potential open redirect vulnerabilities',
        severity: 'medium',
        patterns: [
          /\.redirect\s*\(\s*(?!['"][^'"]*['"])[^)]*\)/gi,
          /location\.href\s*=\s*[^;]*(?:\+|concat)/gi
        ]
      },
      {
        id: 'unsafe-file-operations',
        name: 'Unsafe File Operations',
        description: 'Detects potentially unsafe file operations',
        severity: 'medium',
        patterns: [
          /fs\.readFile\s*\([^,]*\+/gi,
          /fs\.writeFile\s*\([^,]*\+/gi,
          /path\.join\s*\([^,]*\+[^)]*\.\./gi // Path traversal
        ]
      }
    ];
  }

  async analyze(filePath, content, ext) {
    const findings = [];
    const lines = content.split('\n');

    // Skip certain file types for security analysis
    if (['.json', '.md', '.txt'].includes(ext.toLowerCase())) {
      return findings;
    }

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        const matches = [...content.matchAll(new RegExp(pattern, 'gi'))];
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = lines[lineNumber - 1]?.trim();
          
          // Additional context-aware filtering
          if (this.shouldSkipFinding(rule.id, match[0], lineContent, filePath)) {
            continue;
          }

          findings.push({
            rule: rule.id,
            title: rule.name,
            description: rule.description,
            severity: rule.severity,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1),
            match: match[0],
            context: lineContent,
            recommendation: this.getRecommendation(rule.id, match[0])
          });
        }
      }
    }

    // Add file-specific security checks
    if (filePath.includes('.env')) {
      findings.push(...this.analyzeEnvFile(content, lines));
    }

    if (ext === '.js' || ext === '.ts') {
      findings.push(...this.analyzeJavaScriptSecurity(content, lines));
    }

    return findings;
  }

  shouldSkipFinding(ruleId, match, lineContent, filePath) {
    // Skip comments
    if (lineContent.includes('//') || lineContent.includes('/*') || lineContent.includes('*')) {
      return true;
    }

    // Skip test files for certain rules
    if (filePath.includes('test') || filePath.includes('spec')) {
      if (['debug-info-exposure'].includes(ruleId)) {
        return true;
      }
    }

    // Skip examples and documentation
    if (filePath.includes('example') || filePath.includes('demo') || filePath.includes('docs/')) {
      return true;
    }

    // Rule-specific filtering
    switch (ruleId) {
      case 'hardcoded-secrets':
        // Skip placeholder values
        if (/(?:example|placeholder|dummy|test|fake)/gi.test(match)) {
          return true;
        }
        // Skip short values that are likely not real secrets
        if (match.length < 10) {
          return true;
        }
        break;
      
      case 'weak-crypto':
        // Allow SHA1 in Git contexts
        if (lineContent.includes('git') || lineContent.includes('commit')) {
          return true;
        }
        break;
    }

    return false;
  }

  analyzeEnvFile(content, lines) {
    const findings = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for missing quotes around values with spaces
      if (trimmed.includes('=') && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        
        if (value.includes(' ') && !value.startsWith('"') && !value.startsWith("'")) {
          findings.push({
            rule: 'env-unquoted-values',
            title: 'Unquoted Environment Variable Value',
            description: 'Environment variable values containing spaces should be quoted',
            severity: 'low',
            line: index + 1,
            context: trimmed,
            recommendation: 'Wrap the value in quotes: KEY="value with spaces"'
          });
        }
      }
    });

    return findings;
  }

  analyzeJavaScriptSecurity(content, lines) {
    const findings = [];

    // Check for unsafe eval-like patterns
    const evalPatterns = [
      /new Function\s*\(/gi,
      /setTimeout\s*\(\s*['"][^'"]*['"],/gi,
      /setInterval\s*\(\s*['"][^'"]*['"],/gi
    ];

    evalPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const lineNumber = this.getLineNumber(content, match.index);
        findings.push({
          rule: 'unsafe-eval',
          title: 'Unsafe Code Execution',
          description: 'Use of eval-like functions can lead to code injection',
          severity: 'high',
          line: lineNumber,
          match: match[0],
          recommendation: 'Avoid dynamic code execution. Use safer alternatives.'
        });
      });
    });

    return findings;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getRecommendation(ruleId, match) {
    const recommendations = {
      'hardcoded-secrets': 'Move sensitive values to environment variables or secure configuration management',
      'sql-injection': 'Use parameterized queries or prepared statements instead of string concatenation',
      'xss-vulnerability': 'Sanitize user input and use secure templating methods',
      'weak-crypto': 'Use strong cryptographic algorithms like SHA-256, SHA-3, or bcrypt',
      'insecure-random': 'Use cryptographically secure random generators like crypto.randomBytes()',
      'debug-info-exposure': 'Remove debug statements containing sensitive information from production code',
      'prototype-pollution': 'Validate object properties and use Object.create(null) for safe objects',
      'unsafe-redirect': 'Validate redirect URLs against a whitelist of allowed destinations',
      'unsafe-file-operations': 'Validate and sanitize file paths to prevent directory traversal',
      'insecure-dependencies': 'Update to the latest secure version of the dependency'
    };

    return recommendations[ruleId] || 'Review this code for security implications';
  }

  listRules() {
    return this.rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity
    }));
  }
}

module.exports = SecurityRules;
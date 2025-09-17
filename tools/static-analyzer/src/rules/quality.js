class QualityRules {
  constructor() {
    this.rules = [
      {
        id: 'code-complexity',
        name: 'High Code Complexity',
        description: 'Detects functions or methods with high cyclomatic complexity',
        severity: 'medium',
        patterns: [
          // Functions with many if/else statements
          /function[^{]*{[^}]*(?:if\s*\([^}]*){5,}/gi,
          // Functions with many switch cases
          /switch\s*\([^{]*{[^}]*(?:case[^}]*){8,}/gi
        ]
      },
      {
        id: 'long-functions',
        name: 'Long Functions',
        description: 'Detects functions that are too long and may need refactoring',
        severity: 'low',
        patterns: [
          // This will be checked programmatically in analyze method
        ]
      },
      {
        id: 'magic-numbers',
        name: 'Magic Numbers',
        description: 'Detects magic numbers that should be replaced with named constants',
        severity: 'low',
        patterns: [
          /(?<![\w.])\d{3,}(?![\w.])/g, // Numbers with 3+ digits (excluding decimal context)
          /(?<!=\s*)[1-9]\d{2,}(?!\s*[;})\]])/g // Large numbers not in assignments
        ]
      },
      {
        id: 'todo-comments',
        name: 'TODO Comments',
        description: 'Detects TODO, FIXME, and HACK comments that need attention',
        severity: 'low',
        patterns: [
          /\/\/\s*(?:TODO|FIXME|HACK|XXX|BUG)/gi,
          /\/\*\s*(?:TODO|FIXME|HACK|XXX|BUG)/gi
        ]
      },
      {
        id: 'unused-variables',
        name: 'Potentially Unused Variables',
        description: 'Detects variables that may be unused',
        severity: 'low',
        patterns: [
          // This will be checked programmatically
        ]
      },
      {
        id: 'inconsistent-naming',
        name: 'Inconsistent Naming Convention',
        description: 'Detects inconsistent variable and function naming',
        severity: 'low',
        patterns: [
          /var\s+[A-Z][a-z]*/g, // PascalCase variables (should be camelCase)
          /function\s+[A-Z][a-z]*/g, // PascalCase functions (should be camelCase)
          /const\s+[a-z_]+[A-Z]/g // Mixed case constants
        ]
      },
      {
        id: 'missing-error-handling',
        name: 'Missing Error Handling',
        description: 'Detects async operations without proper error handling',
        severity: 'medium',
        patterns: [
          /await\s+[^;]*(?<!catch\s*\([^)]*\))\s*;/gi,
          /\.then\s*\([^}]*\)(?!\s*\.catch)/gi,
          /fetch\s*\([^)]*\)(?!\s*\.catch)/gi
        ]
      },
      {
        id: 'console-statements',
        name: 'Console Statements',
        description: 'Detects console statements that should be removed from production',
        severity: 'low',
        patterns: [
          /console\.(?:log|debug|info|warn|error)/gi
        ]
      },
      {
        id: 'duplicate-code',
        name: 'Potential Code Duplication',
        description: 'Detects patterns that suggest code duplication',
        severity: 'medium',
        patterns: [
          // This will be checked programmatically for duplicate function signatures
        ]
      },
      {
        id: 'inefficient-loops',
        name: 'Inefficient Loop Patterns',
        description: 'Detects potentially inefficient loop patterns',
        severity: 'low',
        patterns: [
          /for\s*\([^;]*;\s*[^.]*\.length\s*;/gi, // for(i=0; i<arr.length; i++)
          /while\s*\([^}]*\.length\s*>/gi // while with length checks
        ]
      },
      {
        id: 'deprecated-apis',
        name: 'Deprecated API Usage',
        description: 'Detects usage of deprecated APIs and methods',
        severity: 'medium',
        patterns: [
          /substr\s*\(/gi, // Deprecated string method
          /escape\s*\(/gi, // Deprecated escape function
          /unescape\s*\(/gi, // Deprecated unescape function
          /arguments\.caller/gi, // Deprecated property
          /arguments\.callee/gi // Deprecated property
        ]
      },
      {
        id: 'unused-imports',
        name: 'Unused Imports',
        description: 'Detects potentially unused imports',
        severity: 'low',
        patterns: [
          // This will be checked programmatically
        ]
      }
    ];
  }

  async analyze(filePath, content, ext) {
    const findings = [];
    const lines = content.split('\n');

    // Skip binary files and non-code files
    if (!['.js', '.ts', '.jsx', '.tsx', '.json'].includes(ext.toLowerCase())) {
      return findings;
    }

    // Pattern-based analysis
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (!pattern.source) continue; // Skip empty patterns
        
        const matches = [...content.matchAll(pattern)];
        
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index);
          const lineContent = lines[lineNumber - 1]?.trim();
          
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

    // Programmatic analysis
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      findings.push(...this.analyzeJavaScriptQuality(content, lines, filePath));
    }

    if (ext === '.json') {
      findings.push(...this.analyzeJSONQuality(content, lines, filePath));
    }

    return findings;
  }

  analyzeJavaScriptQuality(content, lines, filePath) {
    const findings = [];

    // Check for long functions
    const functionMatches = content.match(/function[^{]*{|=>\s*{|:\s*function[^{]*{/gi) || [];
    functionMatches.forEach(match => {
      const startIndex = content.indexOf(match);
      const startLine = this.getLineNumber(content, startIndex);
      const functionLines = this.getFunctionLength(content, startIndex);
      
      if (functionLines > 50) {
        findings.push({
          rule: 'long-functions',
          title: 'Long Function',
          description: `Function has ${functionLines} lines, consider breaking it down`,
          severity: functionLines > 100 ? 'medium' : 'low',
          line: startLine,
          context: lines[startLine - 1]?.trim(),
          recommendation: 'Break down large functions into smaller, more focused functions'
        });
      }
    });

    // Check for unused imports (simplified)
    const imports = this.extractImports(content);
    const unusedImports = imports.filter(imp => {
      const usagePattern = new RegExp(`\\b${imp.name}\\b`, 'g');
      const usages = content.match(usagePattern) || [];
      return usages.length <= 1; // Only the import declaration
    });

    unusedImports.forEach(imp => {
      findings.push({
        rule: 'unused-imports',
        title: 'Unused Import',
        description: `Import '${imp.name}' appears to be unused`,
        severity: 'low',
        line: imp.line,
        context: lines[imp.line - 1]?.trim(),
        recommendation: 'Remove unused imports to reduce bundle size'
      });
    });

    // Check for duplicate function signatures
    const functionSignatures = this.extractFunctionSignatures(content);
    const duplicates = this.findDuplicates(functionSignatures);
    
    duplicates.forEach(dup => {
      findings.push({
        rule: 'duplicate-code',
        title: 'Potential Code Duplication',
        description: `Similar function signatures found: ${dup.signature}`,
        severity: 'medium',
        line: dup.line,
        context: lines[dup.line - 1]?.trim(),
        recommendation: 'Consider extracting common functionality into a shared function'
      });
    });

    return findings;
  }

  analyzeJSONQuality(content, lines, filePath) {
    const findings = [];

    try {
      const data = JSON.parse(content);
      
      // Check package.json specific issues
      if (filePath.endsWith('package.json')) {
        // Check for missing important fields
        const importantFields = ['description', 'license', 'repository'];
        importantFields.forEach(field => {
          if (!data[field]) {
            findings.push({
              rule: 'missing-package-fields',
              title: 'Missing Package Field',
              description: `Missing recommended field: ${field}`,
              severity: 'low',
              line: 1,
              recommendation: `Add the ${field} field to your package.json`
            });
          }
        });

        // Check for exact version dependencies (should use ranges)
        if (data.dependencies) {
          Object.entries(data.dependencies).forEach(([name, version]) => {
            if (/^\d+\.\d+\.\d+$/.test(version)) {
              findings.push({
                rule: 'exact-versions',
                title: 'Exact Version Dependency',
                description: `Dependency ${name} uses exact version ${version}`,
                severity: 'low',
                line: this.findJSONFieldLine(content, name),
                recommendation: 'Consider using version ranges (^x.y.z or ~x.y.z) for better compatibility'
              });
            }
          });
        }
      }

    } catch (error) {
      findings.push({
        rule: 'invalid-json',
        title: 'Invalid JSON',
        description: 'JSON syntax error: ' + error.message,
        severity: 'high',
        line: this.getJSONErrorLine(content, error),
        recommendation: 'Fix JSON syntax errors'
      });
    }

    return findings;
  }

  shouldSkipFinding(ruleId, match, lineContent, filePath) {
    // Skip comments
    if (lineContent.includes('//') || lineContent.includes('/*')) {
      return true;
    }

    // Skip test files for certain rules
    if (filePath.includes('test') || filePath.includes('spec')) {
      if (['console-statements', 'magic-numbers'].includes(ruleId)) {
        return true;
      }
    }

    // Skip node_modules and generated files
    if (filePath.includes('node_modules') || filePath.includes('.generated.')) {
      return true;
    }

    // Rule-specific filtering
    switch (ruleId) {
      case 'magic-numbers':
        // Skip common acceptable numbers
        if (['0', '1', '2', '10', '100', '200', '404', '500'].includes(match)) {
          return true;
        }
        // Skip numbers in URLs, dates, and configurations
        if (lineContent.includes('http') || lineContent.includes('port') || lineContent.includes('timeout')) {
          return true;
        }
        break;
        
      case 'console-statements':
        // Allow console in development configurations
        if (lineContent.includes('development') || lineContent.includes('debug')) {
          return true;
        }
        break;
    }

    return false;
  }

  getFunctionLength(content, startIndex) {
    let braceCount = 0;
    let lineCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          break;
        }
      } else if (char === '\n') {
        lineCount++;
      }
    }
    
    return lineCount;
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const lines = content.split('\n');
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);
      
      if (match[1]) {
        // Named imports
        const namedImports = match[1].split(',').map(imp => imp.trim());
        namedImports.forEach(name => {
          imports.push({ name, line: lineNumber, type: 'named' });
        });
      } else if (match[2]) {
        // Default import
        imports.push({ name: match[2], line: lineNumber, type: 'default' });
      }
    }
    
    return imports;
  }

  extractFunctionSignatures(content) {
    const signatures = [];
    const functionRegex = /(?:function\s+(\w+)\s*\([^)]*\)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function))/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2];
      const lineNumber = this.getLineNumber(content, match.index);
      const signature = match[0].replace(/\s+/g, ' ').trim();
      
      signatures.push({ name, signature, line: lineNumber });
    }
    
    return signatures;
  }

  findDuplicates(items) {
    const seen = new Map();
    const duplicates = [];
    
    items.forEach(item => {
      const key = item.signature.replace(/\w+/g, ''); // Remove names, keep structure
      if (seen.has(key)) {
        duplicates.push(item);
      } else {
        seen.set(key, item);
      }
    });
    
    return duplicates;
  }

  findJSONFieldLine(content, fieldName) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${fieldName}"`)) {
        return i + 1;
      }
    }
    return 1;
  }

  getJSONErrorLine(content, error) {
    const match = error.message.match(/line (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getRecommendation(ruleId, match) {
    const recommendations = {
      'code-complexity': 'Break down complex functions into smaller, more focused functions',
      'long-functions': 'Split large functions into smaller, single-purpose functions',
      'magic-numbers': 'Replace magic numbers with named constants to improve readability',
      'todo-comments': 'Address TODO comments or create issues to track them',
      'unused-variables': 'Remove unused variables to clean up the code',
      'inconsistent-naming': 'Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes)',
      'missing-error-handling': 'Add proper error handling with try-catch blocks or .catch() methods',
      'console-statements': 'Remove console statements or replace with proper logging',
      'duplicate-code': 'Extract common code into reusable functions or modules',
      'inefficient-loops': 'Cache array length or use more efficient iteration methods',
      'deprecated-apis': 'Replace deprecated APIs with modern alternatives',
      'unused-imports': 'Remove unused imports to reduce bundle size and improve performance'
    };

    return recommendations[ruleId] || 'Review and improve this code pattern';
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

module.exports = QualityRules;
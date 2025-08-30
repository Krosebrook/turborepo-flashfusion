/**
 * CLI utility functions
 */

/**
 * Display a colored message in the console
 */
export function log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Project name is required');
    return { isValid: false, errors };
  }
  
  if (name.length < 3) {
    errors.push('Project name must be at least 3 characters long');
  }
  
  if (name.length > 50) {
    errors.push('Project name must be no more than 50 characters long');
  }
  
  if (!/^[a-z0-9-_]+$/.test(name)) {
    errors.push('Project name can only contain lowercase letters, numbers, hyphens, and underscores');
  }
  
  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('Project name cannot start or end with a hyphen');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if running in a FlashFusion project
 */
export function isFlashFusionProject(): boolean {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check for package.json with FlashFusion workspace configuration
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.name === 'turborepo-flashfusion' || 
             (packageJson.workspaces && Array.isArray(packageJson.workspaces));
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get project root directory
 */
export function getProjectRoot(): string {
  const path = require('path');
  let currentDir = process.cwd();
  
  while (currentDir !== path.dirname(currentDir)) {
    if (isFlashFusionProject()) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
}

/**
 * Execute shell command
 */
export function executeCommand(command: string, options: { cwd?: string; silent?: boolean } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    
    exec(command, { cwd: options.cwd || process.cwd() }, (error: any, stdout: string, stderr: string) => {
      if (error) {
        reject(new Error(`Command failed: ${command}\n${stderr}`));
        return;
      }
      
      if (!options.silent) {
        console.log(stdout);
      }
      
      resolve(stdout);
    });
  });
}
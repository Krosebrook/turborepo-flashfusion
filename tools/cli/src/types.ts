/**
 * CLI types and interfaces
 */

export interface CLICommand {
  name: string;
  description: string;
  aliases?: string[];
  options?: CLIOption[];
  action: (args: any, options: any) => Promise<void>;
}

export interface CLIOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
  choices?: string[];
}

export interface ProjectConfig {
  name: string;
  version: string;
  type: 'monorepo' | 'app' | 'package';
  framework?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  workspaces?: string[];
}

export interface TemplateConfig {
  name: string;
  description: string;
  type: 'app' | 'package' | 'component';
  framework: string;
  dependencies: string[];
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  variables?: Record<string, string>;
}

export interface GeneratorOptions {
  name: string;
  type: string;
  template?: string;
  destination?: string;
  variables?: Record<string, any>;
}

export interface BuildOptions {
  package?: string;
  watch?: boolean;
  production?: boolean;
  analyze?: boolean;
}

export interface DeployOptions {
  environment: 'staging' | 'production';
  confirm?: boolean;
  rollbackPlan?: boolean;
  strategy?: 'blue-green' | 'rolling' | 'canary';
}
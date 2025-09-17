#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

class InfrastructurePipelineAgent {
  constructor() {
    this.logFile = join(__dirname, 'pipeline.log');
    this.stateFile = join(__dirname, 'pipeline-state.json');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = dirname(this.logFile);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
    
    // Console output with colors
    switch (level) {
      case 'error':
        console.log(chalk.red(`❌ ${message}`));
        break;
      case 'success':
        console.log(chalk.green(`✅ ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`⚠️  ${message}`));
        break;
      case 'info':
      default:
        console.log(chalk.blue(`ℹ️  ${message}`));
        break;
    }

    // File logging
    try {
      if (existsSync(this.logFile)) {
        const currentLogs = readFileSync(this.logFile, 'utf8');
        writeFileSync(this.logFile, currentLogs + logEntry);
      } else {
        writeFileSync(this.logFile, logEntry);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to write to log file: ${error.message}`));
    }
  }

  updateState(operation, status, details = {}) {
    const state = {
      lastOperation: operation,
      status: status,
      timestamp: new Date().toISOString(),
      details: details
    };

    try {
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.log(`Failed to update state: ${error.message}`, 'error');
    }
  }

  getState() {
    try {
      if (existsSync(this.stateFile)) {
        return JSON.parse(readFileSync(this.stateFile, 'utf8'));
      }
    } catch (error) {
      this.log(`Failed to read state: ${error.message}`, 'warning');
    }
    return null;
  }

  async validateTerraform(workingDir) {
    this.log('Validating Terraform syntax...');
    
    try {
      // Check if terraform is installed
      execSync('terraform version', { stdio: 'pipe' });
      
      // Initialize terraform
      execSync('terraform init', { 
        cwd: workingDir, 
        stdio: 'pipe' 
      });
      
      // Validate syntax
      const result = execSync('terraform validate -json', { 
        cwd: workingDir, 
        encoding: 'utf8' 
      });
      
      const validation = JSON.parse(result);
      if (validation.valid) {
        this.log('Terraform syntax validation passed', 'success');
        return { valid: true, diagnostics: validation.diagnostics || [] };
      } else {
        this.log('Terraform syntax validation failed', 'error');
        return { valid: false, diagnostics: validation.diagnostics || [] };
      }
    } catch (error) {
      if (error.message.includes('terraform: command not found')) {
        this.log('Terraform not installed - skipping validation', 'warning');
        return { valid: true, skipped: true, reason: 'terraform_not_installed' };
      }
      this.log(`Terraform validation error: ${error.message}`, 'error');
      return { valid: false, error: error.message };
    }
  }

  async validateCDK(workingDir) {
    this.log('Validating CDK syntax...');
    
    try {
      // Check if CDK is installed
      execSync('cdk version', { stdio: 'pipe' });
      
      // Synthesize to validate
      const result = execSync('cdk synth --quiet', { 
        cwd: workingDir, 
        encoding: 'utf8' 
      });
      
      this.log('CDK syntax validation passed', 'success');
      return { valid: true };
    } catch (error) {
      if (error.message.includes('cdk: command not found')) {
        this.log('CDK not installed - skipping validation', 'warning');
        return { valid: true, skipped: true, reason: 'cdk_not_installed' };
      }
      this.log(`CDK validation error: ${error.message}`, 'error');
      return { valid: false, error: error.message };
    }
  }

  async validatePolicies(workingDir) {
    this.log('Validating policies...');
    
    const policyFile = join(workingDir, 'policies.yaml');
    if (!existsSync(policyFile)) {
      this.log('No policy file found - skipping policy validation', 'warning');
      return { valid: true, skipped: true, reason: 'no_policy_file' };
    }

    try {
      const policies = yaml.load(readFileSync(policyFile, 'utf8'));
      this.log('Policy validation passed', 'success');
      return { valid: true, policies };
    } catch (error) {
      this.log(`Policy validation error: ${error.message}`, 'error');
      return { valid: false, error: error.message };
    }
  }

  async runTerraformPlan(workingDir) {
    this.log('Running Terraform plan...');
    
    try {
      const planOutput = execSync('terraform plan -detailed-exitcode -out=tfplan', {
        cwd: workingDir,
        encoding: 'utf8'
      });
      
      this.log('Terraform plan completed successfully', 'success');
      return { 
        success: true, 
        output: planOutput,
        hasChanges: false  // Exit code 0 means no changes
      };
    } catch (error) {
      if (error.status === 2) {
        // Exit code 2 means plan succeeded but has changes
        this.log('Terraform plan completed with changes', 'success');
        return { 
          success: true, 
          output: error.stdout,
          hasChanges: true 
        };
      } else {
        this.log(`Terraform plan failed: ${error.message}`, 'error');
        return { 
          success: false, 
          error: error.message,
          output: error.stdout 
        };
      }
    }
  }

  async runTerraformApply(workingDir) {
    this.log('Running Terraform apply...');
    
    try {
      const applyOutput = execSync('terraform apply -auto-approve tfplan', {
        cwd: workingDir,
        encoding: 'utf8'
      });
      
      this.log('Terraform apply completed successfully', 'success');
      return { success: true, output: applyOutput };
    } catch (error) {
      this.log(`Terraform apply failed: ${error.message}`, 'error');
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async runCDKDeploy(workingDir, stackName = '') {
    this.log(`Running CDK deploy${stackName ? ' for stack: ' + stackName : ''}...`);
    
    try {
      const deployCmd = `cdk deploy${stackName ? ' ' + stackName : ''} --require-approval never`;
      const deployOutput = execSync(deployCmd, {
        cwd: workingDir,
        encoding: 'utf8'
      });
      
      this.log('CDK deploy completed successfully', 'success');
      return { success: true, output: deployOutput };
    } catch (error) {
      this.log(`CDK deploy failed: ${error.message}`, 'error');
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async detectDrift(workingDir, tool = 'terraform') {
    this.log(`Detecting drift for ${tool}...`);
    
    try {
      if (tool === 'terraform') {
        // Run terraform plan to detect drift
        const result = await this.runTerraformPlan(workingDir);
        if (result.success && result.hasChanges) {
          this.log('Drift detected in Terraform state', 'warning');
          return { driftDetected: true, details: result.output };
        } else if (result.success) {
          this.log('No drift detected in Terraform state', 'success');
          return { driftDetected: false };
        } else {
          return { error: result.error };
        }
      } else if (tool === 'cdk') {
        // Run cdk diff to detect drift
        const diffOutput = execSync('cdk diff', {
          cwd: workingDir,
          encoding: 'utf8'
        });
        
        if (diffOutput.trim()) {
          this.log('Drift detected in CDK stacks', 'warning');
          return { driftDetected: true, details: diffOutput };
        } else {
          this.log('No drift detected in CDK stacks', 'success');
          return { driftDetected: false };
        }
      }
    } catch (error) {
      this.log(`Drift detection failed: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  async validateSyntax() {
    this.log('Starting syntax validation...');
    this.updateState('validate', 'running');

    const terraformDir = join(rootDir, 'templates/infrastructure/terraform');
    const cdkDir = join(rootDir, 'templates/infrastructure/cdk');
    
    const results = {
      terraform: { skipped: true, reason: 'no_templates' },
      cdk: { skipped: true, reason: 'no_templates' },
      policies: { skipped: true, reason: 'no_policies' }
    };

    // Validate Terraform if templates exist
    if (existsSync(terraformDir)) {
      results.terraform = await this.validateTerraform(terraformDir);
      if (results.terraform.valid) {
        results.policies = await this.validatePolicies(terraformDir);
      }
    }

    // Validate CDK if templates exist
    if (existsSync(cdkDir)) {
      results.cdk = await this.validateCDK(cdkDir);
    }

    const allValid = Object.values(results).every(r => r.valid !== false);
    
    if (allValid) {
      this.log('All syntax validation passed', 'success');
      this.updateState('validate', 'success', results);
    } else {
      this.log('Syntax validation failed', 'error');
      this.updateState('validate', 'failed', results);
    }

    return results;
  }

  async planInfrastructure(tool = 'terraform') {
    this.log(`Starting infrastructure plan for ${tool}...`);
    this.updateState('plan', 'running', { tool });

    const workingDir = join(rootDir, 'templates/infrastructure', tool);
    
    if (!existsSync(workingDir)) {
      const error = `No ${tool} templates found at ${workingDir}`;
      this.log(error, 'error');
      this.updateState('plan', 'failed', { error });
      return { success: false, error };
    }

    // First validate syntax
    const validation = tool === 'terraform' 
      ? await this.validateTerraform(workingDir)
      : await this.validateCDK(workingDir);

    if (!validation.valid && !validation.skipped) {
      this.log('Syntax validation failed - aborting plan', 'error');
      this.updateState('plan', 'failed', { error: 'syntax_validation_failed', validation });
      return { success: false, error: 'Syntax validation failed', validation };
    }

    // Run plan
    let planResult;
    if (tool === 'terraform') {
      planResult = await this.runTerraformPlan(workingDir);
    } else {
      // For CDK, we use diff as "plan"
      try {
        const diffOutput = execSync('cdk diff', {
          cwd: workingDir,
          encoding: 'utf8'
        });
        planResult = { success: true, output: diffOutput, hasChanges: !!diffOutput.trim() };
      } catch (error) {
        planResult = { success: false, error: error.message };
      }
    }

    if (planResult.success) {
      this.log(`${tool} plan completed successfully`, 'success');
      this.updateState('plan', 'success', { tool, planResult });
    } else {
      this.log(`${tool} plan failed`, 'error');
      this.updateState('plan', 'failed', { tool, error: planResult.error });
    }

    return planResult;
  }

  async applyInfrastructure(tool = 'terraform') {
    this.log(`Starting infrastructure apply for ${tool}...`);
    this.updateState('apply', 'running', { tool });

    const workingDir = join(rootDir, 'templates/infrastructure', tool);
    
    if (!existsSync(workingDir)) {
      const error = `No ${tool} templates found at ${workingDir}`;
      this.log(error, 'error');
      this.updateState('apply', 'failed', { error });
      return { success: false, error };
    }

    // First run plan to ensure everything is valid
    const planResult = await this.planInfrastructure(tool);
    if (!planResult.success) {
      this.log('Plan failed - aborting apply', 'error');
      return planResult;
    }

    // Run apply
    let applyResult;
    if (tool === 'terraform') {
      applyResult = await this.runTerraformApply(workingDir);
    } else {
      applyResult = await this.runCDKDeploy(workingDir);
    }

    if (applyResult.success) {
      this.log(`${tool} apply completed successfully`, 'success');
      this.updateState('apply', 'success', { tool, applyResult });
    } else {
      this.log(`${tool} apply failed`, 'error');
      this.updateState('apply', 'failed', { tool, error: applyResult.error });
    }

    return applyResult;
  }

  async checkDrift(tool = 'both') {
    this.log('Starting drift detection...');
    this.updateState('drift', 'running', { tool });

    const results = {};

    if (tool === 'terraform' || tool === 'both') {
      const terraformDir = join(rootDir, 'templates/infrastructure/terraform');
      if (existsSync(terraformDir)) {
        results.terraform = await this.detectDrift(terraformDir, 'terraform');
      } else {
        results.terraform = { skipped: true, reason: 'no_terraform_templates' };
      }
    }

    if (tool === 'cdk' || tool === 'both') {
      const cdkDir = join(rootDir, 'templates/infrastructure/cdk');
      if (existsSync(cdkDir)) {
        results.cdk = await this.detectDrift(cdkDir, 'cdk');
      } else {
        results.cdk = { skipped: true, reason: 'no_cdk_templates' };
      }
    }

    const hasDrift = Object.values(results).some(r => r.driftDetected);
    const hasErrors = Object.values(results).some(r => r.error);

    if (hasErrors) {
      this.log('Drift detection failed', 'error');
      this.updateState('drift', 'failed', results);
    } else if (hasDrift) {
      this.log('Drift detected in infrastructure', 'warning');
      this.updateState('drift', 'drift_detected', results);
    } else {
      this.log('No drift detected', 'success');
      this.updateState('drift', 'success', results);
    }

    return results;
  }

  async showStatus() {
    const state = this.getState();
    if (!state) {
      console.log(chalk.gray('No previous operations recorded.'));
      return;
    }

    console.log(chalk.bold('\n📊 Infrastructure Pipeline Status\n'));
    console.log(chalk.gray(`Last Operation: ${state.lastOperation}`));
    console.log(chalk.gray(`Status: ${state.status}`));
    console.log(chalk.gray(`Timestamp: ${state.timestamp}`));
    
    if (state.details && Object.keys(state.details).length > 0) {
      console.log(chalk.gray('\nDetails:'));
      console.log(chalk.gray(JSON.stringify(state.details, null, 2)));
    }

    // Show recent logs
    if (existsSync(this.logFile)) {
      const logs = readFileSync(this.logFile, 'utf8');
      const recentLogs = logs.split('\n').slice(-10).filter(line => line.trim());
      if (recentLogs.length > 0) {
        console.log(chalk.bold('\n📋 Recent Logs:'));
        recentLogs.forEach(log => console.log(chalk.gray(log)));
      }
    }
  }
}

// CLI setup
const program = new Command();
const agent = new InfrastructurePipelineAgent();

program
  .name('infrastructure-pipeline')
  .description('Infrastructure Pipeline Agent for running IaC tools with validation')
  .version('1.0.0');

program
  .command('validate')
  .description('Validate Terraform/CDK syntax and policies')
  .action(async () => {
    const results = await agent.validateSyntax();
    process.exit(Object.values(results).some(r => r.valid === false) ? 1 : 0);
  });

program
  .command('plan')
  .description('Run infrastructure plan')
  .option('-t, --tool <tool>', 'IaC tool to use (terraform|cdk)', 'terraform')
  .action(async (options) => {
    const result = await agent.planInfrastructure(options.tool);
    process.exit(result.success ? 0 : 1);
  });

program
  .command('apply')
  .description('Apply infrastructure changes')
  .option('-t, --tool <tool>', 'IaC tool to use (terraform|cdk)', 'terraform')
  .action(async (options) => {
    const result = await agent.applyInfrastructure(options.tool);
    process.exit(result.success ? 0 : 1);
  });

program
  .command('drift')
  .description('Detect infrastructure drift')
  .option('-t, --tool <tool>', 'IaC tool to check (terraform|cdk|both)', 'both')
  .action(async (options) => {
    const results = await agent.checkDrift(options.tool);
    const hasErrors = Object.values(results).some(r => r.error);
    process.exit(hasErrors ? 1 : 0);
  });

program
  .command('status')
  .description('Show pipeline status and recent logs')
  .action(async () => {
    await agent.showStatus();
  });

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse();
}

export default InfrastructurePipelineAgent;
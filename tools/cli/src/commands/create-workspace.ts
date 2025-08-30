import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

const WORKSPACE_TYPES = {
  APP: 'app',
  PACKAGE: 'package',
  TOOL: 'tool',
} as const;

const FRAMEWORKS = {
  NEXT: 'next',
  EXPRESS: 'express',
  VITE: 'vite',
  LIBRARY: 'library',
} as const;

interface CreateWorkspaceOptions {
  name?: string;
  type?: string;
  framework?: string;
}

export async function createWorkspace(options: CreateWorkspaceOptions) {
  console.log(chalk.blue('🚀 Creating new workspace...'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Workspace name:',
      when: !options.name,
      validate: (input: string) => input.length > 0 || 'Name is required',
    },
    {
      type: 'list',
      name: 'type',
      message: 'Workspace type:',
      when: !options.type,
      choices: Object.values(WORKSPACE_TYPES),
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Framework:',
      when: (answers) => (answers.type || options.type) === 'app' && !options.framework,
      choices: Object.values(FRAMEWORKS),
    },
  ]);

  const name = options.name || answers.name;
  const type = options.type || answers.type;
  const framework = options.framework || answers.framework;

  try {
    const command = `npx turbo gen workspace --name=${name} --type=${type}`;
    console.log(chalk.gray(`Running: ${command}`));
    execSync(command, { stdio: 'inherit' });
    
    console.log(chalk.green(`✅ Workspace '${name}' created successfully!`));
    console.log(chalk.gray(`📁 Location: ${type}s/${name}`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create workspace'), error);
    process.exit(1);
  }
}
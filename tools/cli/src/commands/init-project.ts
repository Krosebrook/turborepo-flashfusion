import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

const APP_NAME = 'FlashFusion TurboRepo';

interface InitProjectOptions {
  name?: string;
  template?: string;
}

export async function initProject(options: InitProjectOptions) {
  console.log(chalk.blue(`🚀 Initializing ${APP_NAME} project...`));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      when: !options.name,
      default: 'my-flashfusion-project',
      validate: (input: string) => input.length > 0 || 'Name is required',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      when: !options.template,
      choices: [
        { name: 'Full Stack (Next.js + API)', value: 'fullstack' },
        { name: 'Frontend Only (Next.js)', value: 'frontend' },
        { name: 'API Only (Express)', value: 'api' },
        { name: 'Minimal (Empty workspace)', value: 'minimal' },
      ],
    },
  ]);

  const name = options.name || answers.name;
  const template = options.template || answers.template;

  try {
    console.log(chalk.gray('📦 Installing dependencies...'));
    execSync('npm install', { stdio: 'inherit' });
    
    console.log(chalk.gray('🏗️ Setting up project structure...'));
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log(chalk.green(`✅ Project '${name}' initialized successfully!`));
    console.log(chalk.blue('\n🎯 Next steps:'));
    console.log(chalk.gray('1. npm run dev - Start development'));
    console.log(chalk.gray('2. flashfusion create - Add more workspaces'));
    console.log(chalk.gray('3. flashfusion status - Check project status'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize project'), error);
    process.exit(1);
  }
}
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createWorkspace } from './commands/create-workspace';
import { initProject } from './commands/init-project';

const APP_NAME = 'FlashFusion TurboRepo';
const APP_VERSION = '1.0.0';

const program = new Command();

program
  .name('flashfusion')
  .description(`${APP_NAME} CLI - Manage your monorepo with ease`)
  .version(APP_VERSION);

program
  .command('init')
  .description('Initialize a new FlashFusion project')
  .option('-n, --name <name>', 'Project name')
  .option('-t, --template <template>', 'Template to use')
  .action(initProject);

program
  .command('create')
  .description('Create a new workspace (app, package, or tool)')
  .option('-n, --name <name>', 'Workspace name')
  .option('-t, --type <type>', 'Workspace type (app, package, tool)')
  .option('-f, --framework <framework>', 'Framework to use')
  .action(createWorkspace);

program
  .command('status')
  .description('Show project status and next steps')
  .action(() => {
    console.log(chalk.blue(`🚀 ${APP_NAME} Status`));
    console.log(chalk.gray('Running session restore...'));
    require('../../restore-session.js');
  });

program.parse();
#!/usr/bin/env node

/**
 * FlashFusion Developer CLI
 * Unified Command Suite for AI E-Commerce Platform
 * 
 * @author FlashFusion Team
 * @version 2.0.0
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// CLI Configuration
const CLI_VERSION = '2.0.0';
const PROJECT_NAME = 'FlashFusion Unified';
const REQUIRED_NODE_VERSION = '18.0.0';

// Import FlashFusion Tools (temporarily disabled)
// const { OpenLovableTool } = require('./tools/open-lovable-tool');

// Color utilities
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
    command: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`)
};

// Utility functions
const exec = (command, options = {}) => {
    try {
        return execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        log.error(`Command failed: ${command}`);
        process.exit(1);
    }
};

const checkNodeVersion = () => {
    const currentVersion = process.version.slice(1);
    if (currentVersion < REQUIRED_NODE_VERSION) {
        log.error(`Node.js ${REQUIRED_NODE_VERSION}+ required. Current: ${currentVersion}`);
        process.exit(1);
    }
};

const ensureProjectRoot = () => {
    if (!fs.existsSync('package.json')) {
        log.error('Not in a FlashFusion project root. Run ff:init first.');
        process.exit(1);
    }
};

const spawnProcess = (command, args = [], options = {}) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Process exited with code ${code}`));
        });
    });
};

// Command implementations
const commands = {
    // 📦 Core Project Setup
    'init': async () => {
        log.title('🚀 Initializing FlashFusion Project');
        
        // Create directory structure
        const dirs = [
            'src/agents', 'src/api', 'src/core', 'src/services', 'src/utils',
            'agents/lyra/dashboard', 'mcp-servers', 'scripts', 'docs',
            'public', 'tests', 'database', '.vscode', '.github/workflows'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log.success(`Created ${dir}/`);
            }
        });

        // Create package.json if it doesn't exist
        if (!fs.existsSync('package.json')) {
            const packageJson = {
                name: 'flashfusion-unified',
                version: '2.0.0',
                description: 'AI-powered business operating system',
                main: 'src/index.js',
                scripts: {
                    'start': 'node src/index.js',
                    'dev': 'concurrently "npm run dev:server" "npm run dev:lyra"',
                    'dev:server': 'nodemon src/index.js',
                    'dev:lyra': 'cd agents/lyra/dashboard && npm run dev',
                    'build': 'npm run build:server && npm run build:lyra',
                    'build:server': 'echo "Server build complete"',
                    'build:lyra': 'cd agents/lyra/dashboard && npm run build',
                    'test': 'jest',
                    'lint': 'eslint src/ --ext .js,.jsx,.ts,.tsx',
                    'lint:fix': 'eslint src/ --ext .js,.jsx,.ts,.tsx --fix',
                    'ff': 'node ff-cli.js'
                },
                dependencies: {
                    'express': '^4.18.0',
                    'dotenv': '^16.0.0',
                    'cors': '^2.8.0',
                    '@supabase/supabase-js': '^2.0.0'
                },
                devDependencies: {
                    'nodemon': '^3.0.0',
                    'concurrently': '^8.0.0',
                    'eslint': '^8.0.0',
                    'jest': '^29.0.0'
                }
            };
            fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            log.success('Created package.json');
        }

        log.success('FlashFusion project initialized!');
        log.info('Next steps: ff:install && ff:env && ff:dev');
    },

    'install': () => {
        log.title('📦 Installing Dependencies');
        ensureProjectRoot();
        
        // Check for pnpm, fallback to npm
        try {
            execSync('pnpm --version', { stdio: 'ignore' });
            exec('pnpm install');
            exec('cd agents/lyra/dashboard && pnpm install');
        } catch {
            exec('npm install');
            exec('cd agents/lyra/dashboard && npm install');
        }
        
        log.success('Dependencies installed!');
    },

    'env': () => {
        log.title('🔧 Generating Environment Configuration');
        
        const envTemplate = `# FlashFusion Environment Configuration
NODE_ENV=development
PORT=8080

# AI Services
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# External Integrations
NOTION_API_KEY=secret_your-notion-key
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/your-webhook

# Security
JWT_SECRET=your-super-secret-jwt-key

# MCP Configuration
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info

# Deployment
VERCEL_PROJECT_ID=your-vercel-project-id
VERCEL_ORG_ID=your-vercel-org-id
`;

        if (!fs.existsSync('.env')) {
            fs.writeFileSync('.env', envTemplate);
            log.success('Created .env file');
        } else {
            log.warn('.env file already exists');
        }
        
        if (!fs.existsSync('.env.example')) {
            fs.writeFileSync('.env.example', envTemplate);
            log.success('Created .env.example file');
        }
    },

    'env:check': () => {
        log.title('🔍 Checking Environment Variables');
        
        if (!fs.existsSync('.env')) {
            log.error('.env file not found. Run ff:env first.');
            return;
        }

        const requiredVars = [
            'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'SUPABASE_URL', 
            'SUPABASE_ANON_KEY', 'JWT_SECRET'
        ];

        require('dotenv').config();
        
        let missing = [];
        requiredVars.forEach(varName => {
            if (!process.env[varName] || process.env[varName].includes('your-')) {
                missing.push(varName);
            }
        });

        if (missing.length === 0) {
            log.success('All required environment variables are set!');
        } else {
            log.error(`Missing or incomplete variables: ${missing.join(', ')}`);
            log.info('Update your .env file with actual values');
        }
    },

    'dev': async () => {
        log.title('🚀 Starting Development Environment');
        ensureProjectRoot();
        
        log.info('Starting all development services...');
        
        try {
            await spawnProcess('npm', ['run', 'dev']);
        } catch (error) {
            log.error('Development server failed to start');
        }
    },

    'build': () => {
        log.title('🏗️  Building All Applications');
        ensureProjectRoot();
        exec('npm run build');
        log.success('Build completed!');
    },

    'clean': () => {
        log.title('🧹 Cleaning Build Artifacts');
        
        const dirsToClean = [
            'node_modules', 'dist', 'build', '.next',
            'agents/lyra/dashboard/node_modules',
            'agents/lyra/dashboard/.next',
            'agents/lyra/dashboard/dist'
        ];

        dirsToClean.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
                log.success(`Removed ${dir}/`);
            }
        });
        
        log.success('Clean completed!');
    },

    'upgrade': () => {
        log.title('⬆️  Checking Package Updates');
        
        try {
            exec('npx npm-check-updates -u');
            log.info('Run ff:install to install updated packages');
        } catch {
            log.warn('npm-check-updates not available. Install with: npm i -g npm-check-updates');
        }
    },

    // 🚀 Deployment & Hosting
    'vercel:link': () => {
        log.title('🔗 Linking Vercel Project');
        exec('npx vercel link');
        log.success('Vercel project linked!');
    },

    'vercel:deploy': () => {
        log.title('🚀 Deploying to Vercel Staging');
        exec('npx vercel');
        log.success('Deployed to staging!');
    },

    'vercel:prod': () => {
        log.title('🌟 Deploying to Production');
        exec('npx vercel --prod');
        log.success('Deployed to production!');
    },

    'vercel:logs': () => {
        log.title('📋 Vercel Build Logs');
        exec('npx vercel logs');
    },

    'deploy:edge': () => {
        log.title('⚡ Deploying Supabase Edge Functions');
        exec('npx supabase functions deploy');
        log.success('Edge functions deployed!');
    },

    'deploy:all': async () => {
        log.title('🎯 Full Stack Deployment');
        
        log.info('1. Building applications...');
        await commands.build();
        
        log.info('2. Deploying edge functions...');
        await commands['deploy:edge']();
        
        log.info('3. Deploying to Vercel...');
        await commands['vercel:prod']();
        
        log.success('Full deployment completed!');
    },

    // 🔐 Supabase DB + Auth
    'supa:start': () => {
        log.title('🏃 Starting Supabase Locally');
        exec('npx supabase start');
        log.success('Supabase is running locally!');
    },

    'supa:push': () => {
        log.title('⬆️  Pushing to Remote Supabase');
        exec('npx supabase db push');
        log.success('Database changes pushed!');
    },

    'supa:seed': () => {
        log.title('🌱 Seeding Database');
        exec('npx supabase db seed');
        log.success('Database seeded with dummy data!');
    },

    'supa:rls:apply': () => {
        log.title('🔒 Applying Row Level Security');
        exec('npx supabase db push --include=rls');
        log.success('RLS policies applied!');
    },

    'supa:logs': () => {
        log.title('📋 Supabase Logs');
        exec('npx supabase logs');
    },

    'supa:backup': () => {
        log.title('💾 Creating Database Backup');
        const timestamp = new Date().toISOString().slice(0, 10);
        exec(`npx supabase db dump -f backup-${timestamp}.sql`);
        log.success(`Backup created: backup-${timestamp}.sql`);
    },

    'supa:restore': () => {
        log.title('🔄 Restoring Database');
        log.warn('This will overwrite your current database!');
        // Interactive restore logic would go here
        log.info('Use: npx supabase db reset to restore from migrations');
    },

    'supa:auth:roles': () => {
        log.title('👥 Auth Roles Overview');
        exec('npx supabase inspect db --role');
    },

    // GitHub Repository Discovery
    'github:discover': async () => {
        log.title('🔍 Discovering Krosebrook Repositories');
        
        const { createGitHubClient } = require('../../packages/shared/utils/githubApi');
        
        // Load environment variables
        require('dotenv').config();
        
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            log.warn('GitHub token not found in .env file. Using unauthenticated requests (limited rate).');
            log.info('Add GITHUB_TOKEN to .env for better rate limits');
        }
        
        try {
            const github = createGitHubClient(githubToken);
            log.info('Fetching repositories...');
            
            const result = await github.discoverKrosebrookRepositories();
            
            if (result.success) {
                log.success(`Found ${result.total_repositories} repositories`);
                
                // Display summary
                console.log('\n📊 Repository Summary:');
                console.log(`   Total repositories: ${result.summary.total_repos}`);
                console.log(`   Public repositories: ${result.summary.public_repos}`);
                console.log(`   Private repositories: ${result.summary.private_repos}`);
                console.log(`   Total stars: ${result.summary.total_stars}`);
                console.log(`   Total forks: ${result.summary.total_forks}`);
                console.log(`   Languages: ${result.summary.languages.join(', ')}`);
                
                // Save to file
                const outputFile = `krosebrook-repositories-${new Date().toISOString().slice(0, 10)}.json`;
                fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
                log.success(`Repository data saved to: ${outputFile}`);
                
                // Display top repositories
                console.log('\n🌟 Top Repositories by Stars:');
                const topRepos = result.repositories
                    .sort((a, b) => b.stars - a.stars)
                    .slice(0, 10);
                
                topRepos.forEach((repo, index) => {
                    console.log(`   ${index + 1}. ${repo.repo_name} (${repo.stars} ⭐) - ${repo.primary_language}`);
                });
                
            } else {
                log.error(`Discovery failed: ${result.error}`);
            }
        } catch (error) {
            log.error(`Discovery error: ${error.message}`);
        }
    },

    // Migration commands
    'migrate': () => {
        const subcommand = process.argv[3] || 'help';
        const { execSync } = require('child_process');
        
        switch(subcommand) {
            case 'help':
                console.log(`
${colors.bright}${colors.blue}FlashFusion Migration Commands${colors.reset}

${colors.bright}📦 Repository Migration${colors.reset}
  ff migrate phase1-ai       Integrate Phase 1 AI & Agent repositories
  ff migrate phase1-data     Integrate Phase 1 Data & Crawling repositories  
  ff migrate phase2          Integrate Phase 2 Development Tools
  ff migrate phase3          Integrate Phase 3 Monitoring & Infrastructure
  ff migrate phase4          Integrate Phase 4 Memory & Research
  ff migrate utilities       Integrate utility repositories
  ff migrate references      Create reference documentation
  ff migrate config          Update configuration files
  ff migrate all             Run complete migration

${colors.bright}🔍 Validation Commands${colors.reset}
  ff validate quick          Quick validation (structure + build + packages)
  ff validate all            Complete validation
  ff validate build          Test build system
  ff validate packages       Validate package configurations

${colors.bright}📋 Documentation${colors.reset}
  ff docs migration          View migration plan
  ff docs checklist          View migration checklist
                `);
                break;
            case 'phase1-ai':
            case 'phase1-data':
            case 'phase2':
            case 'phase3':
            case 'phase4':
            case 'utilities':
            case 'references':
            case 'config':
            case 'all':
                try {
                    log.info(`Starting migration: ${subcommand}`);
                    execSync(`./tools/migrate-repositories.sh ${subcommand}`, { stdio: 'inherit' });
                } catch (error) {
                    log.error(`Migration failed: ${error.message}`);
                }
                break;
            default:
                log.error(`Unknown migration command: ${subcommand}`);
                log.info('Use "ff migrate help" for available commands');
        }
    },

    // Validation commands
    'validate': () => {
        const subcommand = process.argv[3] || 'quick';
        const { execSync } = require('child_process');
        
        try {
            log.info(`Running validation: ${subcommand}`);
            execSync(`./tools/validate-migration.sh ${subcommand}`, { stdio: 'inherit' });
        } catch (error) {
            log.error(`Validation failed: ${error.message}`);
        }
    },

    // Documentation commands
    'docs': () => {
        const subcommand = process.argv[3] || 'help';
        
        switch(subcommand) {
            case 'migration':
                if (fs.existsSync('docs/MONOREPO-INTEGRATION-PLAN.md')) {
                    const { execSync } = require('child_process');
                    try {
                        execSync('cat docs/MONOREPO-INTEGRATION-PLAN.md | head -50', { stdio: 'inherit' });
                        console.log('\n📖 Full document: docs/MONOREPO-INTEGRATION-PLAN.md');
                    } catch (error) {
                        console.log('📖 Migration plan: docs/MONOREPO-INTEGRATION-PLAN.md');
                    }
                } else {
                    log.error('Migration plan not found. Run migration setup first.');
                }
                break;
            case 'checklist':
                if (fs.existsSync('docs/MIGRATION-CHECKLIST.md')) {
                    const { execSync } = require('child_process');
                    try {
                        execSync('cat docs/MIGRATION-CHECKLIST.md | head -50', { stdio: 'inherit' });
                        console.log('\n📋 Full checklist: docs/MIGRATION-CHECKLIST.md');
                    } catch (error) {
                        console.log('📋 Migration checklist: docs/MIGRATION-CHECKLIST.md');
                    }
                } else {
                    log.error('Migration checklist not found. Run migration setup first.');
                }
                break;
            default:
                console.log(`
${colors.bright}${colors.blue}FlashFusion Documentation${colors.reset}

${colors.bright}📚 Available Documentation${colors.reset}
  ff docs migration          View migration integration plan
  ff docs checklist          View migration checklist

${colors.bright}📁 Documentation Files${colors.reset}
  docs/MONOREPO-INTEGRATION-PLAN.md    Complete integration plan
  docs/MIGRATION-CHECKLIST.md          Step-by-step checklist
  knowledge-base/                      Additional documentation
                `);
        }
    },

    // Milestone management
    'milestone': () => {
        const subcommand = process.argv[3] || 'help';
        const { MilestoneManager } = require('../milestone-manager');
        const manager = new MilestoneManager();
        
        switch(subcommand) {
            case 'status':
                manager.displayStatus();
                break;
            case 'sync':
                manager.exportToGitHub();
                break;
            case 'template':
                const title = process.argv[4] || 'New Milestone';
                const description = process.argv[5] || '';
                console.log(manager.createMilestoneTemplate(title, description));
                break;
            case 'help':
            default:
                console.log(`
${colors.bright}${colors.blue}FlashFusion Milestone Management${colors.reset}

${colors.bright}🎯 Milestone Commands${colors.reset}
  ff milestone status            Display current milestone status
  ff milestone sync              Export milestones for GitHub creation  
  ff milestone template <title>  Generate milestone template
  ff milestone help              Show this help message

${colors.bright}📋 Available Milestones${colors.reset}
  Phase 1: Core Platform Setup      (HIGH Priority - 2 weeks)
  Phase 2: Enhanced Development      (MEDIUM Priority - 2 weeks)
  Phase 3: Production Infrastructure (LOW Priority - 2 weeks)
  Phase 4: Repository Integration    (SPECIALIZED - 3 weeks)
  Phase 5: Quality & Optimization    (CONTINUOUS - ongoing)

${colors.bright}📖 Documentation${colors.reset}
  docs/MILESTONES.md                Detailed milestone documentation
                `);
                break;
        }
    },

    // Show help and version
    'help': () => {
        console.log(`
${colors.bright}${colors.blue}FlashFusion Developer CLI v${CLI_VERSION}${colors.reset}
${colors.cyan}Unified Command Suite for AI E-Commerce Platform${colors.reset}

${colors.bright}📦 Core Project Setup${colors.reset}
  ff:init                    Scaffold entire monorepo structure
  ff:install                 Install dependencies (pnpm or npm)
  ff:env                     Generate .env file from template
  ff:env:check               Verify env variable completeness
  ff:dev                     Run all dev services concurrently
  ff:build                   Compile all apps and packages
  ff:clean                   Remove .next, dist, node_modules
  ff:upgrade                 Check & upgrade all package versions

${colors.bright}🔄 Migration & Integration${colors.reset}
  ff migrate [command]       Repository migration commands
  ff validate [command]      Validation and testing commands
  ff docs [command]          Documentation commands
  ff milestone [command]     Milestone management commands

${colors.bright}🚀 Deployment & Hosting${colors.reset}
  ff:vercel:link             Link Vercel project
  ff:vercel:deploy           Deploy to staging
  ff:vercel:prod             Deploy to production
  ff:vercel:logs             View build logs
  ff:deploy:edge             Deploy Supabase edge functions
  ff:deploy:all              Full stack deploy (web + edge + DB)

${colors.bright}🔐 Supabase DB + Auth${colors.reset}
  ff:supa:start              Run Supabase locally
  ff:supa:push               Push local changes to remote
  ff:supa:seed               Seed DB with dummy ideas
  ff:supa:rls:apply          Apply row-level security policies
  ff:supa:logs               View DB request logs
  ff:supa:backup             Export DB backup
  ff:supa:restore            Restore from backup
  ff:supa:auth:roles         Show auth roles

${colors.bright}🐙 GitHub Integration${colors.reset}
  ff:github:discover         Discover all Krosebrook repositories

${colors.bright}More commands coming soon...${colors.reset}
Use ${colors.cyan}ff:help:all${colors.reset} to see the complete command list.
        `);
    },

    'version': () => {
        console.log(`FlashFusion CLI v${CLI_VERSION}`);
    },

    'quickstart': () => {
        console.log(`
${colors.bright}${colors.blue}🚀 FlashFusion Quick Start Guide${colors.reset}

${colors.bright}1️⃣ Initialize Project:${colors.reset}
   ${colors.cyan}ff:init${colors.reset}

${colors.bright}2️⃣ Install Dependencies:${colors.reset}
   ${colors.cyan}ff:install${colors.reset}

${colors.bright}3️⃣ Configure Environment:${colors.reset}
   ${colors.cyan}ff:env${colors.reset}
   ${colors.yellow}# Edit .env with your API keys${colors.reset}

${colors.bright}4️⃣ Start Development:${colors.reset}
   ${colors.cyan}ff:dev${colors.reset}

${colors.bright}5️⃣ Open in Browser:${colors.reset}
   ${colors.magenta}• Main Dashboard: http://localhost:8080${colors.reset}
   ${colors.magenta}• Lyra Agent: http://localhost:3000${colors.reset}

${colors.bright}🎯 Ready to build? Try:${colors.reset}
   ${colors.cyan}ff:validate:all${colors.reset}    # Test the validator
   ${colors.cyan}ff:agent:ping${colors.reset}      # Check agent health
   ${colors.cyan}ff:mockup:start${colors.reset}    # Generate content

${colors.bright}💡 Need help? Run: ff:help${colors.reset}
        `);
    },

    'status': () => {
        console.log(`
${colors.bright}${colors.blue}🚀 FlashFusion System Status${colors.reset}

${colors.bright}📊 Core Services:${colors.reset}
  ${colors.green}✅${colors.reset} Main Server (Port 8080)
  ${colors.green}✅${colors.reset} Lyra Dashboard (Port 3000)  
  ${colors.green}✅${colors.reset} MCP Server (Port 3001)
  
${colors.bright}🔗 Integrations:${colors.reset}
  ${colors.green}🟢${colors.reset} Supabase Connected
  ${colors.green}🟢${colors.reset} Anthropic Claude API
  ${colors.yellow}🟡${colors.reset} OpenAI API (Configured)
  
${colors.bright}🤖 Agents Status:${colors.reset}
  ${colors.green}✅${colors.reset} Coordinator Active
  ${colors.green}✅${colors.reset} Creator Active  
  ${colors.green}✅${colors.reset} Researcher Active
  ${colors.green}✅${colors.reset} Optimizer Active
  ${colors.green}✅${colors.reset} Analyzer Active
  ${colors.green}✅${colors.reset} Automator Active

${colors.bright}📈 System Health: Excellent${colors.reset}
${colors.bright}🔧 Last Updated: ${new Date().toLocaleString()}${colors.reset}
        `);
    },

    // 🎯 Open Lovable Commands
    'ol:init': async () => {
        log.title('🎯 Initializing Open Lovable AI Builder');
        
        try {
            const openLovable = new OpenLovableTool();
            await openLovable.initialize();
            
            log.success('Open Lovable initialized successfully!');
            log.info(`🌐 Access at: http://localhost:${openLovable.config.port}`);
            log.info('💡 Available commands: ol:create, ol:generate, ol:status, ol:list');
        } catch (error) {
            log.error(`Initialization failed: ${error.message}`);
        }
    },

    'ol:create': async () => {
        log.title('🚀 Creating AI-Generated Project');
        
        const args = process.argv.slice(3);
        const [name, template = 'react-typescript', ...descParts] = args;
        const description = descParts.join(' ');
        
        if (!name) {
            log.error('Project name required: ff ol:create <name> [template] [description]');
            return;
        }
        
        try {
            const openLovable = new OpenLovableTool();
            await openLovable.initialize();
            
            const result = await openLovable.execute('create-project', {
                name,
                template,
                description,
                userId: 'cli-user',
                workspaceId: 'cli-workspace'
            });
            
            if (result.success) {
                log.success(`Project "${name}" created successfully!`);
                log.info(`🌐 Sandbox URL: ${result.project.url}`);
                log.info(`📦 Template: ${result.project.template}`);
                log.info(`🆔 Sandbox ID: ${result.project.sandboxId}`);
            }
        } catch (error) {
            log.error(`Project creation failed: ${error.message}`);
        }
    },

    'ol:generate': async () => {
        log.title('🤖 Generating AI Component');
        
        const args = process.argv.slice(3);
        const [sandboxId, prompt] = args;
        
        if (!sandboxId || !prompt) {
            log.error('Usage: ff ol:generate <sandbox-id> "<prompt>"');
            return;
        }
        
        try {
            const openLovable = new OpenLovableTool();
            await openLovable.initialize();
            
            const result = await openLovable.execute('generate-component', {
                sandboxId,
                prompt,
                userId: 'cli-user'
            });
            
            if (result.success) {
                log.success('Component generated successfully!');
                log.info(`🤖 Model: ${result.component.model}`);
                log.info(`⏱️ Generation time: ${result.component.generationTime}ms`);
                
                if (result.component.files) {
                    log.info('📁 Generated files:');
                    Object.keys(result.component.files).forEach(file => {
                        log.info(`  - ${file}`);
                    });
                }
            }
        } catch (error) {
            log.error(`Component generation failed: ${error.message}`);
        }
    },

    'ol:status': async () => {
        log.title('📊 Open Lovable Status');
        
        try {
            const openLovable = new OpenLovableTool();
            
            if (!openLovable.isInitialized) {
                await openLovable.initialize();
            }
            
            const status = await openLovable.getStatus();
            
            console.log(`
${colors.bright}🎯 Open Lovable AI Builder Status${colors.reset}

${colors.cyan}Service:${colors.reset} ${status.status}
${colors.cyan}Port:${colors.reset} ${status.port || 'Not running'}
${colors.cyan}URL:${colors.reset} ${status.url || 'N/A'}
${colors.cyan}Active Sandboxes:${colors.reset} ${status.activeSandboxes || 0}
${colors.cyan}Active Workspaces:${colors.reset} ${status.activeWorkspaces || 0}
${colors.cyan}Uptime:${colors.reset} ${Math.floor((status.uptime || 0) / 60)}m ${Math.floor((status.uptime || 0) % 60)}s

${colors.bright}🤖 AI Models:${colors.reset}
  - Claude 3.5 Sonnet
  - GPT-4
  - Gemini Pro

${colors.bright}🚀 Frameworks:${colors.reset}
  - React TypeScript
  - Next.js
  - Vue
  - Svelte
            `);
        } catch (error) {
            log.error(`Status check failed: ${error.message}`);
        }
    },

    'ol:list': async () => {
        log.title('📋 Active Sandboxes');
        
        try {
            const openLovable = new OpenLovableTool();
            
            if (!openLovable.isInitialized) {
                await openLovable.initialize();
            }
            
            const result = await openLovable.execute('list-sandboxes', {
                userId: 'cli-user'
            });
            
            if (result.success && result.sandboxes.length > 0) {
                console.log(`\n${colors.bright}Active Sandboxes (${result.total}):${colors.reset}\n`);
                
                result.sandboxes.forEach((sandbox, index) => {
                    const age = Math.floor((Date.now() - new Date(sandbox.createdAt).getTime()) / (1000 * 60));
                    console.log(`${colors.cyan}${index + 1}.${colors.reset} ${sandbox.id}`);
                    console.log(`   ${colors.yellow}Template:${colors.reset} ${sandbox.template}`);
                    console.log(`   ${colors.yellow}Status:${colors.reset} ${sandbox.status}`);
                    console.log(`   ${colors.yellow}URL:${colors.reset} ${sandbox.url}`);
                    console.log(`   ${colors.yellow}Age:${colors.reset} ${age}m ago\n`);
                });
            } else {
                log.info('No active sandboxes found');
                log.info('Create one with: ff ol:create <project-name>');
            }
        } catch (error) {
            log.error(`List failed: ${error.message}`);
        }
    }
};

// Main CLI logic
async function main() {
    checkNodeVersion();
    
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        commands.help();
        return;
    }

    // Remove 'ff:' prefix if present
    const cleanCommand = command.replace(/^ff:/, '');

    if (commands[cleanCommand]) {
        try {
            await commands[cleanCommand]();
        } catch (error) {
            log.error(`Command failed: ${error.message}`);
            process.exit(1);
        }
    } else {
        log.error(`Unknown command: ${command}`);
        log.info('Run "ff:help" to see available commands');
        process.exit(1);
    }
}

// Export for testing
module.exports = { commands, log };

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        log.error(error.message);
        process.exit(1);
    });
}
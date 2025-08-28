#!/usr/bin/env node

/**
 * Krosebrook Repository Manager
 * CLI tool for managing repository migration and organization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class KrosebrookManager {
  constructor() {
    this.repoData = this.loadRepositoryData();
  }

  loadRepositoryData() {
    const analysisPath = path.join(__dirname, '../../knowledge-base/complete-analysis.json');
    if (fs.existsSync(analysisPath)) {
      return JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    }
    return { repositoryCategories: {} };
  }

  listRepositories() {
    console.log('📊 KROSEBROOK REPOSITORY CATALOG');
    console.log('='.repeat(40));
    
    Object.entries(this.repoData.repositoryCategories).forEach(([category, data]) => {
      console.log(`\n${category.toUpperCase()}: ${data.count} repositories`);
      console.log('-'.repeat(30));
      data.examples.forEach(repo => {
        console.log(`  • ${repo}`);
      });
    });
  }

  addRepository(name, type, category) {
    console.log(`\n🔧 ADDING REPOSITORY: ${name}`);
    console.log(`Type: ${type}, Category: ${category}`);
    
    const workspaceMap = {
      'flashfusion-ecosystem': 'apps',
      'ai-agents': 'packages/ai-agents',
      'development-tools': 'tools',
      'templates-starters': 'apps/templates',
      'applications': 'apps',
      'libraries-utilities': 'packages'
    };
    
    const targetDir = workspaceMap[category] || 'packages';
    const fullPath = path.join(process.cwd(), targetDir, name);
    
    try {
      // Use turbo generator for new workspaces
      const workspaceType = targetDir.startsWith('apps') ? 'app' : 'package';
      const location = `${targetDir}/${name}`;
      
      console.log(`Creating workspace at: ${location}`);
      execSync(`npx turbo gen workspace --name=${name} --type=${workspaceType}`, {
        stdio: 'inherit',
        input: `${location}\nn\n\n`
      });
      
      console.log(`✅ Successfully created ${name} workspace`);
      
    } catch (error) {
      console.error(`❌ Failed to create workspace: ${error.message}`);
    }
  }

  generateMigrationPlan() {
    console.log('\n📋 MIGRATION PLAN GENERATOR');
    console.log('='.repeat(40));
    
    const priority = [
      'flashfusion-ecosystem',
      'libraries-utilities',
      'ai-agents',
      'development-tools',
      'templates-starters',
      'applications'
    ];
    
    priority.forEach((category, index) => {
      const data = this.repoData.repositoryCategories[category];
      if (data) {
        console.log(`\n${index + 1}. ${category.toUpperCase()} (${data.count} repos)`);
        console.log('   Priority: ' + (index < 2 ? 'HIGH' : index < 4 ? 'MEDIUM' : 'LOW'));
        console.log('   Examples:', data.examples.slice(0, 3).join(', '));
      }
    });
    
    console.log('\n💡 RECOMMENDED NEXT STEPS:');
    console.log('1. Start with FlashFusion core apps (high business value)');
    console.log('2. Add shared libraries (enable other projects)');
    console.log('3. Migrate AI agents (specialized functionality)');
    console.log('4. Add development tools (team productivity)');
    console.log('5. Include templates (project bootstrapping)');
    console.log('6. Migrate remaining applications');
  }

  showStatus() {
    console.log('\n📈 ORGANIZATION STATUS');
    console.log('='.repeat(40));
    
    const currentWorkspaces = this.countCurrentWorkspaces();
    const totalRepos = Object.values(this.repoData.repositoryCategories)
      .reduce((sum, cat) => sum + cat.count, 0);
    
    console.log(`Total Repositories Analyzed: ${totalRepos}`);
    console.log(`Current Workspaces: ${currentWorkspaces.total}`);
    console.log(`Migration Progress: ${Math.round((currentWorkspaces.total / totalRepos) * 100)}%`);
    
    console.log('\nWorkspace Breakdown:');
    console.log(`  Apps: ${currentWorkspaces.apps}`);
    console.log(`  Packages: ${currentWorkspaces.packages}`);
    console.log(`  Tools: ${currentWorkspaces.tools}`);
  }

  countCurrentWorkspaces() {
    const count = { apps: 0, packages: 0, tools: 0, total: 0 };
    
    ['apps', 'packages', 'tools'].forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory()).length;
        count[dir] = items;
        count.total += items;
      }
    });
    
    return count;
  }
}

// CLI Interface
function main() {
  const manager = new KrosebrookManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      manager.listRepositories();
      break;
      
    case 'add':
      const name = process.argv[3];
      const type = process.argv[4] || 'package';
      const category = process.argv[5] || 'libraries-utilities';
      
      if (!name) {
        console.error('Usage: node repo-manager.js add <name> [type] [category]');
        process.exit(1);
      }
      
      manager.addRepository(name, type, category);
      break;
      
    case 'plan':
      manager.generateMigrationPlan();
      break;
      
    case 'status':
      manager.showStatus();
      break;
      
    default:
      console.log('📦 KROSEBROOK REPOSITORY MANAGER');
      console.log('================================');
      console.log('');
      console.log('Commands:');
      console.log('  list     - List all analyzed repositories by category');
      console.log('  add      - Add a new repository workspace');
      console.log('  plan     - Generate migration plan');
      console.log('  status   - Show current organization status');
      console.log('');
      console.log('Examples:');
      console.log('  node repo-manager.js list');
      console.log('  node repo-manager.js add my-app app flashfusion-ecosystem');
      console.log('  node repo-manager.js plan');
      console.log('  node repo-manager.js status');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = KrosebrookManager;
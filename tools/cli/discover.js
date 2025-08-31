#!/usr/bin/env node

/**
 * Krosebrook Repository Discovery Tool
 * 
 * A CLI tool for searching, filtering, and discovering repositories
 * in the Krosebrook ecosystem based on various criteria.
 */

const fs = require('fs');
const path = require('path');

// Load repository index
const indexPath = path.join(__dirname, '../../knowledge-base/repository-index.json');
let repositoryIndex;

try {
  repositoryIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not load repository index:', error.message);
  process.exit(1);
}

const { repositories, categories, searchIndex } = repositoryIndex;

// CLI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`🚀 ${title}`, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');
}

function printSection(title) {
  console.log(colorize(`\n📋 ${title}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'dim'));
}

function formatStatus(status) {
  const statusColors = {
    'production-ready': 'green',
    'active': 'yellow',
    'stable': 'cyan',
    'early-development': 'magenta',
    'concept': 'dim'
  };
  const statusSymbols = {
    'production-ready': '✅',
    'active': '⭐',
    'stable': '🔒',
    'early-development': '🚧',
    'concept': '💡'
  };
  
  const color = statusColors[status] || 'white';
  const symbol = statusSymbols[status] || '❓';
  
  return `${symbol} ${colorize(status, color)}`;
}

function formatSize(size) {
  if (size === 0) return colorize('Empty', 'dim');
  if (size < 100) return colorize(`${size}KB`, 'green');
  if (size < 1000) return colorize(`${size}KB`, 'yellow');
  return colorize(`${(size/1000).toFixed(1)}MB`, 'red');
}

function printRepository(repo, detailed = false) {
  const r = repositories[repo];
  if (!r) return;

  console.log(`\n${colorize('📦', 'cyan')} ${colorize(r.name, 'bright')}`);
  console.log(`   ${r.description}`);
  console.log(`   ${formatStatus(r.status)} | ${colorize(r.language || 'Unknown', 'magenta')} | ${formatSize(r.size)}`);
  
  if (r.homepage) {
    console.log(`   🌐 ${colorize(r.homepage, 'blue')}`);
  }
  
  if (detailed) {
    if (r.features && r.features.length > 0) {
      console.log(`   ${colorize('✨ Features:', 'green')} ${r.features.slice(0, 3).join(', ')}`);
    }
    if (r.useCases && r.useCases.length > 0) {
      console.log(`   ${colorize('🎯 Use Cases:', 'yellow')} ${r.useCases.slice(0, 2).join(', ')}`);
    }
    if (r.developerValue) {
      console.log(`   ${colorize('💎 Value:', 'cyan')} ${r.developerValue}`);
    }
  }
}

function listByCategory(categoryKey) {
  const category = categories[categoryKey];
  if (!category) {
    console.log(colorize(`❌ Category '${categoryKey}' not found`, 'red'));
    return;
  }

  printHeader(`${category.name} (${category.count} repositories)`);
  console.log(category.description);
  
  category.repositories.forEach(repo => {
    printRepository(repo);
  });
}

function listByLanguage(language) {
  const repos = searchIndex.byLanguage[language];
  if (!repos) {
    console.log(colorize(`❌ No repositories found for language '${language}'`, 'red'));
    return;
  }

  printHeader(`${language} Repositories (${repos.length})`);
  repos.forEach(repo => {
    printRepository(repo);
  });
}

function listByStatus(status) {
  const repos = searchIndex.byStatus[status];
  if (!repos) {
    console.log(colorize(`❌ No repositories found with status '${status}'`, 'red'));
    return;
  }

  printHeader(`${status} Repositories (${repos.length})`);
  repos.forEach(repo => {
    printRepository(repo);
  });
}

function searchRepositories(query) {
  const results = [];
  const queryLower = query.toLowerCase();

  Object.keys(repositories).forEach(repoKey => {
    const repo = repositories[repoKey];
    const searchText = [
      repo.name,
      repo.description,
      repo.language,
      ...(repo.topics || []),
      ...(repo.features || []),
      ...(repo.useCases || []),
      repo.developerValue
    ].filter(Boolean).join(' ').toLowerCase();

    if (searchText.includes(queryLower)) {
      results.push(repoKey);
    }
  });

  if (results.length === 0) {
    console.log(colorize(`❌ No repositories found matching '${query}'`, 'red'));
    return;
  }

  printHeader(`Search Results for "${query}" (${results.length})`);
  results.forEach(repo => {
    printRepository(repo, true);
  });
}

function listByFeature(feature) {
  const repos = searchIndex.byFeature[feature];
  if (!repos) {
    console.log(colorize(`❌ No repositories found with feature '${feature}'`, 'red'));
    console.log(colorize(`Available features: ${Object.keys(searchIndex.byFeature).join(', ')}`, 'dim'));
    return;
  }

  printHeader(`Repositories with "${feature}" (${repos.length})`);
  repos.forEach(repo => {
    printRepository(repo, true);
  });
}

function showStats() {
  printHeader('Krosebrook Repository Statistics');
  
  console.log(`${colorize('📊 Overview', 'bright')}`);
  console.log(`   Total Repositories: ${colorize(repositoryIndex.metadata.totalRepositories, 'green')}`);
  console.log(`   Last Updated: ${colorize(new Date(repositoryIndex.metadata.lastUpdated).toLocaleDateString(), 'cyan')}`);
  
  printSection('By Category');
  Object.entries(categories).forEach(([key, cat]) => {
    console.log(`   ${colorize(cat.name, 'yellow')}: ${cat.count} repositories`);
  });
  
  printSection('By Language');
  Object.entries(searchIndex.byLanguage).forEach(([lang, repos]) => {
    console.log(`   ${colorize(lang, 'magenta')}: ${repos.length} repositories`);
  });
  
  printSection('By Status');
  Object.entries(searchIndex.byStatus).forEach(([status, repos]) => {
    console.log(`   ${formatStatus(status)}: ${repos.length} repositories`);
  });
  
  printSection('Quick Access');
  console.log(`   Most Important: ${repositoryIndex.quickAccess.mostImportant.length} repositories`);
  console.log(`   Production Ready: ${repositoryIndex.quickAccess.productionReady.length} repositories`);
  console.log(`   With Live Demos: ${repositoryIndex.quickAccess.withLiveDemos.length} repositories`);
  console.log(`   For Learning: ${repositoryIndex.quickAccess.forLearning.length} repositories`);
}

function showQuickAccess(type) {
  const quickAccess = repositoryIndex.quickAccess[type];
  if (!quickAccess) {
    console.log(colorize(`❌ Quick access type '${type}' not found`, 'red'));
    console.log(colorize(`Available types: ${Object.keys(repositoryIndex.quickAccess).join(', ')}`, 'dim'));
    return;
  }

  const typeNames = {
    mostImportant: 'Most Important',
    productionReady: 'Production Ready',
    withLiveDemos: 'With Live Demos',
    forLearning: 'For Learning'
  };

  printHeader(`${typeNames[type]} Repositories (${quickAccess.length})`);
  quickAccess.forEach(repo => {
    printRepository(repo, true);
  });
}

function showHelp() {
  printHeader('Krosebrook Repository Discovery Tool');
  
  console.log(`${colorize('🔍 Search Commands:', 'bright')}`);
  console.log(`   ${colorize('discover search <query>', 'cyan')}        Search repositories by keywords`);
  console.log(`   ${colorize('discover category <name>', 'cyan')}       List repositories by category`);
  console.log(`   ${colorize('discover language <lang>', 'cyan')}       List repositories by programming language`);
  console.log(`   ${colorize('discover status <status>', 'cyan')}       List repositories by development status`);
  console.log(`   ${colorize('discover feature <feature>', 'cyan')}     List repositories by feature`);
  
  console.log(`\n${colorize('📊 Information Commands:', 'bright')}`);
  console.log(`   ${colorize('discover stats', 'cyan')}                 Show repository statistics`);
  console.log(`   ${colorize('discover quick <type>', 'cyan')}          Show quick access lists`);
  console.log(`   ${colorize('discover help', 'cyan')}                  Show this help message`);
  
  console.log(`\n${colorize('📋 Available Categories:', 'bright')}`);
  Object.entries(categories).forEach(([key, cat]) => {
    console.log(`   ${colorize(key, 'yellow')}: ${cat.name}`);
  });
  
  console.log(`\n${colorize('💻 Available Languages:', 'bright')}`);
  console.log(`   ${Object.keys(searchIndex.byLanguage).map(l => colorize(l, 'magenta')).join(', ')}`);
  
  console.log(`\n${colorize('🚦 Available Statuses:', 'bright')}`);
  Object.keys(searchIndex.byStatus).forEach(status => {
    console.log(`   ${formatStatus(status)}`);
  });
  
  console.log(`\n${colorize('⚡ Quick Access Types:', 'bright')}`);
  console.log(`   ${Object.keys(repositoryIndex.quickAccess).map(t => colorize(t, 'cyan')).join(', ')}`);
  
  console.log(`\n${colorize('🎯 Available Features:', 'bright')}`);
  console.log(`   ${Object.keys(searchIndex.byFeature).map(f => colorize(f, 'green')).join(', ')}`);
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showStats();
    return;
  }
  
  const command = args[0];
  const parameter = args[1];
  
  switch (command) {
    case 'search':
      if (!parameter) {
        console.log(colorize('❌ Please provide a search query', 'red'));
        return;
      }
      searchRepositories(parameter);
      break;
      
    case 'category':
      if (!parameter) {
        console.log(colorize('❌ Please specify a category', 'red'));
        console.log(colorize(`Available: ${Object.keys(categories).join(', ')}`, 'dim'));
        return;
      }
      listByCategory(parameter);
      break;
      
    case 'language':
      if (!parameter) {
        console.log(colorize('❌ Please specify a language', 'red'));
        console.log(colorize(`Available: ${Object.keys(searchIndex.byLanguage).join(', ')}`, 'dim'));
        return;
      }
      listByLanguage(parameter);
      break;
      
    case 'status':
      if (!parameter) {
        console.log(colorize('❌ Please specify a status', 'red'));
        console.log(colorize(`Available: ${Object.keys(searchIndex.byStatus).join(', ')}`, 'dim'));
        return;
      }
      listByStatus(parameter);
      break;
      
    case 'feature':
      if (!parameter) {
        console.log(colorize('❌ Please specify a feature', 'red'));
        console.log(colorize(`Available: ${Object.keys(searchIndex.byFeature).join(', ')}`, 'dim'));
        return;
      }
      listByFeature(parameter);
      break;
      
    case 'quick':
      if (!parameter) {
        console.log(colorize('❌ Please specify a quick access type', 'red'));
        console.log(colorize(`Available: ${Object.keys(repositoryIndex.quickAccess).join(', ')}`, 'dim'));
        return;
      }
      showQuickAccess(parameter);
      break;
      
    case 'stats':
      showStats();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log(colorize(`❌ Unknown command: ${command}`, 'red'));
      console.log(colorize('Run "discover help" for usage information', 'dim'));
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  searchRepositories,
  listByCategory,
  listByLanguage,
  listByStatus,
  showStats
};
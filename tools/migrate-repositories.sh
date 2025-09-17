#!/bin/bash

# FlashFusion Monorepo Migration Script
# This script automates the repository integration process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
REPO_BASE_URL="https://github.com/Krosebrook"
BACKUP_BRANCH_PREFIX="backup-before"
TURBOREPO_ROOT=$(pwd)

# Check if we're in the right directory
if [ ! -f "turbo.json" ]; then
    log_error "This script must be run from the turborepo-flashfusion root directory"
    exit 1
fi

# Function to create backup branch
create_backup() {
    local repo_name=$1
    local backup_branch="${BACKUP_BRANCH_PREFIX}-${repo_name}"
    
    log_info "Creating backup branch: ${backup_branch}"
    git checkout -b "${backup_branch}"
    git push origin "${backup_branch}" || log_warning "Could not push backup branch"
    git checkout main
}

# Function to add repository as subtree
add_subtree() {
    local repo_name=$1
    local destination_path=$2
    local branch=${3:-main}
    local squash=${4:-true}
    
    log_info "Adding ${repo_name} to ${destination_path}"
    
    # Create backup
    create_backup "${repo_name}"
    
    # Add remote
    git remote add "${repo_name}" "${REPO_BASE_URL}/${repo_name}.git" 2>/dev/null || log_warning "Remote ${repo_name} already exists"
    
    # Fetch repository
    git fetch "${repo_name}"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "${destination_path}")"
    
    # Add subtree
    if [ "${squash}" = "true" ]; then
        git subtree add --prefix="${destination_path}" "${repo_name}" "${branch}" --squash
    else
        git subtree add --prefix="${destination_path}" "${repo_name}" "${branch}"
    fi
    
    log_success "Successfully added ${repo_name} to ${destination_path}"
}

# Function to copy repository content (for templates and references)
copy_repository() {
    local repo_name=$1
    local destination_path=$2
    local branch=${3:-main}
    
    log_info "Copying ${repo_name} to ${destination_path}"
    
    # Create temporary directory
    local temp_dir="/tmp/${repo_name}-copy"
    rm -rf "${temp_dir}"
    
    # Clone repository
    git clone "${REPO_BASE_URL}/${repo_name}.git" "${temp_dir}"
    cd "${temp_dir}"
    git checkout "${branch}"
    
    # Return to turborepo root
    cd "${TURBOREPO_ROOT}"
    
    # Create destination directory
    mkdir -p "${destination_path}"
    
    # Copy content (excluding .git)
    cp -r "${temp_dir}"/* "${destination_path}/" 2>/dev/null || log_warning "Some files could not be copied"
    
    # Add to git
    git add "${destination_path}"
    git commit -m "Add ${repo_name} content to ${destination_path}"
    
    # Cleanup
    rm -rf "${temp_dir}"
    
    log_success "Successfully copied ${repo_name} to ${destination_path}"
}

# Function to test build after integration
test_build() {
    log_info "Testing build..."
    
    # Install dependencies
    npm install
    
    # Run build
    if npm run build; then
        log_success "Build successful"
        return 0
    else
        log_error "Build failed"
        return 1
    fi
}

# Function to integrate Phase 1 repositories (AI & Agent Orchestration)
integrate_phase1_ai() {
    log_info "Starting Phase 1: AI & Agent Orchestration"
    
    # Core AI repositories
    add_subtree "activepieces" "packages/workflow-automation"
    add_subtree "claude-code" "apps/claude-terminal"
    add_subtree "claude-flow" "packages/agent-orchestrator"
    add_subtree "claude-code-by-agents" "apps/multi-agent-desktop"
    add_subtree "claude-code-router" "packages/claude-middleware"
    add_subtree "agentops" "packages/agent-monitoring"
    add_subtree "Roo-Code" "apps/ai-dev-team"
    
    # MCP Integrations (keep subset)
    add_subtree "crewai" "packages/mcp-integrations/crewai"
    add_subtree "autogen" "packages/mcp-integrations/autogen" 
    add_subtree "langgraph" "packages/mcp-integrations/langgraph"
    
    log_success "Phase 1 AI & Agent Orchestration complete"
}

# Function to integrate Phase 1 repositories (Data & Crawling)
integrate_phase1_data() {
    log_info "Starting Phase 1: Web Crawling & Data"
    
    # Firecrawl ecosystem
    add_subtree "firecrawl" "packages/data-crawler/core"
    add_subtree "firecrawl-mcp-server" "packages/data-crawler/mcp"
    add_subtree "enhanced-firecrawl-scraper" "tools/enhanced-scraper"
    
    # Copy examples and docs
    copy_repository "firecrawl-app-examples" "packages/data-crawler/examples"
    copy_repository "firecrawl-docs" "packages/data-crawler/docs"
    
    # React cloner tool
    add_subtree "open-lovable" "tools/react-cloner"
    
    log_success "Phase 1 Web Crawling & Data complete"
}

# Function to integrate Phase 2 repositories (Dev Tools)
integrate_phase2_devtools() {
    log_info "Starting Phase 2: Development Tools & Templates"
    
    # UI Framework
    add_subtree "heroui" "packages/ui/heroui"
    add_subtree "heroui-cli" "tools/heroui-cli"
    add_subtree "zod" "packages/schema-validation"
    add_subtree "stagehand" "packages/ui-automation"
    
    # Templates
    copy_repository "vite-react-heroui-template" "templates/vite-heroui"
    copy_repository "next-app-template" "templates/nextjs-app"
    copy_repository "portfolio-template" "templates/portfolio"
    
    log_success "Phase 2 Development Tools & Templates complete"
}

# Function to integrate Phase 3 repositories (Monitoring)
integrate_phase3_monitoring() {
    log_info "Starting Phase 3: Monitoring & Observability"
    
    # Monitoring applications
    add_subtree "uptime-kuma" "apps/uptime-dashboard"
    add_subtree "oneuptime" "apps/observability-platform"
    add_subtree "Checkmate" "packages/monitoring/server-monitoring"
    
    # Infrastructure tools
    add_subtree "firebase-tools" "tools/firebase"
    add_subtree "supabase-js" "packages/database/supabase"
    
    # Infrastructure templates
    copy_repository "terraform" "templates/infrastructure/terraform"
    
    log_success "Phase 3 Monitoring & Observability complete"
}

# Function to integrate Phase 4 repositories (Memory & Research)
integrate_phase4_memory() {
    log_info "Starting Phase 4: Memory & Research"
    
    # Memory systems (Python with TypeScript wrappers)
    add_subtree "mem0" "packages/memory/mem0"
    add_subtree "letta" "packages/memory/letta"
    add_subtree "gpt-researcher" "packages/research/gpt-researcher"
    
    # Create TypeScript wrappers
    mkdir -p packages/memory/mem0/typescript-wrapper
    mkdir -p packages/memory/letta/typescript-wrapper
    mkdir -p packages/research/gpt-researcher/typescript-wrapper
    
    log_success "Phase 4 Memory & Research complete"
}

# Function to integrate utilities
integrate_utilities() {
    log_info "Starting Utilities Integration"
    
    # API and database tools
    add_subtree "d1-rest" "packages/database/d1-rest"
    add_subtree "login" "packages/auth/login"
    
    # Development tools
    add_subtree "sqlfluff" "tools/sql-formatter"
    add_subtree "yt-dlp" "tools/media-downloader"
    
    # API connectors
    copy_repository "pipedream" "packages/api-connectors"
    
    log_success "Utilities Integration complete"
}

# Function to create reference documentation
create_reference_docs() {
    log_info "Creating reference documentation"
    
    # Create reference directory structure
    mkdir -p docs/references/{business-systems,security,awesome-collections,terminal-ai}
    mkdir -p docs/references/business-systems/{inventory,no-code,workflow}
    
    # Create reference documentation files
    cat > docs/references/README.md << 'EOF'
# Reference Documentation

This directory contains reference documentation and patterns extracted from various repositories that are not directly integrated but provide valuable insights for FlashFusion development.

## Structure

- `business-systems/` - Patterns from business and SaaS systems
- `security/` - Security tool integration patterns
- `awesome-collections/` - Curated lists and resources
- `terminal-ai/` - Terminal AI tool patterns

## Usage

These references are for inspiration and pattern extraction. They are not executable code but provide architectural guidance and best practices.
EOF

    git add docs/references/
    git commit -m "Add reference documentation structure"
    
    log_success "Reference documentation created"
}

# Function to update configuration files
update_configurations() {
    log_info "Updating configuration files"
    
    # Update turbo.json with new tasks
    cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        "dist/**",
        "build/**",
        "storybook-static/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "format": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    }
  },
  "globalDependencies": [
    "**/.env.*local",
    "**/.env",
    "**/package.json",
    "**/tsconfig.json",
    "**/tailwind.config.js"
  ],
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "GITHUB_TOKEN",
    "VERCEL_TOKEN"
  ]
}
EOF

    # Create a comprehensive package.json updater
    node -e "
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add new scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'dev:all': 'turbo dev --parallel',
      'dev:apps': 'turbo dev --filter=\"./apps/*\" --parallel',
      'dev:packages': 'turbo dev --filter=\"./packages/*\" --parallel',
      'build:packages': 'turbo build --filter=\"./packages/*\"',
      'test:unit': 'turbo test --filter=\"./packages/*\"',
      'test:integration': 'turbo test --filter=\"./apps/*\"',
      'test:e2e': 'turbo test:e2e',
      'storybook': 'turbo storybook --filter=\"@flashfusion/ui\"',
      'gen:component': 'ff create component',
      'gen:agent': 'ff create agent',
      'gen:workflow': 'ff create workflow'
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    "
    
    git add turbo.json package.json
    git commit -m "Update configuration files for expanded monorepo"
    
    log_success "Configuration files updated"
}

# Main execution function
main() {
    log_info "Starting FlashFusion Monorepo Migration"
    log_info "Current directory: $(pwd)"
    
    # Verify we're in the right place
    if [ ! -f "turbo.json" ]; then
        log_error "Not in turborepo root directory"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-all}" in
        "phase1-ai")
            integrate_phase1_ai
            test_build
            ;;
        "phase1-data")
            integrate_phase1_data
            test_build
            ;;
        "phase2")
            integrate_phase2_devtools
            test_build
            ;;
        "phase3")
            integrate_phase3_monitoring
            test_build
            ;;
        "phase4")
            integrate_phase4_memory
            test_build
            ;;
        "utilities")
            integrate_utilities
            test_build
            ;;
        "references")
            create_reference_docs
            ;;
        "config")
            update_configurations
            ;;
        "all")
            log_info "Running complete migration (this will take a while...)"
            integrate_phase1_ai
            test_build || log_error "Build failed after Phase 1 AI"
            
            integrate_phase1_data
            test_build || log_error "Build failed after Phase 1 Data"
            
            integrate_phase2_devtools
            test_build || log_error "Build failed after Phase 2"
            
            integrate_phase3_monitoring
            test_build || log_error "Build failed after Phase 3"
            
            integrate_phase4_memory
            test_build || log_error "Build failed after Phase 4"
            
            integrate_utilities
            test_build || log_error "Build failed after utilities"
            
            create_reference_docs
            update_configurations
            
            log_success "Complete migration finished!"
            ;;
        "help"|"-h"|"--help")
            echo "FlashFusion Monorepo Migration Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  phase1-ai    - Integrate Phase 1 AI & Agent repositories"
            echo "  phase1-data  - Integrate Phase 1 Data & Crawling repositories"
            echo "  phase2       - Integrate Phase 2 Development Tools repositories"
            echo "  phase3       - Integrate Phase 3 Monitoring repositories"
            echo "  phase4       - Integrate Phase 4 Memory & Research repositories"
            echo "  utilities    - Integrate utility repositories"
            echo "  references   - Create reference documentation"
            echo "  config       - Update configuration files"
            echo "  all          - Run complete migration (default)"
            echo "  help         - Show this help message"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
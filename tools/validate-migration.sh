#!/bin/bash

# FlashFusion Monorepo Validation Script
# This script validates the integration status and health of the monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_section() {
    echo -e "\n${PURPLE}==== $1 ====${NC}"
}

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check and track results
run_check() {
    local description=$1
    local command=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" >/dev/null 2>&1; then
        log_success "$description"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        log_error "$description"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    local path=$1
    local description=$2
    run_check "$description" "[ -d '$path' ]"
}

# Function to check if file exists
check_file() {
    local path=$1
    local description=$2
    run_check "$description" "[ -f '$path' ]"
}

# Function to check package.json structure
check_package_json() {
    local path=$1
    local package_name=$2
    
    if [ -f "$path/package.json" ]; then
        local name=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$path/package.json', 'utf8')).name || '')")
        if [ "$name" = "$package_name" ]; then
            log_success "Package $package_name has correct name"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "Package at $path has name '$name', expected '$package_name'"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    else
        log_error "No package.json found at $path"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Validate directory structure
validate_structure() {
    log_section "Directory Structure Validation"
    
    # Apps
    check_directory "apps/web" "Main web application"
    check_directory "apps/api" "API application"
    
    # Packages
    check_directory "packages/ai-agents" "AI agents package"
    check_directory "packages/shared" "Shared utilities package"
    
    # Tools
    check_directory "tools/cli" "CLI tools"
    
    # Documentation
    check_directory "docs" "Documentation directory"
    check_file "docs/MONOREPO-INTEGRATION-PLAN.md" "Integration plan document"
    check_file "docs/MIGRATION-CHECKLIST.md" "Migration checklist"
}

# Validate Phase 1 AI & Agent Orchestration
validate_phase1_ai() {
    log_section "Phase 1 AI & Agent Orchestration"
    
    # Core AI repositories
    check_directory "packages/workflow-automation" "activepieces → workflow-automation"
    check_directory "apps/claude-terminal" "claude-code → claude-terminal"
    check_directory "packages/agent-orchestrator" "claude-flow → agent-orchestrator"
    check_directory "apps/multi-agent-desktop" "claude-code-by-agents → multi-agent-desktop"
    check_directory "packages/claude-middleware" "claude-code-router → claude-middleware"
    check_directory "packages/agent-monitoring" "agentops → agent-monitoring"
    check_directory "apps/ai-dev-team" "Roo-Code → ai-dev-team"
    
    # MCP integrations
    check_directory "packages/mcp-integrations/crewai" "crewai MCP integration"
    check_directory "packages/mcp-integrations/autogen" "autogen MCP integration"
    check_directory "packages/mcp-integrations/langgraph" "langgraph MCP integration"
}

# Validate Phase 1 Data & Crawling
validate_phase1_data() {
    log_section "Phase 1 Web Crawling & Data"
    
    # Firecrawl ecosystem
    check_directory "packages/data-crawler/core" "firecrawl → data-crawler/core"
    check_directory "packages/data-crawler/mcp" "firecrawl-mcp-server → data-crawler/mcp"
    check_directory "packages/data-crawler/examples" "firecrawl-app-examples → data-crawler/examples"
    check_directory "packages/data-crawler/docs" "firecrawl-docs → data-crawler/docs"
    check_directory "tools/enhanced-scraper" "enhanced-firecrawl-scraper → enhanced-scraper"
    check_directory "tools/react-cloner" "open-lovable → react-cloner"
}

# Validate Phase 2 Development Tools
validate_phase2_devtools() {
    log_section "Phase 2 Development Tools & Templates"
    
    # UI Framework
    check_directory "packages/ui/heroui" "heroui → ui/heroui"
    check_directory "tools/heroui-cli" "heroui-cli → heroui-cli"
    check_directory "packages/schema-validation" "zod → schema-validation"
    check_directory "packages/ui-automation" "stagehand → ui-automation"
    
    # Templates
    check_directory "templates/vite-heroui" "vite-react-heroui-template → vite-heroui"
    check_directory "templates/nextjs-app" "next-app-template → nextjs-app"
    check_directory "templates/portfolio" "portfolio-template → portfolio"
}

# Validate Phase 3 Monitoring & Infrastructure
validate_phase3_monitoring() {
    log_section "Phase 3 Monitoring & Infrastructure"
    
    # Monitoring applications
    check_directory "apps/uptime-dashboard" "uptime-kuma → uptime-dashboard"
    check_directory "apps/observability-platform" "oneuptime → observability-platform"
    check_directory "packages/monitoring/server-monitoring" "Checkmate → monitoring/server-monitoring"
    
    # Infrastructure tools
    check_directory "tools/firebase" "firebase-tools → firebase"
    check_directory "packages/database/supabase" "supabase components → database/supabase"
    check_directory "templates/infrastructure/terraform" "terraform → infrastructure/terraform"
}

# Validate Phase 4 Memory & Research
validate_phase4_memory() {
    log_section "Phase 4 Memory & Research"
    
    # Memory systems
    check_directory "packages/memory/mem0" "mem0 → memory/mem0"
    check_directory "packages/memory/letta" "letta → memory/letta"
    check_directory "packages/research/gpt-researcher" "gpt-researcher → research/gpt-researcher"
    
    # TypeScript wrappers
    check_directory "packages/memory/mem0/typescript-wrapper" "mem0 TypeScript wrapper"
    check_directory "packages/memory/letta/typescript-wrapper" "letta TypeScript wrapper"
    check_directory "packages/research/gpt-researcher/typescript-wrapper" "gpt-researcher TypeScript wrapper"
}

# Validate Utilities
validate_utilities() {
    log_section "Utilities Integration"
    
    # API and database tools
    check_directory "packages/database/d1-rest" "d1-rest → database/d1-rest"
    check_directory "packages/auth/login" "login → auth/login"
    
    # Development tools
    check_directory "tools/sql-formatter" "sqlfluff → sql-formatter"
    check_directory "tools/media-downloader" "yt-dlp → media-downloader"
    check_directory "packages/api-connectors" "pipedream → api-connectors"
}

# Validate Reference Documentation
validate_references() {
    log_section "Reference Documentation"
    
    # Reference structure
    check_directory "docs/references" "References directory"
    check_directory "docs/references/business-systems" "Business systems references"
    check_directory "docs/references/security" "Security tools references"
    check_directory "docs/references/awesome-collections" "Awesome collections"
    check_directory "docs/references/terminal-ai" "Terminal AI references"
    
    check_file "docs/references/README.md" "References README"
}

# Validate build system
validate_build_system() {
    log_section "Build System Validation"
    
    # Check configuration files
    check_file "turbo.json" "Turborepo configuration"
    check_file "package.json" "Root package.json"
    
    # Check if key scripts exist
    if [ -f "package.json" ]; then
        local scripts=$(node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).scripts || {}).join(' '))")
        
        if [[ $scripts == *"dev:all"* ]]; then
            log_success "dev:all script exists"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_error "dev:all script missing"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        if [[ $scripts == *"build:packages"* ]]; then
            log_success "build:packages script exists"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_error "build:packages script missing"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Validate package configurations
validate_packages() {
    log_section "Package Configuration Validation"
    
    # Find all package.json files in packages and apps
    local package_dirs=(
        "apps/web:@flashfusion/web"
        "apps/api:@flashfusion/api"
        "packages/ai-agents:@flashfusion/ai-agents"
        "packages/shared:@flashfusion/shared"
        "tools/cli:@flashfusion/cli"
    )
    
    for entry in "${package_dirs[@]}"; do
        IFS=':' read -ra ADDR <<< "$entry"
        local dir="${ADDR[0]}"
        local expected_name="${ADDR[1]}"
        
        if [ -d "$dir" ]; then
            check_package_json "$dir" "$expected_name"
        fi
    done
}

# Run build test
test_build() {
    log_section "Build Testing"
    
    log_info "Installing dependencies..."
    if npm install >/dev/null 2>&1; then
        log_success "Dependencies installed successfully"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_error "Failed to install dependencies"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_info "Running build..."
    if npm run build >/dev/null 2>&1; then
        log_success "Build completed successfully"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_error "Build failed"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# Run linting test
test_linting() {
    log_section "Code Quality Testing"
    
    if command -v npm >/dev/null 2>&1; then
        log_info "Running linting..."
        if npm run lint >/dev/null 2>&1; then
            log_success "Linting passed"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "Linting issues found"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        log_info "Running type checking..."
        if npm run type-check >/dev/null 2>&1; then
            log_success "Type checking passed"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "Type checking issues found"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Generate report
generate_report() {
    log_section "Validation Report"
    
    echo -e "\n${BLUE}📊 VALIDATION SUMMARY${NC}"
    echo "===================="
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "Success Rate: $success_rate%"
    
    if [ $success_rate -ge 90 ]; then
        echo -e "\n${GREEN}🎉 EXCELLENT! Migration is in great shape.${NC}"
    elif [ $success_rate -ge 75 ]; then
        echo -e "\n${YELLOW}👍 GOOD! Most components are integrated successfully.${NC}"
    elif [ $success_rate -ge 50 ]; then
        echo -e "\n${YELLOW}⚠️  PARTIAL! Some components need attention.${NC}"
    else
        echo -e "\n${RED}❌ NEEDS WORK! Many components are missing or broken.${NC}"
    fi
    
    # Save report to file
    cat > validation-report.txt << EOF
FlashFusion Monorepo Validation Report
Generated: $(date)

Total Checks: $TOTAL_CHECKS
Passed: $PASSED_CHECKS
Failed: $FAILED_CHECKS
Success Rate: $success_rate%

Status: $(if [ $success_rate -ge 90 ]; then echo "EXCELLENT"; elif [ $success_rate -ge 75 ]; then echo "GOOD"; elif [ $success_rate -ge 50 ]; then echo "PARTIAL"; else echo "NEEDS WORK"; fi)
EOF
    
    echo -e "\n${BLUE}📄 Report saved to: validation-report.txt${NC}"
}

# Main execution function
main() {
    echo -e "${PURPLE}🔍 FlashFusion Monorepo Validation${NC}"
    echo "===================================="
    
    # Check if we're in the right directory
    if [ ! -f "turbo.json" ]; then
        log_error "This script must be run from the turborepo-flashfusion root directory"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-all}" in
        "structure")
            validate_structure
            ;;
        "phase1-ai")
            validate_phase1_ai
            ;;
        "phase1-data")
            validate_phase1_data
            ;;
        "phase2")
            validate_phase2_devtools
            ;;
        "phase3")
            validate_phase3_monitoring
            ;;
        "phase4")
            validate_phase4_memory
            ;;
        "utilities")
            validate_utilities
            ;;
        "references")
            validate_references
            ;;
        "build")
            test_build
            ;;
        "lint")
            test_linting
            ;;
        "packages")
            validate_packages
            ;;
        "all")
            validate_structure
            validate_phase1_ai
            validate_phase1_data
            validate_phase2_devtools
            validate_phase3_monitoring
            validate_phase4_memory
            validate_utilities
            validate_references
            validate_build_system
            validate_packages
            test_build
            test_linting
            ;;
        "quick")
            validate_structure
            validate_build_system
            validate_packages
            ;;
        "help"|"-h"|"--help")
            echo "FlashFusion Monorepo Validation Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  structure    - Validate basic directory structure"
            echo "  phase1-ai    - Validate Phase 1 AI & Agent repositories"
            echo "  phase1-data  - Validate Phase 1 Data & Crawling repositories"
            echo "  phase2       - Validate Phase 2 Development Tools"
            echo "  phase3       - Validate Phase 3 Monitoring & Infrastructure"
            echo "  phase4       - Validate Phase 4 Memory & Research"
            echo "  utilities    - Validate utility integrations"
            echo "  references   - Validate reference documentation"
            echo "  build        - Test build system"
            echo "  lint         - Test code quality"
            echo "  packages     - Validate package configurations"
            echo "  quick        - Run quick validation (structure + build + packages)"
            echo "  all          - Run complete validation (default)"
            echo "  help         - Show this help message"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    generate_report
}

# Run main function with all arguments
main "$@"
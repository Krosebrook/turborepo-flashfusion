#!/bin/bash

# Database Migration Deployment Script
# Integrates database migrations with the deployment process

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
ENVIRONMENT=${1:-development}
DRY_RUN=${2:-false}
SKIP_BACKUP=${3:-false}

log_info "Starting database migration deployment for environment: ${ENVIRONMENT}"

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "✅ Environment '${ENVIRONMENT}' is valid"
            ;;
        *)
            log_error "❌ Invalid environment: ${ENVIRONMENT}"
            log_info "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "🔍 Checking prerequisites..."
    
    # Check if node is available
    if ! command -v node &> /dev/null; then
        log_error "❌ Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check if ff CLI is available
    if [ ! -f "tools/cli/ff-cli.js" ]; then
        log_error "❌ FlashFusion CLI not found"
        exit 1
    fi
    
    # Check if migrations directory exists
    if [ ! -d "migrations" ]; then
        log_warning "⚠️ Migrations directory not found - creating it"
        mkdir -p migrations
    fi
    
    log_success "✅ Prerequisites check passed"
}

# Create deployment checkpoint
create_checkpoint() {
    local checkpoint_name="deploy_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S)"
    log_info "📊 Creating deployment checkpoint: ${checkpoint_name}"
    
    # Get current git commit
    local commit_hash=""
    if git rev-parse --git-dir > /dev/null 2>&1; then
        commit_hash=$(git rev-parse HEAD)
        log_info "   Git commit: ${commit_hash:0:8}"
    fi
    
    # Get current schema version (if migration tracking table exists)
    log_info "   Environment: ${ENVIRONMENT}"
    log_info "   Timestamp: $(date)"
    
    return 0
}

# Run migrations with proper error handling
run_migrations() {
    log_info "🚀 Running database migrations..."
    
    local dry_run_flag=""
    if [ "$DRY_RUN" = "true" ]; then
        dry_run_flag="--dry-run"
        log_warning "🧪 DRY RUN MODE - No changes will be applied"
    fi
    
    # Set environment variable
    export NODE_ENV=$ENVIRONMENT
    
    # Run migration status check first
    log_info "📊 Checking migration status..."
    if node tools/cli/ff-cli.js db status; then
        log_success "✅ Migration status check completed"
    else
        log_error "❌ Failed to check migration status"
        return 1
    fi
    
    # Run migrations
    log_info "🔄 Executing migrations..."
    if node tools/cli/ff-cli.js db migrate $dry_run_flag; then
        log_success "✅ Migrations completed successfully"
        return 0
    else
        log_error "❌ Migrations failed"
        return 1
    fi
}

# Validate schema after migration
validate_schema() {
    log_info "🔍 Validating database schema..."
    
    # Run application health checks
    if [ -f "tools/health-check.js" ]; then
        if node tools/health-check.js; then
            log_success "✅ Application health check passed"
        else
            log_warning "⚠️ Application health check failed"
        fi
    else
        log_info "ℹ️ No health check script found - skipping"
    fi
    
    # Validate migration status
    export NODE_ENV=$ENVIRONMENT
    if node tools/cli/ff-cli.js db status | grep -q "up-to-date"; then
        log_success "✅ Database schema validation passed"
        return 0
    else
        log_warning "⚠️ Database may have pending migrations"
        return 1
    fi
}

# Rollback procedure
rollback_migrations() {
    log_warning "🔄 Initiating migration rollback procedure..."
    
    # This is a placeholder for rollback logic
    # In practice, you'd implement specific rollback procedures
    log_info "   1. Stopping application services"
    log_info "   2. Restoring database backup (if available)"
    log_info "   3. Rolling back recent migrations"
    
    # Example rollback command (commented out for safety)
    # node tools/cli/ff-cli.js db rollback <last_migration>
    
    log_warning "⚠️ Manual intervention may be required for complete rollback"
}

# Main deployment workflow
main() {
    log_info "🚀 Database Migration Deployment Script"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Dry Run: ${DRY_RUN}"
    log_info "Skip Backup: ${SKIP_BACKUP}"
    echo ""
    
    # Step 1: Validate environment and prerequisites
    validate_environment
    check_prerequisites
    
    # Step 2: Create deployment checkpoint
    create_checkpoint
    
    # Step 3: Run migrations
    if run_migrations; then
        log_success "🎉 Migration deployment completed successfully"
        
        # Step 4: Validate schema
        if validate_schema; then
            log_success "🎉 Schema validation passed - deployment successful"
            exit 0
        else
            log_warning "⚠️ Schema validation failed - manual review recommended"
            exit 2
        fi
    else
        log_error "💥 Migration deployment failed"
        
        # Offer rollback option
        echo ""
        log_warning "Would you like to initiate rollback procedures? (y/N)"
        if [ "$DRY_RUN" != "true" ]; then
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                rollback_migrations
            fi
        fi
        
        exit 1
    fi
}

# Help function
show_help() {
    echo "Database Migration Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [dry_run] [skip_backup]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (development|staging|production)"
    echo "  dry_run        Run in dry-run mode (true|false)"
    echo "  skip_backup    Skip backup creation (true|false)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 staging true"
    echo "  $0 production false false"
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV       Will be set to the specified environment"
    echo "  DATABASE_URL   Should be configured for the target environment"
    echo ""
}

# Handle command line arguments
case "${1:-}" in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac
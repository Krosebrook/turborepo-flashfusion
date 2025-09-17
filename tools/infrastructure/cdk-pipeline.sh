#!/bin/bash

# Infrastructure Pipeline Agent - CDK Operations
# Usage: ./cdk-pipeline.sh [plan|apply|validate|drift]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_AGENT="$SCRIPT_DIR/pipeline-agent.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if CDK is available
check_cdk() {
    if ! command -v cdk &> /dev/null; then
        log_warning "CDK not found. Install with: npm install -g aws-cdk"
        return 1
    fi
    
    log_info "CDK version: $(cdk version)"
    return 0
}

# Main execution
main() {
    local operation="${1:-plan}"
    
    log_info "Starting CDK pipeline operation: $operation"
    
    case "$operation" in
        "validate")
            log_info "Running CDK syntax validation..."
            node "$PIPELINE_AGENT" validate
            ;;
        "plan"|"diff")
            log_info "Running CDK diff (plan)..."
            if check_cdk; then
                node "$PIPELINE_AGENT" plan --tool cdk
            else
                log_error "Cannot run plan without CDK installed"
                exit 1
            fi
            ;;
        "apply"|"deploy")
            log_info "Running CDK deploy..."
            if check_cdk; then
                # Confirmation prompt for deploy
                read -p "Are you sure you want to deploy CDK stacks? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    node "$PIPELINE_AGENT" apply --tool cdk
                else
                    log_info "Deploy cancelled by user"
                    exit 0
                fi
            else
                log_error "Cannot run deploy without CDK installed"
                exit 1
            fi
            ;;
        "drift")
            log_info "Checking for CDK drift..."
            if check_cdk; then
                node "$PIPELINE_AGENT" drift --tool cdk
            else
                log_error "Cannot check drift without CDK installed"
                exit 1
            fi
            ;;
        "status")
            log_info "Showing pipeline status..."
            node "$PIPELINE_AGENT" status
            ;;
        "help"|"--help"|"-h")
            echo "CDK Pipeline Operations"
            echo ""
            echo "Usage: $0 [operation]"
            echo ""
            echo "Operations:"
            echo "  validate       Validate CDK syntax and configuration"
            echo "  plan|diff      Run cdk diff to show changes"
            echo "  apply|deploy   Deploy CDK stacks (with confirmation)"
            echo "  drift          Detect infrastructure drift"
            echo "  status         Show pipeline status and logs"
            echo "  help           Show this help message"
            echo ""
            ;;
        *)
            log_error "Unknown operation: $operation"
            echo "Use '$0 help' for available operations"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
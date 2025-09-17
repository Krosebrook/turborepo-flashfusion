#!/bin/bash

# Infrastructure Pipeline Agent - Terraform Operations
# Usage: ./terraform-pipeline.sh [plan|apply|validate|drift]

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

# Check if terraform is available
check_terraform() {
    if ! command -v terraform &> /dev/null; then
        log_warning "Terraform not found. Install from: https://www.terraform.io/downloads"
        return 1
    fi
    
    log_info "Terraform version: $(terraform version -json | jq -r '.terraform_version' 2>/dev/null || terraform version | head -n1)"
    return 0
}

# Main execution
main() {
    local operation="${1:-plan}"
    
    log_info "Starting Terraform pipeline operation: $operation"
    
    case "$operation" in
        "validate")
            log_info "Running Terraform syntax validation..."
            node "$PIPELINE_AGENT" validate
            ;;
        "plan")
            log_info "Running Terraform plan..."
            if check_terraform; then
                node "$PIPELINE_AGENT" plan --tool terraform
            else
                log_error "Cannot run plan without Terraform installed"
                exit 1
            fi
            ;;
        "apply")
            log_info "Running Terraform apply..."
            if check_terraform; then
                # Confirmation prompt for apply
                read -p "Are you sure you want to apply Terraform changes? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    node "$PIPELINE_AGENT" apply --tool terraform
                else
                    log_info "Apply cancelled by user"
                    exit 0
                fi
            else
                log_error "Cannot run apply without Terraform installed"
                exit 1
            fi
            ;;
        "drift")
            log_info "Checking for Terraform drift..."
            if check_terraform; then
                node "$PIPELINE_AGENT" drift --tool terraform
            else
                log_error "Cannot check drift without Terraform installed"
                exit 1
            fi
            ;;
        "status")
            log_info "Showing pipeline status..."
            node "$PIPELINE_AGENT" status
            ;;
        "help"|"--help"|"-h")
            echo "Terraform Pipeline Operations"
            echo ""
            echo "Usage: $0 [operation]"
            echo ""
            echo "Operations:"
            echo "  validate    Validate Terraform syntax and configuration"
            echo "  plan        Run terraform plan to show changes"
            echo "  apply       Apply terraform changes (with confirmation)"
            echo "  drift       Detect infrastructure drift"
            echo "  status      Show pipeline status and logs"
            echo "  help        Show this help message"
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
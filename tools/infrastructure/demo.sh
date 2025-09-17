#!/bin/bash

# Infrastructure Pipeline Agent Demo Script
# This script demonstrates the capabilities of the Infrastructure Pipeline Agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}🚀 FlashFusion Infrastructure Pipeline Agent Demo${NC}\n"

echo -e "${YELLOW}This demo shows the Infrastructure Pipeline Agent capabilities:${NC}"
echo -e "  • Syntax validation for Terraform and CDK"
echo -e "  • Policy enforcement and compliance checking"
echo -e "  • Plan mode to preview changes"
echo -e "  • Apply mode to deploy infrastructure"
echo -e "  • Drift detection to monitor infrastructure state"
echo -e "  • Comprehensive logging and status tracking\n"

echo -e "${BOLD}📋 Demo Steps:${NC}\n"

# Step 1: Show current infrastructure templates
echo -e "${BLUE}1. Viewing Infrastructure Templates${NC}"
echo -e "   Terraform template: templates/infrastructure/terraform/main.tf"
echo -e "   CDK template: templates/infrastructure/cdk/lib/flashfusion-stack.js"
echo -e "   Policy rules: templates/infrastructure/terraform/policies.yaml\n"

# Step 2: Validate syntax
echo -e "${BLUE}2. Running Syntax Validation${NC}"
echo -e "   Command: ${YELLOW}npm run infra:validate${NC}"
echo -e "   This validates Terraform/CDK syntax and policy compliance...\n"

npm run infra:validate 2>&1 || echo -e "${YELLOW}   Note: Terraform/CDK tools not installed - this is expected in demo environment${NC}\n"

# Step 3: Show status
echo -e "${BLUE}3. Checking Pipeline Status${NC}"
echo -e "   Command: ${YELLOW}npm run infra:status${NC}"
echo -e "   This shows the current pipeline state and operation history...\n"

npm run infra:status

echo ""

# Step 4: Show wrapper scripts
echo -e "${BLUE}4. Tool-Specific Wrapper Scripts${NC}"
echo -e "   Terraform wrapper: ${YELLOW}./tools/infrastructure/terraform-pipeline.sh help${NC}"
./tools/infrastructure/terraform-pipeline.sh help

echo ""
echo -e "   CDK wrapper: ${YELLOW}./tools/infrastructure/cdk-pipeline.sh help${NC}"
./tools/infrastructure/cdk-pipeline.sh help

echo ""

# Step 5: Show log files
echo -e "${BLUE}5. Pipeline Logs and State${NC}"
if [ -f "tools/infrastructure/pipeline.log" ]; then
    echo -e "   Recent log entries:"
    echo -e "${YELLOW}$(tail -5 tools/infrastructure/pipeline.log)${NC}"
else
    echo -e "   No log file found yet"
fi

echo ""

if [ -f "tools/infrastructure/pipeline-state.json" ]; then
    echo -e "   Current pipeline state:"
    echo -e "${YELLOW}$(cat tools/infrastructure/pipeline-state.json | head -10)${NC}"
else
    echo -e "   No state file found yet"
fi

echo ""

# Step 6: Show available commands
echo -e "${BLUE}6. Available Pipeline Commands${NC}"
echo -e "   Infrastructure operations:"
echo -e "     ${YELLOW}npm run infra:validate${NC}  - Validate syntax and policies"
echo -e "     ${YELLOW}npm run infra:plan${NC}      - Preview infrastructure changes"
echo -e "     ${YELLOW}npm run infra:apply${NC}     - Apply infrastructure changes"
echo -e "     ${YELLOW}npm run infra:drift${NC}     - Detect configuration drift"
echo -e "     ${YELLOW}npm run infra:status${NC}    - Show pipeline status and logs"

echo ""
echo -e "   Tool-specific operations:"
echo -e "     ${YELLOW}npm run infra:terraform${NC} [validate|plan|apply|drift|status]"
echo -e "     ${YELLOW}npm run infra:cdk${NC}       [validate|plan|apply|drift|status]"

echo ""

# Step 7: Show CI/CD integration example
echo -e "${BLUE}7. CI/CD Integration Example${NC}"
echo -e "   For GitHub Actions workflow:"
echo -e "${YELLOW}   - name: Validate Infrastructure"
echo -e "     run: npm run infra:validate"
echo -e "   - name: Plan Infrastructure Changes"
echo -e "     run: npm run infra:plan"
echo -e "   - name: Apply Infrastructure"
echo -e "     run: npm run infra:apply"
echo -e "     if: github.ref == 'refs/heads/main'${NC}"

echo ""

echo -e "${BOLD}${GREEN}✅ Demo Complete!${NC}"
echo -e "${GREEN}The Infrastructure Pipeline Agent is ready to manage your infrastructure.${NC}"
echo -e "${GREEN}See tools/infrastructure/README.md for detailed documentation.${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Install Terraform and/or AWS CDK"
echo -e "  2. Configure AWS credentials"
echo -e "  3. Run ${YELLOW}npm run infra:plan${NC} to preview changes"
echo -e "  4. Run ${YELLOW}npm run infra:apply${NC} to deploy infrastructure"
echo -e "  5. Set up regular drift detection in your CI/CD pipeline\n"
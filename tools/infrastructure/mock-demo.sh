#!/bin/bash

# Mock Infrastructure Demo - Shows pipeline agent functionality when tools aren't installed
# This creates mock terraform and cdk commands to demonstrate the pipeline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}🧪 Infrastructure Pipeline Agent - Mock Demo${NC}\n"
echo -e "${YELLOW}This demo creates mock terraform/cdk commands to showcase pipeline functionality${NC}\n"

# Create temporary bin directory for mock commands
MOCK_BIN_DIR="/tmp/mock-infra-tools"
mkdir -p "$MOCK_BIN_DIR"

# Create mock terraform command
cat > "$MOCK_BIN_DIR/terraform" << 'EOF'
#!/bin/bash
case "$1" in
    "version")
        echo "Terraform v1.6.0"
        ;;
    "init")
        echo "Initializing Terraform..."
        echo "Terraform has been successfully initialized!"
        ;;
    "validate")
        echo '{"valid": true, "error_count": 0, "warning_count": 0}'
        ;;
    "plan")
        echo "Refreshing state..."
        echo ""
        echo "Terraform will perform the following actions:"
        echo ""
        echo "  # aws_vpc.main will be created"
        echo "  + resource \"aws_vpc\" \"main\" {"
        echo "      + cidr_block         = \"10.0.0.0/16\""
        echo "      + enable_dns_support = true"
        echo "      + id                 = (known after apply)"
        echo "    }"
        echo ""
        echo "Plan: 1 to add, 0 to change, 0 to destroy."
        exit 2  # Exit code 2 means plan has changes
        ;;
    "apply")
        echo "Applying Terraform configuration..."
        echo "aws_vpc.main: Creating..."
        echo "aws_vpc.main: Creation complete after 2s [id=vpc-12345]"
        echo ""
        echo "Apply complete! Resources: 1 added, 0 changed, 0 destroyed."
        ;;
    *)
        echo "Mock terraform command - received: $*"
        ;;
esac
EOF

# Create mock cdk command
cat > "$MOCK_BIN_DIR/cdk" << 'EOF'
#!/bin/bash
case "$1" in
    "version")
        echo "2.100.0 (build f0adea)"
        ;;
    "synth")
        echo "Successfully synthesized to cdk.out"
        echo "Supply a stack id to display its template."
        ;;
    "diff")
        if [ "$2" != "--quiet" ]; then
            echo "Stack FlashFusion-dev"
            echo "Resources"
            echo "[+] AWS::EC2::VPC FlashFusionVPC"
            echo "[+] AWS::EC2::SecurityGroup WebSecurityGroup"
            echo "[+] AWS::S3::Bucket AssetsBucket"
        fi
        ;;
    "deploy")
        echo "✨  Synthesis time: 2.34s"
        echo ""
        echo "FlashFusion-dev: deploying..."
        echo "FlashFusion-dev: creating CloudFormation changeset..."
        echo "✅  FlashFusion-dev"
        echo ""
        echo "✨  Deployment time: 45.67s"
        ;;
    *)
        echo "Mock cdk command - received: $*"
        ;;
esac
EOF

# Make mock commands executable
chmod +x "$MOCK_BIN_DIR/terraform" "$MOCK_BIN_DIR/cdk"

# Add mock bin to PATH
export PATH="$MOCK_BIN_DIR:$PATH"

echo -e "${GREEN}✅ Mock tools installed and ready${NC}"
echo -e "${BLUE}📍 Mock terraform: $(which terraform)${NC}"
echo -e "${BLUE}📍 Mock cdk: $(which cdk)${NC}\n"

# Now run the pipeline demonstrations
echo -e "${BOLD}🚀 Running Infrastructure Pipeline Operations${NC}\n"

# Test validation
echo -e "${BLUE}1. Testing Infrastructure Validation${NC}"
npm run infra:validate
echo ""

# Test plan
echo -e "${BLUE}2. Testing Infrastructure Plan (Terraform)${NC}"
npm run infra:plan
echo ""

# Test CDK plan
echo -e "${BLUE}3. Testing Infrastructure Plan (CDK)${NC}"
node tools/infrastructure/pipeline-agent.js plan --tool cdk
echo ""

# Test drift detection
echo -e "${BLUE}4. Testing Drift Detection${NC}"
npm run infra:drift
echo ""

# Show final status
echo -e "${BLUE}5. Final Pipeline Status${NC}"
npm run infra:status
echo ""

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up mock tools...${NC}"
rm -rf "$MOCK_BIN_DIR"

echo -e "${BOLD}${GREEN}✅ Mock Demo Complete!${NC}"
echo -e "${GREEN}The Infrastructure Pipeline Agent successfully demonstrated:${NC}"
echo -e "  • ✅ Syntax validation for both Terraform and CDK"
echo -e "  • ✅ Plan generation with change detection"
echo -e "  • ✅ Drift detection capabilities"
echo -e "  • ✅ Comprehensive logging and state tracking"
echo -e "  • ✅ Multi-tool support and error handling\n"

echo -e "${YELLOW}In a real environment with Terraform/CDK installed, the agent would:${NC}"
echo -e "  • Validate actual infrastructure configurations"
echo -e "  • Generate real deployment plans"
echo -e "  • Apply infrastructure changes safely"
echo -e "  • Detect actual configuration drift"
echo -e "  • Enforce security and compliance policies\n"
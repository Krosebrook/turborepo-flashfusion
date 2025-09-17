# Infrastructure Pipeline Agent

FlashFusion Infrastructure Pipeline Agent for running Infrastructure as Code (IaC) tools with validation, policy checking, and drift detection.

## 🚀 Features

- **Multi-tool Support**: Works with both Terraform and AWS CDK
- **Syntax Validation**: Validates IaC syntax before execution
- **Policy Enforcement**: Validates against security and compliance policies
- **Plan Mode**: Preview changes before applying
- **Apply Mode**: Deploy infrastructure changes
- **Drift Detection**: Detect configuration drift in deployed infrastructure
- **Logging**: Comprehensive logging of all operations
- **Status Tracking**: Track pipeline state and operation history

## 📋 Quick Start

### Prerequisites

For Terraform operations:
```bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

For CDK operations:
```bash
# Install AWS CDK
npm install -g aws-cdk

# Configure AWS credentials
aws configure
```

### Usage Examples

#### Basic Operations

```bash
# Validate infrastructure syntax and policies
npm run infra:validate

# Plan infrastructure changes
npm run infra:plan

# Apply infrastructure changes
npm run infra:apply

# Check for infrastructure drift
npm run infra:drift

# Show pipeline status and logs
npm run infra:status
```

#### Tool-Specific Operations

**Terraform:**
```bash
# Run Terraform operations
npm run infra:terraform plan
npm run infra:terraform apply
npm run infra:terraform validate
npm run infra:terraform drift

# Or use the script directly
./tools/infrastructure/terraform-pipeline.sh plan
```

**AWS CDK:**
```bash
# Run CDK operations
npm run infra:cdk plan    # Same as cdk diff
npm run infra:cdk apply   # Same as cdk deploy
npm run infra:cdk validate
npm run infra:cdk drift

# Or use the script directly
./tools/infrastructure/cdk-pipeline.sh diff
```

#### Advanced Usage

```bash
# Plan with specific tool
node tools/infrastructure/pipeline-agent.js plan --tool terraform
node tools/infrastructure/pipeline-agent.js plan --tool cdk

# Apply with specific tool
node tools/infrastructure/pipeline-agent.js apply --tool terraform
node tools/infrastructure/pipeline-agent.js apply --tool cdk

# Check drift for specific tool
node tools/infrastructure/pipeline-agent.js drift --tool terraform
node tools/infrastructure/pipeline-agent.js drift --tool cdk
node tools/infrastructure/pipeline-agent.js drift --tool both
```

## 📁 Directory Structure

```
tools/infrastructure/
├── pipeline-agent.js          # Main pipeline agent
├── terraform-pipeline.sh      # Terraform wrapper script
├── cdk-pipeline.sh            # CDK wrapper script
├── package.json               # Node.js dependencies
├── pipeline.log               # Operation logs
└── pipeline-state.json        # Pipeline state tracking

templates/infrastructure/
├── terraform/                 # Terraform templates
│   ├── main.tf               # Main Terraform configuration
│   └── policies.yaml         # Policy validation rules
└── cdk/                      # CDK templates
    ├── app.js                # CDK app entry point
    ├── lib/                  # CDK constructs
    ├── package.json          # CDK dependencies
    └── cdk.json              # CDK configuration
```

## 🔧 Configuration

### Policy Validation

Infrastructure policies are defined in `templates/infrastructure/terraform/policies.yaml`:

```yaml
policies:
  security:
    - name: "require-encryption-at-rest"
      description: "All data stores must have encryption at rest enabled"
      
  compliance:
    - name: "required-tags"
      description: "All resources must have required tags"
      required_tags: ["Project", "Environment", "ManagedBy"]
      
  cost:
    - name: "instance-size-limits"
      description: "Limit instance sizes to control costs"
```

### Environment Variables

```bash
# AWS Configuration (for both Terraform and CDK)
export AWS_REGION=us-west-2
export AWS_PROFILE=default

# Terraform specific
export TF_VAR_environment=dev
export TF_VAR_project_name=flashfusion

# CDK specific
export CDK_DEFAULT_REGION=us-west-2
export CDK_DEFAULT_ACCOUNT=123456789012
```

## 📊 Pipeline Operations

### Validation

The validation process includes:
1. **Syntax Validation**: Checks IaC syntax (terraform validate, cdk synth)
2. **Policy Validation**: Validates against defined security and compliance policies
3. **Configuration Validation**: Ensures required configurations are present

### Plan Mode

Plan mode shows what changes would be made without actually applying them:
- **Terraform**: Runs `terraform plan` with detailed exit codes
- **CDK**: Runs `cdk diff` to show differences

### Apply Mode

Apply mode deploys the infrastructure changes:
- **Terraform**: Runs `terraform apply` with the generated plan
- **CDK**: Runs `cdk deploy` for all stacks
- Includes confirmation prompts for safety

### Drift Detection

Detects when deployed infrastructure differs from code:
- **Terraform**: Compares current state with configuration
- **CDK**: Uses CDK diff to detect changes
- Reports drift details and affected resources

## 📈 Monitoring and Logging

### Log Files

- **pipeline.log**: Contains all pipeline operations and their results
- **pipeline-state.json**: Tracks the current state of pipeline operations

### Status Checking

```bash
# View current pipeline status
npm run infra:status

# View detailed logs
cat tools/infrastructure/pipeline.log

# Check last operation state
cat tools/infrastructure/pipeline-state.json
```

## 🛡️ Security and Best Practices

### Security Features

1. **Policy Enforcement**: Validates against security policies before deployment
2. **Confirmation Prompts**: Requires confirmation for destructive operations
3. **State Tracking**: Maintains audit trail of all operations
4. **Access Control**: Uses existing AWS/cloud provider authentication

### Best Practices

1. **Always Validate First**: Run validation before planning or applying
2. **Review Plans**: Always review plan output before applying
3. **Use Version Control**: Keep all IaC code in version control
4. **Regular Drift Checks**: Schedule regular drift detection
5. **Policy Updates**: Keep security policies updated

## 🔄 Integration with CI/CD

The pipeline agent can be integrated into CI/CD workflows:

```yaml
# Example GitHub Actions workflow
- name: Validate Infrastructure
  run: npm run infra:validate

- name: Plan Infrastructure
  run: npm run infra:plan

- name: Apply Infrastructure
  run: npm run infra:apply
  if: github.ref == 'refs/heads/main'
```

## 🤝 Contributing

1. Add new policy rules to `policies.yaml`
2. Extend the pipeline agent for additional IaC tools
3. Improve error handling and logging
4. Add more comprehensive validation rules

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Infrastructure as Code Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)
- [Policy as Code with OPA](https://www.openpolicyagent.org/)
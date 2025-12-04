#!/usr/bin/env node

/**
 * GitHub Actions Agent Demo Script
 * Demonstrates how to use the GitHub Actions agent for CI/CD error resolution
 */

const path = require('path');

// Mock the DigitalProductOrchestrator for demo purposes
class MockDigitalProductOrchestrator {
    buildFlashFusionAgentPrompt(agent, request, context) {
        const baseContext = `
Project: ${request.projectId}
Request: ${request.description}
Current Phase: ${context.project?.phase || 'discovery'}
Previous Context: ${JSON.stringify(context.project || {}, null, 2)}
`;

        // For demo, we'll just return a simplified version
        if (agent.role === 'github_actions_agent') {
            return `${baseContext}

ROLE: You are a Senior DevOps Engineer specializing in GitHub Actions CI/CD pipeline debugging and auto-remediation for FlashFusion.

OBJECTIVE: Analyze CI/CD pipeline failures, categorize root causes, and provide actionable remediation steps with automated fixes where possible.

[Full GitHub Actions agent prompt would be here...]`;
        }
        
        return `You are a ${agent.role.replace('_', ' ')} for FlashFusion. Handle this request: ${request.description}`;
    }
}

// Demo scenarios
const scenarios = [
    {
        name: "Test Failure Scenario",
        agent: { role: 'github_actions_agent' },
        request: {
            projectId: 'flashfusion-web',
            description: 'Tests are failing intermittently in CI pipeline. Some tests pass locally but fail in GitHub Actions environment.'
        },
        context: {
            project: {
                phase: 'testing',
                framework: 'Node.js',
                lastBuildStatus: 'failed',
                environment: 'ci',
                errorPattern: 'timeout_errors'
            }
        }
    },
    {
        name: "Dependency Installation Failure",
        agent: { role: 'github_actions_agent' },
        request: {
            projectId: 'flashfusion-api',
            description: 'npm install failing with lock file conflicts and dependency resolution errors'
        },
        context: {
            project: {
                phase: 'build',
                framework: 'Node.js',
                lastBuildStatus: 'failed',
                environment: 'ci',
                errorPattern: 'dependency_conflicts'
            }
        }
    },
    {
        name: "Environment Variable Missing",
        agent: { role: 'github_actions_agent' },
        request: {
            projectId: 'flashfusion-deployment',
            description: 'Deployment failing due to missing required environment variables'
        },
        context: {
            project: {
                phase: 'deployment',
                framework: 'Next.js',
                lastBuildStatus: 'failed',
                environment: 'staging',
                errorPattern: 'missing_env_vars'
            }
        }
    }
];

function runDemo() {
    console.log('🚀 GitHub Actions Agent Demo\n');
    console.log('This demo shows how the GitHub Actions agent would be invoked for different CI/CD failure scenarios.\n');
    
    const orchestrator = new MockDigitalProductOrchestrator();
    
    scenarios.forEach((scenario, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 Scenario ${index + 1}: ${scenario.name}`);
        console.log(`${'='.repeat(60)}`);
        
        console.log('\n🔧 Agent Request:');
        console.log(`Role: ${scenario.agent.role}`);
        console.log(`Project: ${scenario.request.projectId}`);
        console.log(`Description: ${scenario.request.description}`);
        
        console.log('\n📊 Context:');
        console.log(JSON.stringify(scenario.context, null, 2));
        
        console.log('\n🤖 Generated Prompt Preview:');
        const prompt = orchestrator.buildFlashFusionAgentPrompt(
            scenario.agent,
            scenario.request,
            scenario.context
        );
        
        // Show first 300 characters of the prompt
        console.log(prompt.substring(0, 300) + '...\n[Full prompt would continue with specific error handling patterns]');
        
        console.log('\n💡 Expected Agent Response Categories:');
        switch (scenario.context.project.errorPattern) {
            case 'timeout_errors':
                console.log('- Priority 1 (Auto-Fix): Flaky test detection with retry patterns');
                console.log('- Confidence: High - Common issue with established solutions');
                break;
            case 'dependency_conflicts':
                console.log('- Priority 2 (Guided Fix): Lock file corruption recovery');
                console.log('- Confidence: Medium - Requires validation of dependency versions');
                break;
            case 'missing_env_vars':
                console.log('- Priority 2 (Guided Fix): Environment variable template generation');
                console.log('- Confidence: High - Straightforward configuration issue');
                break;
        }
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Demo Complete');
    console.log(`${'='.repeat(60)}`);
    console.log('\nTo use the GitHub Actions agent in production:');
    console.log('1. Initialize DigitalProductOrchestrator');
    console.log('2. Create agent with role "github_actions_agent"');
    console.log('3. Provide request with error details');
    console.log('4. Include context about project and environment');
    console.log('5. Send generated prompt to AI service');
    console.log('6. Apply recommended fixes with rollback procedures');
    
    console.log('\n📚 Documentation: docs/github-actions-agent.md');
    console.log('🔧 Example Workflow: .github/workflows/ci-cd.yml');
}

// Run the demo
runDemo();
#!/usr/bin/env node

/**
 * Simple test script to verify GitHub Actions Agent prompt content
 */

const fs = require('fs');
const path = require('path');

function testGitHubActionsPromptContent() {
    console.log('🧪 Testing GitHub Actions Agent prompt content...');
    
    const packagesFilePath = path.join(__dirname, 'packages/ai-agents/orchestration/core/DigitalProductOrchestrator.js');
    const webFilePath = path.join(__dirname, 'apps/web/src/orchestration/core/DigitalProductOrchestrator.js');
    
    try {
        // Read both files
        const packagesContent = fs.readFileSync(packagesFilePath, 'utf8');
        const webContent = fs.readFileSync(webFilePath, 'utf8');
        
        // Required elements for GitHub Actions agent prompt
        const requiredElements = [
            'github_actions_agent:',
            'Senior DevOps Engineer',
            'GitHub Actions CI/CD pipeline debugging',
            'ERROR CATEGORIZATION & RESPONSE MATRIX',
            'Priority 1 (Auto-Fix)',
            'Priority 2 (Guided Fix)',
            'Priority 3 (Human Required)',
            'Failed Tests:',
            'Build Errors:',
            'Linting/Formatting:',
            'Missing Environment Variables:',
            'Permission Issues:',
            'Dependency Installation:',
            'Script Failures:',
            'DIAGNOSTIC WORKFLOW',
            'Context Gathering:',
            'Error Pattern Matching:',
            'Solution Generation:',
            'SECURITY & SAFETY GUARDRAILS',
            'Never Auto-Fix:',
            'Always Validate:',
            'Escalation Triggers:',
            'OUTPUT FORMAT',
            'Critical Fix Required',
            'Quick Fix (Copy-Paste Ready)',
            'Workflow File Updates',
            'ROOT CAUSE ANALYSIS',
            'VALIDATION CHECKLIST',
            'ROLLBACK PLAN',
            'Test Failure Handler:',
            'Dependency Resolution:',
            'Environment Variable Validation:',
            'TARGET: Produce immediate fixes for 80% of common CI/CD failures',
            'STOPS:'
        ];
        
        let packagesTestPassed = true;
        let webTestPassed = true;
        
        // Test packages version
        const missingPackagesElements = requiredElements.filter(element => !packagesContent.includes(element));
        if (missingPackagesElements.length > 0) {
            console.log('❌ Packages version missing elements:', missingPackagesElements);
            packagesTestPassed = false;
        } else {
            console.log('✅ Packages version: All required elements found');
        }
        
        // Test web version  
        const missingWebElements = requiredElements.filter(element => !webContent.includes(element));
        if (missingWebElements.length > 0) {
            console.log('❌ Web version missing elements:', missingWebElements);
            webTestPassed = false;
        } else {
            console.log('✅ Web version: All required elements found');
        }
        
        // Verify both files have identical github_actions_agent prompts
        const packagesPromptMatch = packagesContent.match(/github_actions_agent: `[\s\S]*?TARGET: Produce immediate fixes for 80% of common CI\/CD failures[\s\S]*?STOPS:[\s\S]*?`/);
        const webPromptMatch = webContent.match(/github_actions_agent: `[\s\S]*?TARGET: Produce immediate fixes for 80% of common CI\/CD failures[\s\S]*?STOPS:[\s\S]*?`/);
        
        if (packagesPromptMatch && webPromptMatch) {
            if (packagesPromptMatch[0] === webPromptMatch[0]) {
                console.log('✅ Both versions have identical GitHub Actions agent prompts');
            } else {
                console.log('❌ GitHub Actions agent prompts differ between packages and web versions');
                return false;
            }
        } else {
            console.log('❌ Could not extract GitHub Actions agent prompt from one or both files');
            return false;
        }
        
        return packagesTestPassed && webTestPassed;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

function testPromptStructure() {
    console.log('🧪 Testing prompt structure and formatting...');
    
    const webFilePath = path.join(__dirname, 'apps/web/src/orchestration/core/DigitalProductOrchestrator.js');
    
    try {
        const content = fs.readFileSync(webFilePath, 'utf8');
        
        // Test that the prompt has proper structure
        const structuralChecks = [
            { name: 'Has ROLE section', test: /ROLE: You are a Senior DevOps Engineer/},
            { name: 'Has OBJECTIVE section', test: /OBJECTIVE: Analyze CI\/CD pipeline failures/},
            { name: 'Has priority levels', test: /Priority [123] \(/},
            { name: 'Has example code blocks', test: /\\`\\`\\`yaml[\s\S]*?\\`\\`\\`/},
            { name: 'Has bash examples', test: /\\`\\`\\`bash[\s\S]*?\\`\\`\\`/},
            { name: 'Has proper formatting', test: /##.*Critical Fix Required/},
            { name: 'Has validation checklist', test: /- \[ \] Local reproduction confirmed/},
            { name: 'Has security guardrails', test: /Never Auto-Fix:.*Secrets or API keys/},
        ];
        
        let allChecksPassed = true;
        for (const check of structuralChecks) {
            if (check.test.test(content)) {
                console.log(`✅ ${check.name}`);
            } else {
                console.log(`❌ ${check.name}`);
                allChecksPassed = false;
            }
        }
        
        return allChecksPassed;
        
    } catch (error) {
        console.error('❌ Structure test failed:', error.message);
        return false;
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting GitHub Actions Agent Prompt Content Tests\n');
    
    const test1 = testGitHubActionsPromptContent();
    console.log('');
    const test2 = testPromptStructure();
    
    const allTestsPassed = test1 && test2;
    
    console.log('\n📊 Test Results:');
    console.log(`Content Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Structure Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (allTestsPassed) {
        console.log('\n🎉 All tests passed! GitHub Actions agent prompt is properly implemented.');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
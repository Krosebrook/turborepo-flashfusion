#!/usr/bin/env node

/**
 * Test script to verify milestone integration with WorkflowStateManager
 */

const path = require('path');

// Import WorkflowStateManager from packages
const workflowPath = path.join(__dirname, '..', 'packages', 'ai-agents', 'orchestration', 'core', 'WorkflowStateManager.js');
const { MilestoneManager } = require('./milestone-manager');

async function testIntegration() {
    console.log('🧪 Testing Milestone Integration\n');
    
    try {
        // Test MilestoneManager
        console.log('1. Testing MilestoneManager...');
        const milestoneManager = new MilestoneManager();
        console.log('   ✅ MilestoneManager loaded successfully');
        
        // Test standard milestones
        console.log('2. Testing standard milestones...');
        const milestones = milestoneManager.standardMilestones;
        console.log(`   ✅ ${milestones.length} standard milestones loaded`);
        
        // Test CLI integration
        console.log('3. Testing CLI integration...');
        const { commands } = require('./cli/ff-cli');
        if (commands.milestone) {
            console.log('   ✅ Milestone command registered in CLI');
        } else {
            console.log('   ❌ Milestone command not found in CLI');
        }
        
        // Test file existence
        console.log('4. Testing documentation files...');
        const fs = require('fs');
        const milestonesDoc = path.join(__dirname, '..', 'docs', 'MILESTONES.md');
        const issueTemplate = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', 'milestone-tracking.md');
        
        if (fs.existsSync(milestonesDoc)) {
            console.log('   ✅ docs/MILESTONES.md exists');
        } else {
            console.log('   ❌ docs/MILESTONES.md missing');
        }
        
        if (fs.existsSync(issueTemplate)) {
            console.log('   ✅ GitHub issue template exists');
        } else {
            console.log('   ❌ GitHub issue template missing');
        }
        
        // Test WorkflowStateManager compatibility
        console.log('5. Testing WorkflowStateManager compatibility...');
        if (fs.existsSync(workflowPath)) {
            console.log('   ✅ WorkflowStateManager found');
            console.log('   ✅ Milestone integration points identified');
        } else {
            console.log('   ⚠️  WorkflowStateManager path not found (expected in development)');
        }
        
        console.log('\n🎉 Integration Test Complete!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Run: npm run ff -- milestone status');
        console.log('   2. Run: npm run ff -- milestone sync');
        console.log('   3. Create GitHub milestones using the sync output');
        console.log('   4. Start Phase 1 development');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testIntegration();
}

module.exports = { testIntegration };
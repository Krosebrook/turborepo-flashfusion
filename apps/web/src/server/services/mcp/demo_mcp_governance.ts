// server/services/mcp/demo_mcp_governance.ts
// Demonstration of Claude-MCP Governance in Action

import { MCPWrapper } from './MCPWrapper';
import { MCPEnhancedApiKeyService } from './MCPEnhancedApiKeyService';

/**
 * Interactive MCP Governance Demo
 * Shows how mutations are controlled, audited, and approved
 */
async function runMCPGovernanceDemo() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Claude-MCP Governance Demonstration                ║
║                                                              ║
║  This demo shows how file mutations are controlled through:  ║
║  • Pre-mutation checkpoints                                  ║
║  • Diff previews                                             ║
║  • Human approval workflows                                  ║
║  • Comprehensive audit trails                                ║
║  • Token usage tracking                                      ║
╚══════════════════════════════════════════════════════════════╝
  `);

    const mcp = MCPWrapper.getInstance();

    // Step 1: Show current MCP status
    console.log('\\n📊 Current MCP Status:');
    console.log(mcp.getStatus());

    // Step 2: Attempt to add a new API provider
    console.log(
        '\\n🔄 Step 1: Attempting to add Google Gemini as a new API provider...'
    );

    try {
        await MCPEnhancedApiKeyService.addProviderWithGovernance('gemini', {
            prefix: 'gm-',
            minLength: 25,
            maxLength: 100,
            name: 'Google Gemini'
        });
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Step 3: Show pending checkpoints
    const status = mcp.getStatus();
    console.log(`\\n⏸️  Pending Approvals: ${status.pendingApprovals}`);

    // Step 4: Simulate approval process
    console.log('\\n✅ Step 2: Simulating human approval process...');
    console.log('In a real scenario, this would require human intervention.');
    console.log('The human would review:');
    console.log('  - The diff preview');
    console.log('  - The security implications');
    console.log('  - The business logic changes');

    // Step 5: Show audit trail
    console.log('\\n📝 Step 3: Audit Trail Preview:');
    console.log('All actions are logged to: /mcp_audit/logbook.json');
    console.log('Including:');
    console.log('  - Timestamp of each action');
    console.log(
        `  - Token usage (current: ${
            status.tokenUsage
        }/${
            status.tokenLimit
        })`
    );
    console.log('  - Files affected');
    console.log('  - Rollback commands');

    // Step 6: Demonstrate rollback capability
    console.log('\\n↩️  Step 4: Rollback Capability:');
    console.log('If any mutation fails or is rejected:');
    console.log('  - Automatic rollback from backup');
    console.log('  - Audit log entry created');
    console.log('  - Original state restored');

    // Step 7: Token usage warning
    if (status.tokenUsage > 17000) {
        console.log('\\n⚠️  TOKEN WARNING: Approaching token limit!');
        console.log(`Current usage: ${status.tokenUsage}/${status.tokenLimit}`);
    }

    console.log(`\\n
╔══════════════════════════════════════════════════════════════╗
║                    Demo Complete                             ║
║                                                              ║
║  Next Steps:                                                 ║
║  1. Review /mcp_audit/logbook.json for full audit trail     ║
║  2. Check /mcp_sandbox/backups/ for file backups            ║
║  3. Use MCPWrapper.approveCheckpoint(id) to approve changes ║
║  4. Run integration tests to verify governance               ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

// Command-line interface for checkpoint approval
export async function approvePendingCheckpoint(checkpointId: string) {
    const mcp = MCPWrapper.getInstance();

    try {
        await mcp.approveCheckpoint(checkpointId, 'demo-user');
        console.log(`✅ Checkpoint ${checkpointId} approved!`);

        // Now execute the mutation
        await MCPEnhancedApiKeyService.executePendingMutation(checkpointId);
        console.log('✅ Mutation executed successfully!');
    } catch (error) {
        console.error('❌ Approval failed:', error.message);
    }
}

// Export for use
export { runMCPGovernanceDemo };

// Run if called directly
if (require.main === module) {
    runMCPGovernanceDemo().catch(console.error);
}
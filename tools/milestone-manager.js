#!/usr/bin/env node

/**
 * FlashFusion Milestone Management CLI
 * Integrates with GitHub milestones and local tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MilestoneManager {
    constructor() {
        this.milestonesFile = path.join(__dirname, '..', 'docs', 'MILESTONES.md');
        this.progressFile = path.join(__dirname, '..', 'docs', 'PROGRESS.md');
        this.standardMilestones = this.loadStandardMilestones();
    }

    loadStandardMilestones() {
        return [
            {
                id: 'phase1-core',
                title: 'Phase 1: Core Platform Setup',
                description: 'Complete core infrastructure and primary integrations',
                priority: 'HIGH',
                estimatedWeeks: 2,
                objectives: [
                    'Set up foundational monorepo structure',
                    'Integrate flashfusion-ide → apps/ide/',
                    'Extract agent orchestrator → packages/ai-agents/',
                    'Create essential packages: packages/ui/, packages/api-client/',
                    'Establish build and development workflows'
                ]
            },
            {
                id: 'phase2-development',
                title: 'Phase 2: Enhanced Development',
                description: 'Developer experience and tooling enhancements',
                priority: 'MEDIUM',
                estimatedWeeks: 2,
                objectives: [
                    'Enhanced CLI tools with generators',
                    'Comprehensive testing framework',
                    'Storybook integration for UI components',
                    'Development server utilities',
                    'Code generation templates'
                ]
            },
            {
                id: 'phase3-infrastructure',
                title: 'Phase 3: Production Infrastructure',
                description: 'Production readiness and deployment infrastructure',
                priority: 'LOW',
                estimatedWeeks: 2,
                objectives: [
                    'CI/CD pipeline implementation',
                    'Monitoring and observability',
                    'Security utilities',
                    'Deployment templates',
                    'Performance optimization'
                ]
            },
            {
                id: 'phase4-integration',
                title: 'Phase 4: Repository Integration',
                description: 'Complete ecosystem integration',
                priority: 'SPECIALIZED',
                estimatedWeeks: 3,
                objectives: [
                    'Memory systems integration',
                    'Research tools integration',
                    'Supporting applications integration',
                    'Template repositories integration',
                    'Reference documentation creation'
                ]
            },
            {
                id: 'phase5-quality',
                title: 'Phase 5: Quality & Optimization',
                description: 'Continuous improvement and quality assurance',
                priority: 'CONTINUOUS',
                estimatedWeeks: 'ongoing',
                objectives: [
                    'Code quality improvements',
                    'Performance optimization',
                    'Security enhancements',
                    'Documentation maintenance',
                    'Community features'
                ]
            }
        ];
    }

    displayStatus() {
        console.log('🎯 FlashFusion Milestone Status\n');
        
        this.standardMilestones.forEach((milestone, index) => {
            const priorityEmoji = this.getPriorityEmoji(milestone.priority);
            const statusEmoji = this.getStatusEmoji('planned'); // Default to planned for now
            
            console.log(`${statusEmoji} ${priorityEmoji} ${milestone.title}`);
            console.log(`   Description: ${milestone.description}`);
            console.log(`   Priority: ${milestone.priority} | Duration: ${milestone.estimatedWeeks} weeks`);
            console.log(`   Objectives: ${milestone.objectives.length} items`);
            console.log('');
        });

        this.displaySummary();
    }

    getPriorityEmoji(priority) {
        const emojis = {
            'HIGH': '🔴',
            'MEDIUM': '🟡', 
            'LOW': '🟢',
            'SPECIALIZED': '🔧',
            'CONTINUOUS': '⚡'
        };
        return emojis[priority] || '⚪';
    }

    getStatusEmoji(status) {
        const emojis = {
            'planned': '📋',
            'in-progress': '🔄',
            'review': '👀',
            'complete': '✅',
            'archived': '📦'
        };
        return emojis[status] || '❓';
    }

    displaySummary() {
        console.log('📊 Milestone Summary:');
        console.log(`   Total Milestones: ${this.standardMilestones.length}`);
        console.log(`   High Priority: ${this.standardMilestones.filter(m => m.priority === 'HIGH').length}`);
        console.log(`   Medium Priority: ${this.standardMilestones.filter(m => m.priority === 'MEDIUM').length}`);
        console.log(`   Specialized: ${this.standardMilestones.filter(m => m.priority === 'SPECIALIZED').length}`);
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Review Phase 1 objectives and start core platform setup');
        console.log('   2. Create GitHub milestones: npm run ff -- milestone sync');
        console.log('   3. Track progress: npm run ff -- milestone progress <phase-id>');
    }

    exportToGitHub() {
        console.log('🚀 GitHub Milestone Export Instructions:\n');
        
        console.log('To create these milestones on GitHub, use the GitHub CLI or web interface:\n');
        
        this.standardMilestones.forEach(milestone => {
            const dueDate = this.calculateDueDate(milestone.estimatedWeeks);
            console.log(`# Create milestone: ${milestone.title}`);
            console.log(`gh api repos/Krosebrook/turborepo-flashfusion/milestones \\`);
            console.log(`  --method POST \\`);
            console.log(`  --field title="${milestone.title}" \\`);
            console.log(`  --field description="${milestone.description}" \\`);
            console.log(`  --field state="open" \\`);
            if (dueDate) {
                console.log(`  --field due_on="${dueDate}"`);
            }
            console.log('');
        });

        console.log('📋 Alternative: Manual creation via GitHub web interface');
        console.log('   1. Go to: https://github.com/Krosebrook/turborepo-flashfusion/milestones');
        console.log('   2. Click "New milestone"');
        console.log('   3. Use the titles and descriptions from above');
    }

    calculateDueDate(weeks) {
        if (weeks === 'ongoing' || typeof weeks !== 'number') {
            return null;
        }
        
        const now = new Date();
        const dueDate = new Date(now.getTime() + (weeks * 7 * 24 * 60 * 60 * 1000));
        return dueDate.toISOString().split('T')[0];
    }

    createMilestoneTemplate(title, description = '') {
        const template = `
## ${title}

**Status**: Planned  
**Priority**: TBD  
**Estimated Duration**: TBD

### Objectives
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

### Success Criteria
- Criteria 1
- Criteria 2

### Related Issues
- Issue links will be added here

---
`;
        return template;
    }

    displayHelp() {
        console.log('🎯 FlashFusion Milestone Manager\n');
        console.log('Available commands:');
        console.log('  status     - Display current milestone status');
        console.log('  sync       - Export milestones for GitHub creation');
        console.log('  template   - Generate milestone template');
        console.log('  help       - Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  npm run ff -- milestone status');
        console.log('  npm run ff -- milestone sync');
        console.log('  npm run ff -- milestone template "Custom Milestone"');
    }
}

// CLI Interface
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const manager = new MilestoneManager();

    switch (command) {
        case 'status':
            manager.displayStatus();
            break;
        case 'sync':
            manager.exportToGitHub();
            break;
        case 'template':
            const title = args[1] || 'New Milestone';
            const description = args[2] || '';
            console.log(manager.createMilestoneTemplate(title, description));
            break;
        case 'help':
        default:
            manager.displayHelp();
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = { MilestoneManager };
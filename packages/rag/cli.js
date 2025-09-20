#!/usr/bin/env node

/**
 * RAG CLI Interface
 * Command line interface for the RAG system
 */

const RAGSystem = require('./src/index');
const path = require('path');
const fs = require('fs').promises;

// CLI Configuration
const CLI_VERSION = '1.0.0';

// Color utilities
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
    answer: (msg) => console.log(`${colors.green}${msg}${colors.reset}`)
};

class RAGCLI {
    constructor() {
        this.ragSystem = new RAGSystem();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return true;

        log.info('Initializing RAG System...');
        const success = await this.ragSystem.initialize();
        
        if (success) {
            this.isInitialized = true;
            log.success('RAG System initialized');
        } else {
            log.error('Failed to initialize RAG System');
        }

        return success;
    }

    async showHelp() {
        log.title(`\n🧠 FlashFusion RAG System v${CLI_VERSION}\n`);
        console.log('Available commands:');
        console.log('  build [path]           Build knowledge base from repository');
        console.log('  rebuild [path]         Force rebuild knowledge base');
        console.log('  query <question>       Ask a question about the repository');
        console.log('  search <code-query>    Search for specific code patterns');
        console.log('  docs <topic>           Get documentation for a topic');
        console.log('  overview              Get repository overview');
        console.log('  stats                 Show system statistics');
        console.log('  health                Show system health status');
        console.log('  clear                 Clear knowledge base');
        console.log('  help                  Show this help message');
        console.log('\nExamples:');
        console.log('  rag build');
        console.log('  rag query "How do I set up the development environment?"');
        console.log('  rag search "authentication functions"');
        console.log('  rag docs "API endpoints"');
        console.log('');
    }

    async buildKnowledgeBase(rootPath, forceRebuild = false) {
        if (!await this.initialize()) return false;

        const targetPath = rootPath || process.cwd();
        log.info(`Building knowledge base from: ${targetPath}`);

        try {
            const success = await this.ragSystem.buildKnowledgeBase(targetPath, forceRebuild);
            if (success) {
                log.success('Knowledge base built successfully');
                const stats = this.ragSystem.getStats();
                log.info(`Indexed ${stats.documentsIndexed} documents`);
            }
            return success;
        } catch (error) {
            log.error(`Failed to build knowledge base: ${error.message}`);
            return false;
        }
    }

    async queryRepository(question) {
        if (!await this.initialize()) return false;

        log.info(`Processing query: "${question}"`);

        try {
            const result = await this.ragSystem.query(question, { verbose: true });
            
            console.log('\n' + '='.repeat(80));
            log.title('ANSWER:');
            log.answer(result.answer);
            
            if (result.sources && result.sources.length > 0) {
                console.log('\n' + '-'.repeat(40));
                log.info(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                log.info(`Found ${result.retrievedDocsCount} relevant documents`);
            }
            console.log('='.repeat(80) + '\n');

            return true;
        } catch (error) {
            log.error(`Query failed: ${error.message}`);
            return false;
        }
    }

    async searchCode(codeQuery) {
        if (!await this.initialize()) return false;

        log.info(`Searching code for: "${codeQuery}"`);

        try {
            const result = await this.ragSystem.searchCode(codeQuery);
            
            console.log('\n' + '='.repeat(80));
            log.title('CODE SEARCH RESULTS:');
            log.answer(result.answer);
            console.log('='.repeat(80) + '\n');

            return true;
        } catch (error) {
            log.error(`Code search failed: ${error.message}`);
            return false;
        }
    }

    async getDocumentation(topic) {
        if (!await this.initialize()) return false;

        log.info(`Getting documentation for: "${topic}"`);

        try {
            const result = await this.ragSystem.getDocumentation(topic);
            
            console.log('\n' + '='.repeat(80));
            log.title('DOCUMENTATION:');
            log.answer(result.answer);
            console.log('='.repeat(80) + '\n');

            return true;
        } catch (error) {
            log.error(`Documentation search failed: ${error.message}`);
            return false;
        }
    }

    async getOverview() {
        if (!await this.initialize()) return false;

        log.info('Generating repository overview...');

        try {
            const results = await this.ragSystem.getRepositoryOverview();
            
            console.log('\n' + '='.repeat(80));
            log.title('REPOSITORY OVERVIEW:');
            
            results.forEach((result, index) => {
                console.log(`\n${colors.bright}${index + 1}. ${result.question}${colors.reset}`);
                console.log(`${colors.green}${result.answer}${colors.reset}`);
                console.log(`${colors.cyan}Confidence: ${(result.confidence * 100).toFixed(1)}%${colors.reset}`);
            });
            
            console.log('='.repeat(80) + '\n');

            return true;
        } catch (error) {
            log.error(`Overview generation failed: ${error.message}`);
            return false;
        }
    }

    async showStats() {
        if (!await this.initialize()) return false;

        const stats = this.ragSystem.getStats();
        
        console.log('\n' + '='.repeat(80));
        log.title('RAG SYSTEM STATISTICS:');
        console.log(`Status: ${stats.isInitialized ? colors.green + 'Initialized' : colors.red + 'Not Initialized'}${colors.reset}`);
        console.log(`Documents Indexed: ${colors.cyan}${stats.documentsIndexed}${colors.reset}`);
        console.log(`Vector Dimensions: ${colors.cyan}${stats.vectorDimensions}${colors.reset}`);
        console.log(`Memory Usage: ${colors.cyan}${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
        console.log(`Index Path: ${colors.cyan}${stats.indexPath}${colors.reset}`);
        console.log(`Embedding Model: ${colors.cyan}${stats.config.embeddingModel}${colors.reset}`);
        console.log(`Generation Model: ${colors.cyan}${stats.config.generationModel}${colors.reset}`);
        console.log(`Supported File Types: ${colors.cyan}${stats.config.supportedFileTypes}${colors.reset}`);
        console.log('='.repeat(80) + '\n');
    }

    async showHealth() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const health = await this.ragSystem.healthCheck();
        
        console.log('\n' + '='.repeat(80));
        log.title('RAG SYSTEM HEALTH:');
        console.log(`Overall Status: ${health.healthy ? colors.green + 'Healthy' : colors.red + 'Unhealthy'}${colors.reset}`);
        console.log(`System: ${health.system ? colors.green + 'OK' : colors.red + 'Error'}${colors.reset}`);
        console.log(`Retriever: ${health.retriever ? colors.green + 'OK' : colors.red + 'Error'}${colors.reset}`);
        console.log(`Generator: ${health.generator ? colors.green + 'OK' : colors.red + 'Error'}${colors.reset}`);
        console.log(`Index: ${health.index ? colors.green + 'Available' : colors.yellow + 'Not Found'}${colors.reset}`);
        console.log('='.repeat(80) + '\n');
    }

    async clearKnowledgeBase() {
        if (!await this.initialize()) return false;

        log.warn('Clearing knowledge base...');
        this.ragSystem.clearKnowledgeBase();
        log.success('Knowledge base cleared');
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            await this.showHelp();
            return;
        }

        const command = args[0].toLowerCase();
        
        switch (command) {
            case 'build':
                await this.buildKnowledgeBase(args[1], false);
                break;
            
            case 'rebuild':
                await this.buildKnowledgeBase(args[1], true);
                break;
            
            case 'query':
            case 'ask':
                if (args.length < 2) {
                    log.error('Please provide a question to query');
                    return;
                }
                await this.queryRepository(args.slice(1).join(' '));
                break;
            
            case 'search':
                if (args.length < 2) {
                    log.error('Please provide a code search query');
                    return;
                }
                await this.searchCode(args.slice(1).join(' '));
                break;
            
            case 'docs':
            case 'documentation':
                if (args.length < 2) {
                    log.error('Please provide a documentation topic');
                    return;
                }
                await this.getDocumentation(args.slice(1).join(' '));
                break;
            
            case 'overview':
                await this.getOverview();
                break;
            
            case 'stats':
            case 'statistics':
                await this.showStats();
                break;
            
            case 'health':
            case 'status':
                await this.showHealth();
                break;
            
            case 'clear':
                await this.clearKnowledgeBase();
                break;
            
            case 'help':
            case '-h':
            case '--help':
                await this.showHelp();
                break;
            
            default:
                log.error(`Unknown command: ${command}`);
                await this.showHelp();
        }
    }
}

// Export for module use
module.exports = RAGCLI;

// Run CLI if called directly
if (require.main === module) {
    const cli = new RAGCLI();
    cli.run().catch(error => {
        console.error(`${colors.red}✗${colors.reset} Fatal error:`, error.message);
        process.exit(1);
    });
}
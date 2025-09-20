#!/usr/bin/env node

/**
 * RAG System Demo
 * Demonstrates RAG functionality without requiring actual API keys
 */

const ContentIngestion = require('./src/ingest');

console.log('🧠 FlashFusion RAG System Demo\n');

async function demoContentIngestion() {
    console.log('📚 Step 1: Content Ingestion Demo');
    console.log('=' .repeat(50));
    
    const ingestion = new ContentIngestion();
    
    // Scan repository
    const files = await ingestion.scanRepository('.');
    
    console.log(`✅ Successfully scanned repository`);
    console.log(`📄 Found ${files.length} relevant files`);
    
    // Show file type breakdown
    const fileTypes = {};
    files.forEach(file => {
        const ext = file.split('.').pop();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    });
    
    console.log('\n📊 File Type Breakdown:');
    Object.entries(fileTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([ext, count]) => {
            console.log(`  ${ext.padEnd(6)}: ${count.toString().padStart(3)} files`);
        });
    
    // Process a sample file
    const readmeFile = files.find(f => f.endsWith('README.md'));
    if (readmeFile) {
        console.log(`\n📄 Processing sample file: ${readmeFile.split('/').pop()}`);
        
        const fileData = await ingestion.processFile(readmeFile);
        if (fileData) {
            const chunks = ingestion.chunkContent(fileData.content, fileData);
            console.log(`✅ Generated ${chunks.length} semantic chunks`);
            
            if (chunks.length > 0) {
                console.log(`\n📝 Sample chunk preview:`);
                console.log(`"${chunks[0].content.substring(0, 200)}..."`);
            }
        }
    }
}

function demoVectorSearch() {
    console.log('\n\n🔍 Step 2: Vector Search Demo');
    console.log('=' .repeat(50));
    
    console.log('With OpenAI API key, the system would:');
    console.log('✅ Generate embeddings for all 757 document chunks');
    console.log('✅ Store vectors in memory/disk for fast retrieval');
    console.log('✅ Support semantic similarity search');
    
    console.log('\n🎯 Example Query: "What does this repository do?"');
    console.log('📋 Would retrieve top relevant chunks:');
    console.log('  1. README.md (95% similarity) - Project overview');
    console.log('  2. package.json (87% similarity) - Project metadata');
    console.log('  3. AGENTS.md (82% similarity) - Architecture details');
}

function demoGeneration() {
    console.log('\n\n🤖 Step 3: Answer Generation Demo');
    console.log('=' .repeat(50));
    
    console.log('With retrieved context, GPT-4 would generate:');
    console.log('\n' + '='.repeat(80));
    console.log('ANSWER:');
    console.log(`
🚀 FlashFusion Turborepo is a comprehensive AI-powered business operating system 
built as a modern monorepo. Based on the repository structure and documentation:

**Main Purpose:**
- Unified platform for AI agent orchestration and workflow automation
- Multi-application architecture with web dashboard and API services
- Integration hub for various AI services (OpenAI, Anthropic, etc.)

**Key Technologies:**
- Turborepo for monorepo management
- Next.js 14 for the web dashboard
- Express.js for API services
- AI integrations (OpenAI, Anthropic, Gemini)
- Database support (Supabase, PostgreSQL)

**Architecture:**
- apps/web/ - Next.js dashboard application
- apps/api/ - Express orchestration service  
- packages/ai-agents/ - Core agent logic
- packages/shared/ - Common utilities
- tools/cli/ - FlashFusion CLI tools

The system enables semantic search and question-answering over repository 
content through the new RAG (Retrieval-Augmented Generation) system.
`);
    
    console.log('\n' + '-'.repeat(40));
    console.log('📊 Confidence: 94.2%');
    console.log('📁 Sources: README.md, AGENTS.md, package.json');
    console.log('=' .repeat(80));
}

function demoUsageExamples() {
    console.log('\n\n💡 Step 4: Usage Examples');
    console.log('=' .repeat(50));
    
    console.log('Once configured with API keys, you can:');
    console.log('');
    console.log('🔧 Build Knowledge Base:');
    console.log('  npm run ff rag:build');
    console.log('');
    console.log('❓ Ask Questions:');
    console.log('  npm run ff rag:query "How do I set up development environment?"');
    console.log('  npm run ff rag:search "authentication functions"');
    console.log('  npm run ff rag:docs "API endpoints"');
    console.log('');
    console.log('🌐 Use API Endpoints:');
    console.log('  POST /api/rag/query');
    console.log('  GET /api/rag/ask?q=What%20is%20this%20project');
    console.log('');
    console.log('📊 Monitor System:');
    console.log('  npm run ff rag:health');
    console.log('  npm run ff rag:stats');
}

async function runDemo() {
    try {
        await demoContentIngestion();
        demoVectorSearch();
        demoGeneration();
        demoUsageExamples();
        
        console.log('\n\n🎉 Demo Complete!');
        console.log('\n📝 To use the full RAG system:');
        console.log('1. Set OPENAI_API_KEY in your environment');
        console.log('2. Run: npm run ff rag:build');
        console.log('3. Start asking questions about your repository!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

// Run demo if called directly
if (require.main === module) {
    runDemo();
}

module.exports = runDemo;
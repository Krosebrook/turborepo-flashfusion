/**
 * RAG System Tests
 * Basic tests for the RAG system components
 */

const RAGSystem = require('../src/index');
const ContentIngestion = require('../src/ingest');
const config = require('../src/config');
const path = require('path');

async function testContentIngestion() {
    console.log('🧪 Testing Content Ingestion...');
    
    const ingestion = new ContentIngestion();
    
    // Test repository scanning
    const testPath = path.join(__dirname, '../../..');
    const files = await ingestion.scanRepository(testPath);
    
    console.log(`✅ Found ${files.length} files`);
    console.log('Sample files:');
    files.slice(0, 5).forEach(file => {
        console.log(`  - ${path.relative(testPath, file)}`);
    });
    
    // Test processing a single file
    if (files.length > 0) {
        const sampleFile = files.find(f => f.endsWith('README.md')) || files[0];
        console.log(`\n📄 Processing sample file: ${path.relative(testPath, sampleFile)}`);
        
        const fileData = await ingestion.processFile(sampleFile);
        if (fileData) {
            const chunks = ingestion.chunkContent(fileData.content, fileData);
            console.log(`✅ Generated ${chunks.length} chunks`);
            
            if (chunks.length > 0) {
                console.log(`Sample chunk (${chunks[0].content.length} chars):`);
                console.log(`"${chunks[0].content.substring(0, 100)}..."`);
            }
        }
    }
    
    return true;
}

async function testRAGSystem() {
    console.log('\n🧪 Testing RAG System...');
    
    // Note: This test requires OPENAI_API_KEY to be set
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Skipping RAG system test - OPENAI_API_KEY not set');
        return true;
    }
    
    const rag = new RAGSystem();
    
    // Test initialization
    console.log('📡 Initializing RAG system...');
    const initialized = await rag.initialize();
    
    if (!initialized) {
        console.log('❌ RAG system initialization failed');
        return false;
    }
    
    console.log('✅ RAG system initialized');
    
    // Test health check
    const health = await rag.healthCheck();
    console.log(`🏥 Health check: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    
    // Test stats
    const stats = rag.getStats();
    console.log(`📊 Stats: ${stats.documentsIndexed} documents indexed`);
    
    return true;
}

async function testConfiguration() {
    console.log('\n🧪 Testing Configuration...');
    
    console.log(`✅ Embedding model: ${config.embedding.model}`);
    console.log(`✅ Supported file types: ${config.supportedFileTypes.length} types`);
    console.log(`✅ Chunk size: ${config.embedding.chunkSize} tokens`);
    console.log(`✅ Vector store type: ${config.vectorStore.type}`);
    
    return true;
}

async function runTests() {
    console.log('🚀 Starting RAG System Tests\n');
    
    try {
        await testConfiguration();
        await testContentIngestion();
        await testRAGSystem();
        
        console.log('\n✅ All tests completed successfully!');
        
        console.log('\n📝 Next steps to use the RAG system:');
        console.log('1. Set OPENAI_API_KEY in your environment');
        console.log('2. Run: npm run ff rag:build');
        console.log('3. Run: npm run ff rag:query "What does this repository do?"');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if called directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testContentIngestion,
    testRAGSystem,
    testConfiguration,
    runTests
};
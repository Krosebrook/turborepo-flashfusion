/**
 * RAG System Configuration
 * Central configuration for the Retrieval-Augmented Generation system
 */

const path = require('path');

const config = {
    // Embedding configuration
    embedding: {
        model: 'text-embedding-3-small', // OpenAI embedding model
        dimensions: 1536,
        chunkSize: 1000,
        chunkOverlap: 200
    },

    // Supported file types
    supportedFileTypes: [
        '.md', '.txt', '.js', '.ts', '.jsx', '.tsx', 
        '.py', '.json', '.yaml', '.yml', '.html', 
        '.css', '.scss', '.sql', '.sh', '.dockerfile'
    ],

    // Vector store configuration
    vectorStore: {
        type: 'memory', // 'memory' or 'faiss'
        persistPath: path.join(__dirname, '..', 'data', 'vector_store'),
        indexName: 'repo_index'
    },

    // Generation configuration
    generation: {
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.1,
        systemPrompt: `You are a helpful assistant that answers questions about a codebase using the provided context. 
Always cite the source files when providing answers. If you cannot find relevant information in the context, say so clearly.
Focus on being accurate and helpful while staying grounded in the provided information.`
    },

    // Retrieval configuration
    retrieval: {
        topK: 5,
        minSimilarity: 0.3
    },

    // Repository scanning configuration
    scan: {
        excludePatterns: [
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            '.next/**',
            'coverage/**',
            '*.log',
            '.env*',
            '.turbo/**'
        ],
        maxFileSize: 1024 * 1024, // 1MB
        rootPath: process.cwd()
    }
};

module.exports = config;
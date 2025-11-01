/**
 * Main RAG System
 * Orchestrates ingestion, retrieval, and generation
 */

const ContentIngestion = require('./ingest');
const Retriever = require('./retrieve');
const Generator = require('./generate');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

class RAGSystem {
    constructor() {
        this.ingestion = new ContentIngestion();
        this.retriever = new Retriever();
        this.generator = new Generator();
        this.isInitialized = false;
        this.indexPath = path.join(config.vectorStore.persistPath, 'index.json');
    }

    /**
     * Initialize the RAG system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing RAG System...');

            // Initialize components
            await this.retriever.initialize();
            await this.generator.initialize();

            this.isInitialized = true;
            console.log('✅ RAG System initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ RAG System initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Build or rebuild the knowledge base from repository
     */
    async buildKnowledgeBase(rootPath = config.scan.rootPath, forceRebuild = false) {
        if (!this.isInitialized) {
            throw new Error('RAG System not initialized');
        }

        console.log('📚 Building knowledge base...');

        try {
            // Check if existing index exists and is recent
            if (!forceRebuild && await this.indexExists()) {
                console.log('📁 Loading existing knowledge base...');
                const loaded = await this.retriever.load(this.indexPath);
                if (loaded) {
                    console.log('✅ Knowledge base loaded from cache');
                    return true;
                }
            }

            // Ingest repository content
            console.log('🔍 Scanning and processing repository files...');
            const documents = await this.ingestion.ingestRepository(rootPath);

            if (documents.length === 0) {
                console.log('⚠️  No documents found to index');
                return false;
            }

            // Index documents for retrieval
            await this.retriever.indexDocuments(documents);

            // Save the index
            await this.saveIndex();

            console.log('✅ Knowledge base built successfully');
            return true;
        } catch (error) {
            console.error('❌ Knowledge base building failed:', error.message);
            throw error;
        }
    }

    /**
     * Query the knowledge base
     */
    async query(question, options = {}) {
        if (!this.isInitialized) {
            throw new Error('RAG System not initialized');
        }

        const {
            includeMetadata = true,
            includeSourceRefs = true,
            topK = config.retrieval.topK,
            verbose = false
        } = options;

        if (verbose) {
            console.log(`❓ Processing query: "${question}"`);
        }

        try {
            // Retrieve relevant documents
            const retrievedDocs = await this.retriever.retrieveAndRank(question, {
                topK,
                includeMetadata
            });

            if (retrievedDocs.length === 0) {
                return {
                    answer: "I couldn't find any relevant information in the repository to answer your question. Please try rephrasing your query or check if the knowledge base has been built.",
                    sources: [],
                    confidence: 0
                };
            }

            // Generate answer using retrieved context
            const result = await this.generator.generateAnswer(question, retrievedDocs, {
                includeSourceRefs
            });

            // Calculate confidence based on retrieval scores
            const avgScore = retrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / retrievedDocs.length;
            const confidence = Math.min(avgScore * 1.2, 1.0); // Boost and cap at 1.0

            return {
                ...result,
                confidence,
                retrievedDocsCount: retrievedDocs.length
            };

        } catch (error) {
            console.error('❌ Query processing failed:', error.message);
            throw error;
        }
    }

    /**
     * Get repository overview
     */
    async getRepositoryOverview() {
        const overviewQueries = [
            "What is the main purpose and functionality of this repository?",
            "What technologies and frameworks are used in this project?",
            "How is the project structured and organized?"
        ];

        const results = [];
        for (const query of overviewQueries) {
            try {
                const result = await this.query(query, { verbose: false });
                results.push({
                    question: query,
                    answer: result.answer,
                    confidence: result.confidence
                });
            } catch (error) {
                console.error(`Error processing overview query: ${query}`, error.message);
            }
        }

        return results;
    }

    /**
     * Search for specific code patterns or functionality
     */
    async searchCode(codeQuery) {
        const enhancedQuery = `Find and explain code related to: ${codeQuery}. Include function names, file locations, and explanations.`;
        return await this.query(enhancedQuery, {
            topK: 8, // More results for code searches
            includeSourceRefs: true
        });
    }

    /**
     * Get documentation for a specific topic
     */
    async getDocumentation(topic) {
        const docQuery = `Find documentation, README files, or comments explaining: ${topic}. Include setup instructions, usage examples, and configuration details.`;
        return await this.query(docQuery);
    }

    /**
     * Check if index exists
     */
    async indexExists() {
        try {
            await fs.access(this.indexPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Save the current index
     */
    async saveIndex() {
        try {
            await this.retriever.save(this.indexPath);
            console.log(`💾 Index saved to ${this.indexPath}`);
        } catch (error) {
            console.error('❌ Failed to save index:', error.message);
            throw error;
        }
    }

    /**
     * Clear the knowledge base
     */
    clearKnowledgeBase() {
        this.retriever.clear();
        this.ingestion.clear();
        console.log('🗑️  Knowledge base cleared');
    }

    /**
     * Get system statistics
     */
    getStats() {
        const retrieverStats = this.retriever.getStats();
        const generatorStats = this.generator.getStats();

        return {
            isInitialized: this.isInitialized,
            documentsIndexed: retrieverStats.documentCount,
            vectorDimensions: retrieverStats.vectorDimensions,
            memoryUsage: retrieverStats.memoryUsage,
            indexPath: this.indexPath,
            config: {
                embeddingModel: config.embedding.model,
                generationModel: generatorStats.model,
                supportedFileTypes: config.supportedFileTypes.length
            }
        };
    }

    /**
     * Health check for all components
     */
    async healthCheck() {
        const results = {
            system: this.isInitialized,
            retriever: this.retriever.isInitialized,
            generator: this.generator.isInitialized,
            index: await this.indexExists(),
            stats: this.getStats()
        };

        const isHealthy = Object.values(results).every(status => 
            typeof status === 'boolean' ? status : true
        );

        return {
            ...results,
            healthy: isHealthy
        };
    }
}

module.exports = RAGSystem;
/**
 * RAG Retrieval System
 * Handles query processing and document retrieval
 */

const VectorStore = require('./vectorStore');
const config = require('./config');

class Retriever {
    constructor() {
        this.vectorStore = new VectorStore();
        this.isInitialized = false;
    }

    /**
     * Initialize the retriever
     */
    async initialize() {
        try {
            await this.vectorStore.initialize();
            this.isInitialized = true;
            console.log('✅ Retriever initialized');
            return true;
        } catch (error) {
            console.error('❌ Retriever initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Index documents for retrieval
     */
    async indexDocuments(documents) {
        if (!this.isInitialized) {
            throw new Error('Retriever not initialized');
        }

        console.log('📊 Indexing documents for retrieval...');
        await this.vectorStore.addDocuments(documents);
        console.log('✅ Document indexing complete');
    }

    /**
     * Retrieve relevant documents for a query
     */
    async retrieve(query, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Retriever not initialized');
        }

        const {
            topK = config.retrieval.topK,
            minSimilarity = config.retrieval.minSimilarity,
            includeMetadata = true
        } = options;

        console.log(`🔍 Retrieving documents for query: "${query}"`);

        // Get similar documents from vector store
        const results = await this.vectorStore.searchSimilar(query, topK);

        // Format results
        const formattedResults = results.map(result => ({
            content: result.document.content,
            metadata: includeMetadata ? result.document.metadata : {},
            score: result.score,
            documentId: result.document.id
        }));

        // Log retrieval results
        console.log(`📋 Retrieved ${formattedResults.length} relevant documents:`);
        formattedResults.forEach((doc, index) => {
            const fileName = doc.metadata.fileName || 'Unknown';
            const score = (doc.score * 100).toFixed(1);
            console.log(`  ${index + 1}. ${fileName} (${score}% match)`);
        });

        return formattedResults;
    }

    /**
     * Retrieve and rank documents with enhanced filtering
     */
    async retrieveAndRank(query, options = {}) {
        const results = await this.retrieve(query, options);

        // Additional ranking based on document type and recency
        const rankedResults = results.map(doc => ({
            ...doc,
            enhancedScore: this.calculateEnhancedScore(doc, query)
        })).sort((a, b) => b.enhancedScore - a.enhancedScore);

        return rankedResults;
    }

    /**
     * Calculate enhanced score considering document type, recency, etc.
     */
    calculateEnhancedScore(document, query) {
        let score = document.score;

        // Boost scores for certain file types based on query
        const metadata = document.metadata;
        const queryLower = query.toLowerCase();

        // Boost README files for general questions
        if (metadata.fileName?.toLowerCase().includes('readme') && 
            (queryLower.includes('what') || queryLower.includes('how') || queryLower.includes('overview'))) {
            score *= 1.2;
        }

        // Boost code files for technical questions
        if (metadata.fileExtension && this.isCodeFile(metadata.fileExtension) &&
            (queryLower.includes('function') || queryLower.includes('implement') || queryLower.includes('code'))) {
            score *= 1.15;
        }

        // Boost configuration files for setup questions
        if (metadata.fileName?.toLowerCase().includes('config') || 
            metadata.fileName?.toLowerCase().includes('package.json') &&
            (queryLower.includes('setup') || queryLower.includes('install') || queryLower.includes('config'))) {
            score *= 1.1;
        }

        return score;
    }

    /**
     * Check if file is a code file
     */
    isCodeFile(extension) {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'];
        return codeExtensions.includes(extension);
    }

    /**
     * Save retriever state
     */
    async save(filepath) {
        await this.vectorStore.save(filepath);
    }

    /**
     * Load retriever state
     */
    async load(filepath) {
        return await this.vectorStore.load(filepath);
    }

    /**
     * Get retriever statistics
     */
    getStats() {
        return {
            ...this.vectorStore.getStats(),
            isInitialized: this.isInitialized
        };
    }

    /**
     * Clear retriever data
     */
    clear() {
        this.vectorStore.clear();
    }
}

module.exports = Retriever;
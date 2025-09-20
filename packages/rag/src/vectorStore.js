/**
 * Vector Store Implementation
 * Simple in-memory vector store with cosine similarity search
 * Can be extended to use FAISS or other vector databases
 */

const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const config = require('./config');

class VectorStore {
    constructor() {
        this.vectors = [];
        this.documents = [];
        this.openai = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the vector store
     */
    async initialize() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY environment variable is required for embeddings');
            }

            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });

            console.log('✅ Vector store initialized with OpenAI embeddings');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Vector store initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Generate embeddings for text using OpenAI
     */
    async generateEmbeddings(texts) {
        if (!this.isInitialized) {
            throw new Error('Vector store not initialized');
        }

        try {
            console.log(`🔮 Generating embeddings for ${texts.length} texts...`);
            
            const response = await this.openai.embeddings.create({
                model: config.embedding.model,
                input: texts,
                encoding_format: 'float'
            });

            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('❌ Embedding generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Add documents to the vector store
     */
    async addDocuments(documents) {
        if (!documents || documents.length === 0) {
            console.log('⚠️  No documents to add');
            return;
        }

        console.log(`📚 Adding ${documents.length} documents to vector store...`);

        // Extract text content from documents
        const texts = documents.map(doc => doc.content);
        
        // Generate embeddings in batches to avoid rate limits
        const batchSize = 100;
        const embeddings = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchEmbeddings = await this.generateEmbeddings(batch);
            embeddings.push(...batchEmbeddings);
            
            // Small delay to avoid rate limits
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Store vectors and documents
        documents.forEach((doc, index) => {
            this.vectors.push(embeddings[index]);
            this.documents.push(doc);
        });

        console.log(`✅ Added ${documents.length} documents to vector store`);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }

        const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * Search for similar documents
     */
    async searchSimilar(query, topK = config.retrieval.topK) {
        if (!this.isInitialized) {
            throw new Error('Vector store not initialized');
        }

        if (this.vectors.length === 0) {
            console.log('⚠️  No documents in vector store');
            return [];
        }

        console.log(`🔍 Searching for: "${query}"`);

        // Generate embedding for query
        const queryEmbedding = await this.generateEmbeddings([query]);
        const queryVector = queryEmbedding[0];

        // Calculate similarities
        const similarities = this.vectors.map((vector, index) => ({
            score: this.cosineSimilarity(queryVector, vector),
            document: this.documents[index],
            index
        }));

        // Sort by similarity and filter by minimum threshold
        const results = similarities
            .filter(item => item.score >= config.retrieval.minSimilarity)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        console.log(`📋 Found ${results.length} relevant documents`);
        return results;
    }

    /**
     * Save vector store to disk
     */
    async save(filepath) {
        try {
            const data = {
                vectors: this.vectors,
                documents: this.documents,
                timestamp: new Date().toISOString(),
                config: {
                    model: config.embedding.model,
                    dimensions: config.embedding.dimensions
                }
            };

            await fs.mkdir(path.dirname(filepath), { recursive: true });
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            
            console.log(`💾 Vector store saved to ${filepath}`);
        } catch (error) {
            console.error('❌ Failed to save vector store:', error.message);
            throw error;
        }
    }

    /**
     * Load vector store from disk
     */
    async load(filepath) {
        try {
            const data = JSON.parse(await fs.readFile(filepath, 'utf-8'));
            
            this.vectors = data.vectors || [];
            this.documents = data.documents || [];
            
            console.log(`📁 Loaded vector store with ${this.documents.length} documents`);
            return true;
        } catch (error) {
            console.error('❌ Failed to load vector store:', error.message);
            return false;
        }
    }

    /**
     * Get store statistics
     */
    getStats() {
        return {
            documentCount: this.documents.length,
            vectorDimensions: this.vectors.length > 0 ? this.vectors[0].length : 0,
            memoryUsage: this.vectors.length * (this.vectors[0]?.length || 0) * 8, // bytes
            isInitialized: this.isInitialized
        };
    }

    /**
     * Clear the vector store
     */
    clear() {
        this.vectors = [];
        this.documents = [];
        console.log('🗑️  Vector store cleared');
    }
}

module.exports = VectorStore;
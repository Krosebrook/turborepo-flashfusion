/**
 * RAG Index Agent - Creates and updates vector embeddings from documents
 * Stores embeddings in vector database for retrieval-augmented generation
 */

const crypto = require('crypto');
const { OpenAI } = require('openai');

class RagIndexAgent {
    constructor(databaseService, options = {}) {
        this.db = databaseService;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.options = {
            embeddingModel: options.embeddingModel || 'text-embedding-3-small',
            chunkSize: options.chunkSize || 1000,
            chunkOverlap: options.chunkOverlap || 200,
            maxConcurrentEmbeddings: options.maxConcurrentEmbeddings || 10,
            ...options
        };

        this.stats = {
            documentsProcessed: 0,
            embeddingsCreated: 0,
            lastProcessedAt: null,
            totalTokensUsed: 0
        };
    }

    /**
     * Process a document and create embeddings
     * @param {Object} document - Document to process
     * @param {string} document.content - Text content
     * @param {string} document.title - Document title
     * @param {string} document.source_url - Source URL
     * @param {string} document.source_type - Type of source (web, file, api, etc.)
     * @param {Object} document.metadata - Additional metadata
     * @returns {Object} Result with embedding index location and processed records
     */
    async processDocument(document) {
        try {
            console.log('🔄 Processing document:', {
                title: document.title,
                source_type: document.source_type,
                content_length: document.content?.length
            });

            // Generate document ID and content hash
            const documentId = this.generateDocumentId(document);
            const contentHash = this.generateContentHash(document.content);

            // Check if document already exists and hasn't changed
            const existingDoc = await this.db.getDocumentsByType(document.source_type, 1);
            if (existingDoc.success && existingDoc.data.length > 0) {
                const existing = existingDoc.data.find(d => d.document_id === documentId);
                if (existing && existing.content_hash === contentHash) {
                    console.log('📄 Document unchanged, skipping processing');
                    return {
                        success: true,
                        message: 'Document unchanged, no processing needed',
                        document_id: documentId,
                        embeddings_location: `document_embeddings.document_id='${documentId}'`,
                        new_records: 0
                    };
                }
            }

            // Store the document
            const storeResult = await this.db.storeDocument({
                document_id: documentId,
                title: document.title,
                content: document.content,
                source_url: document.source_url,
                source_type: document.source_type,
                metadata: document.metadata || {},
                content_hash: contentHash
            });

            if (!storeResult.success) {
                throw new Error(`Failed to store document: ${storeResult.error}`);
            }

            // Split content into chunks
            const chunks = this.chunkText(document.content);
            console.log(`📝 Split document into ${chunks.length} chunks`);

            // Create embeddings for each chunk
            const embeddings = await this.createEmbeddings(chunks);
            
            // Store embeddings
            let embeddingsStored = 0;
            for (let i = 0; i < embeddings.length; i++) {
                const embeddingResult = await this.db.storeEmbedding({
                    document_id: documentId,
                    chunk_index: i,
                    chunk_text: chunks[i],
                    embedding_vector: embeddings[i],
                    embedding_model: this.options.embeddingModel,
                    chunk_metadata: {
                        chunk_length: chunks[i].length,
                        position: i
                    }
                });

                if (embeddingResult.success) {
                    embeddingsStored++;
                } else {
                    console.warn(`⚠️ Failed to store embedding ${i}:`, embeddingResult.error);
                }
            }

            // Update stats
            this.stats.documentsProcessed++;
            this.stats.embeddingsCreated += embeddingsStored;
            this.stats.lastProcessedAt = new Date().toISOString();

            console.log('✅ Document processing completed:', {
                document_id: documentId,
                chunks_processed: chunks.length,
                embeddings_stored: embeddingsStored
            });

            return {
                success: true,
                document_id: documentId,
                embeddings_location: `document_embeddings.document_id='${documentId}'`,
                new_records: embeddingsStored,
                chunks_processed: chunks.length,
                stats: this.getStats()
            };

        } catch (error) {
            console.error('❌ Document processing failed:', error);
            return {
                success: false,
                error: error.message,
                document_id: null,
                embeddings_location: null,
                new_records: 0
            };
        }
    }

    /**
     * Process multiple documents in batch
     */
    async processBatch(documents) {
        console.log(`🔄 Processing batch of ${documents.length} documents`);
        const results = [];
        
        for (const document of documents) {
            const result = await this.processDocument(document);
            results.push(result);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const successful = results.filter(r => r.success).length;
        const totalRecords = results.reduce((sum, r) => sum + (r.new_records || 0), 0);

        console.log('📊 Batch processing completed:', {
            total_documents: documents.length,
            successful: successful,
            failed: documents.length - successful,
            total_new_records: totalRecords
        });

        return {
            success: true,
            batch_results: results,
            summary: {
                total_documents: documents.length,
                successful: successful,
                failed: documents.length - successful,
                total_new_records: totalRecords
            },
            stats: this.getStats()
        };
    }

    /**
     * Search for similar content using vector similarity
     */
    async searchSimilar(queryText, options = {}) {
        try {
            const searchOptions = {
                limit: options.limit || 10,
                threshold: options.threshold || 0.7,
                ...options
            };

            // Create embedding for query
            const queryEmbedding = await this.createEmbeddings([queryText]);
            if (!queryEmbedding || queryEmbedding.length === 0) {
                throw new Error('Failed to create query embedding');
            }

            // Search similar embeddings
            const searchResult = await this.db.searchSimilarEmbeddings(
                queryEmbedding[0], 
                searchOptions.limit, 
                searchOptions.threshold
            );

            if (!searchResult.success) {
                throw new Error(searchResult.error);
            }

            console.log(`🔍 Found ${searchResult.data.length} similar chunks`);

            return {
                success: true,
                query: queryText,
                results: searchResult.data,
                count: searchResult.data.length,
                search_options: searchOptions
            };

        } catch (error) {
            console.error('❌ Similarity search failed:', error);
            return {
                success: false,
                error: error.message,
                results: [],
                count: 0
            };
        }
    }

    /**
     * Refresh embeddings for documents that have changed
     */
    async refreshEmbeddings(sourceType = null) {
        try {
            console.log('🔄 Refreshing embeddings...', sourceType ? `for type: ${sourceType}` : 'for all documents');

            // Get documents to refresh
            const documentsResult = sourceType 
                ? await this.db.getDocumentsByType(sourceType, 100)
                : await this.db.getDocumentsByType('web', 100); // Default to web documents

            if (!documentsResult.success) {
                throw new Error(documentsResult.error);
            }

            const documents = documentsResult.data;
            console.log(`📄 Found ${documents.length} documents to check`);

            let refreshed = 0;
            for (const doc of documents) {
                // Check if embeddings exist
                const embeddingsResult = await this.db.getDocumentEmbeddings(doc.document_id);
                if (!embeddingsResult.success || embeddingsResult.data.length === 0) {
                    // Re-process document if no embeddings found
                    const result = await this.processDocument({
                        content: doc.content,
                        title: doc.title,
                        source_url: doc.source_url,
                        source_type: doc.source_type,
                        metadata: doc.metadata
                    });
                    
                    if (result.success) {
                        refreshed++;
                    }
                }
            }

            console.log(`✅ Refresh completed: ${refreshed} documents refreshed`);

            return {
                success: true,
                documents_checked: documents.length,
                documents_refreshed: refreshed,
                stats: this.getStats()
            };

        } catch (error) {
            console.error('❌ Refresh failed:', error);
            return {
                success: false,
                error: error.message,
                documents_refreshed: 0
            };
        }
    }

    /**
     * Get RAG index statistics
     */
    getStats() {
        return {
            ...this.stats,
            embedding_model: this.options.embeddingModel,
            chunk_size: this.options.chunkSize,
            chunk_overlap: this.options.chunkOverlap
        };
    }

    /**
     * Private method to chunk text into smaller pieces
     */
    chunkText(text) {
        const chunks = [];
        const words = text.split(' ');
        let currentChunk = '';
        
        for (const word of words) {
            if ((currentChunk + ' ' + word).length <= this.options.chunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = word;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        // Handle overlap between chunks
        if (this.options.chunkOverlap > 0 && chunks.length > 1) {
            return this.addChunkOverlap(chunks);
        }

        return chunks;
    }

    /**
     * Add overlap between chunks for better context preservation
     */
    addChunkOverlap(chunks) {
        const overlappedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];
            
            // Add overlap from previous chunk
            if (i > 0 && this.options.chunkOverlap > 0) {
                const prevChunk = chunks[i - 1];
                const overlapWords = prevChunk.split(' ').slice(-this.options.chunkOverlap);
                chunk = overlapWords.join(' ') + ' ' + chunk;
            }
            
            overlappedChunks.push(chunk);
        }
        
        return overlappedChunks;
    }

    /**
     * Create embeddings using OpenAI API
     */
    async createEmbeddings(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: this.options.embeddingModel,
                input: texts
            });

            this.stats.totalTokensUsed += response.usage?.total_tokens || 0;

            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('❌ Failed to create embeddings:', error);
            throw error;
        }
    }

    /**
     * Generate consistent document ID
     */
    generateDocumentId(document) {
        const source = document.source_url || document.title || 'unknown';
        return crypto.createHash('md5').update(source).digest('hex');
    }

    /**
     * Generate content hash for change detection
     */
    generateContentHash(content) {
        return crypto.createHash('sha256').update(content || '').digest('hex');
    }
}

module.exports = RagIndexAgent;
/**
 * RAG Generation System
 * Handles answer generation using retrieved context and LLM
 */

const OpenAI = require('openai');
const config = require('./config');

class Generator {
    constructor() {
        this.openai = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the generator
     */
    async initialize() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY environment variable is required');
            }

            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });

            console.log('✅ Generator initialized with OpenAI');
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Generator initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Generate answer using retrieved context
     */
    async generateAnswer(query, retrievedDocs, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Generator not initialized');
        }

        const {
            model = config.generation.model,
            maxTokens = config.generation.maxTokens,
            temperature = config.generation.temperature,
            includeSourceRefs = true
        } = options;

        console.log(`🤖 Generating answer for: "${query}"`);

        try {
            // Prepare context from retrieved documents
            const context = this.prepareContext(retrievedDocs);
            
            // Build the prompt
            const prompt = this.buildPrompt(query, context, includeSourceRefs);

            // Generate response
            const response = await this.openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: config.generation.systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: temperature
            });

            const answer = response.choices[0].message.content;

            // Enhance answer with source references if requested
            const enhancedAnswer = includeSourceRefs ? 
                this.enhanceWithSourceReferences(answer, retrievedDocs) : answer;

            console.log('✅ Answer generated successfully');

            return {
                answer: enhancedAnswer,
                sources: this.extractSources(retrievedDocs),
                tokensUsed: response.usage?.total_tokens || 0,
                model: model
            };

        } catch (error) {
            console.error('❌ Answer generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Prepare context string from retrieved documents
     */
    prepareContext(retrievedDocs) {
        if (!retrievedDocs || retrievedDocs.length === 0) {
            return 'No relevant context found.';
        }

        const contextParts = retrievedDocs.map((doc, index) => {
            const fileName = doc.metadata?.fileName || 'Unknown file';
            const filePath = doc.metadata?.filePath || '';
            const score = doc.score ? `(${(doc.score * 100).toFixed(1)}% match)` : '';
            
            return `## Source ${index + 1}: ${fileName} ${score}
File: ${filePath}

${doc.content}

---`;
        });

        return contextParts.join('\n\n');
    }

    /**
     * Build the complete prompt for the LLM
     */
    buildPrompt(query, context, includeSourceRefs) {
        const sourceInstruction = includeSourceRefs ? 
            '\n\nIMPORTANT: Always cite specific source files when referencing information from the context.' : '';

        return `Based on the following context from the codebase, please answer this question: "${query}"

CONTEXT:
${context}

Please provide a comprehensive answer based on the context above. If the context doesn't contain enough information to fully answer the question, please state that clearly.${sourceInstruction}

QUESTION: ${query}

ANSWER:`;
    }

    /**
     * Enhance answer with source references
     */
    enhanceWithSourceReferences(answer, retrievedDocs) {
        if (!retrievedDocs || retrievedDocs.length === 0) {
            return answer;
        }

        // Add source references section
        const sources = retrievedDocs.map((doc, index) => {
            const fileName = doc.metadata?.fileName || 'Unknown file';
            const filePath = doc.metadata?.filePath || '';
            const score = doc.score ? ` (${(doc.score * 100).toFixed(1)}% relevance)` : '';
            
            return `${index + 1}. **${fileName}**${score}\n   \`${filePath}\``;
        });

        const sourceSection = `\n\n---\n\n**Sources:**\n${sources.join('\n')}`;
        
        return answer + sourceSection;
    }

    /**
     * Extract source information for metadata
     */
    extractSources(retrievedDocs) {
        return retrievedDocs.map(doc => ({
            fileName: doc.metadata?.fileName || 'Unknown',
            filePath: doc.metadata?.filePath || '',
            score: doc.score || 0,
            chunkIndex: doc.metadata?.chunkIndex || 0
        }));
    }

    /**
     * Generate a summary of the repository based on retrieved content
     */
    async generateRepositorySummary(retrievedDocs, options = {}) {
        const summaryQuery = "What does this repository do? Provide an overview of its main purpose, technologies used, and key features.";
        
        return await this.generateAnswer(summaryQuery, retrievedDocs, {
            ...options,
            maxTokens: 1000
        });
    }

    /**
     * Generate code explanation
     */
    async explainCode(codeContext, query = "Explain what this code does") {
        const codeQuery = `${query}. Please explain the purpose, functionality, and key components.`;
        
        return await this.generateAnswer(codeQuery, codeContext, {
            temperature: 0.1, // Lower temperature for more factual explanations
            maxTokens: 1500
        });
    }

    /**
     * Get generator statistics
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            model: config.generation.model,
            maxTokens: config.generation.maxTokens,
            temperature: config.generation.temperature
        };
    }
}

module.exports = Generator;
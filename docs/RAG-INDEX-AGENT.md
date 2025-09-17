# RAG Index Agent Documentation

## Overview

The RAG (Retrieval-Augmented Generation) Index Agent is a core component of FlashFusion that creates and manages vector embeddings from documents to enable intelligent search and retrieval capabilities.

## Features

### 🔄 Document Processing
- **Multi-format Support**: Processes text documents, markdown files, and web content
- **Automatic Chunking**: Intelligently splits large documents into optimal chunks
- **Content Hashing**: Detects changes and only processes modified content
- **Metadata Preservation**: Maintains document metadata and context

### 📊 Vector Database
- **Embedding Storage**: Stores vector embeddings with PostgreSQL integration
- **Similarity Search**: Cosine similarity search for semantic content matching
- **Index Management**: Automatic indexing for optimal search performance
- **Batch Operations**: Efficient processing of multiple documents

### 🔍 Intelligent Search
- **Semantic Search**: Find content by meaning, not just keywords
- **Relevance Scoring**: Returns results with similarity scores
- **Context Preservation**: Maintains document context through overlapping chunks
- **Flexible Queries**: Support for various query types and filters

## Usage

### CLI Commands

```bash
# Process a document and create embeddings
ff rag:process /path/to/document.txt
ff rag:process https://example.com/article

# Search for similar content
ff rag:search "machine learning algorithms"

# Refresh embeddings for all documents
ff rag:refresh

# View vector database statistics
ff rag:stats
```

### Programmatic Usage

```javascript
const databaseService = require('./apps/web/src/services/database');
const RagIndexAgent = require('./packages/ai-agents/core/RagIndexAgent');

// Initialize
await databaseService.initialize();
const ragAgent = new RagIndexAgent(databaseService);

// Process a document
const result = await ragAgent.processDocument({
    content: 'Your document content here...',
    title: 'Document Title',
    source_url: 'https://example.com',
    source_type: 'web',
    metadata: { author: 'John Doe' }
});

// Search for similar content
const searchResult = await ragAgent.searchSimilar('query text', {
    limit: 10,
    threshold: 0.7
});
```

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    source_url TEXT,
    source_type VARCHAR(100) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Document Embeddings Table
```sql
CREATE TABLE document_embeddings (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding_vector REAL[] NOT NULL,
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
    chunk_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);
```

## Configuration

### Environment Variables

```bash
# Required for embeddings
OPENAI_API_KEY=sk-your-openai-key

# Database configuration (choose one)
POSTGRES_URL=postgresql://user:pass@host:port/db
# OR
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Agent Options

```javascript
const ragAgent = new RagIndexAgent(databaseService, {
    embeddingModel: 'text-embedding-3-small',
    chunkSize: 1000,
    chunkOverlap: 200,
    maxConcurrentEmbeddings: 10
});
```

## Integration Points

### OpenAI Webhook Integration
The RAG agent integrates with OpenAI webhooks to automatically process embeddings:

```javascript
// In apps/api/webhooks/openai.js
async function handleEmbedding(data) {
    const ragAgent = new RagIndexAgent(databaseService);
    // Process embedding data automatically
}
```

### Search Tool Integration
Vector search is available through the search tool:

```javascript
// Search with vector similarity
const results = await searchDatabase(JSON.stringify({
    query: "your search query",
    search_type: "vector"
}));
```

## Performance Considerations

### Chunking Strategy
- **Chunk Size**: Default 1000 characters, adjustable based on content type
- **Overlap**: 200-character overlap preserves context between chunks
- **Boundaries**: Smart chunking respects sentence and paragraph boundaries

### Vector Storage
- **Dimensions**: 1536 dimensions for text-embedding-3-small model
- **Storage**: REAL[] array type in PostgreSQL for efficient storage
- **Indexing**: Automatic indexing on document_id and embedding_model

### Search Performance
- **Cosine Similarity**: Fast similarity calculation using PostgreSQL operators
- **Result Limiting**: Configurable result limits and similarity thresholds
- **Caching**: Query result caching for frequently accessed content

## Error Handling

The RAG agent includes comprehensive error handling:

- **Database Connectivity**: Graceful degradation when database is unavailable
- **API Rate Limits**: Automatic retry logic for OpenAI API calls
- **Invalid Content**: Validation and sanitization of input documents
- **Storage Failures**: Rollback capabilities for failed operations

## Monitoring and Analytics

### Built-in Statistics
- Documents processed count
- Embeddings created count
- Token usage tracking
- Processing timestamps
- Model version tracking

### Health Checks
- Database connection status
- API key validation
- Storage capacity monitoring
- Search performance metrics

## Roadmap

### Short Term
- [ ] Support for additional embedding models
- [ ] Batch processing optimization
- [ ] Enhanced metadata filtering
- [ ] Web scraping integration

### Long Term
- [ ] Multi-modal embeddings (images, audio)
- [ ] Distributed vector storage
- [ ] Real-time index updates
- [ ] Advanced query operators

## Contributing

See the main FlashFusion documentation for contribution guidelines. The RAG Index Agent follows the same patterns and standards as other FlashFusion components.
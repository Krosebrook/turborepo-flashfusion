# FlashFusion RAG System

A Retrieval-Augmented Generation (RAG) system that enables semantic search and question-answering over repository content.

## 🌟 Features

- **Content Ingestion**: Scans repository files and chunks content intelligently
- **Vector Search**: Uses OpenAI embeddings for semantic similarity search
- **Smart Generation**: Generates accurate, grounded answers using retrieved context
- **CLI Interface**: Easy-to-use command line interface
- **API Integration**: REST API endpoints for web applications
- **Multiple File Types**: Supports `.md`, `.js`, `.ts`, `.py`, `.json`, and more

## 🚀 Quick Start

### 1. Set up environment

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### 2. Build knowledge base

```bash
# Build knowledge base from current repository
npm run ff rag:build

# Or force rebuild
npm run ff rag:rebuild
```

### 3. Ask questions

```bash
# Ask questions about the repository
npm run ff rag:query "What does this repository do?"

# Search for specific code patterns
npm run ff rag:search "authentication functions"

# Get documentation
npm run ff rag:docs "API endpoints"

# Get repository overview
npm run ff rag:overview
```

## 📚 Usage Examples

### CLI Commands

```bash
# System commands
npm run ff rag:build [path]    # Build knowledge base
npm run ff rag:rebuild [path]  # Force rebuild
npm run ff rag:stats           # Show statistics
npm run ff rag:health          # Health check
npm run ff rag:clear           # Clear knowledge base

# Query commands
npm run ff rag:query "How do I set up development environment?"
npm run ff rag:search "user authentication code"
npm run ff rag:docs "database schema"
npm run ff rag:overview
```

### API Endpoints

```javascript
// Health check
GET /api/rag/health

// Build knowledge base
POST /api/rag/build
{
  "rootPath": "/path/to/repo",
  "forceRebuild": false
}

// Query repository
POST /api/rag/query
{
  "question": "What does this repository do?",
  "options": {
    "topK": 5,
    "includeSourceRefs": true
  }
}

// Quick query
GET /api/rag/ask?q=What%20is%20this%20project%20about
```

### Programmatic Usage

```javascript
const RAGSystem = require('@flashfusion/rag');

async function example() {
  const rag = new RAGSystem();
  
  // Initialize the system
  await rag.initialize();
  
  // Build knowledge base
  await rag.buildKnowledgeBase('/path/to/repo');
  
  // Query the system
  const result = await rag.query("What does this repository do?");
  console.log(result.answer);
  console.log(`Confidence: ${result.confidence}`);
}
```

## ⚙️ Configuration

The system can be configured via `src/config.js`:

```javascript
const config = {
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    chunkSize: 1000,
    chunkOverlap: 200
  },
  generation: {
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.1
  },
  // ... more options
};
```

## 🛠️ Architecture

### Components

- **ContentIngestion** (`src/ingest.js`): Scans and chunks repository files
- **VectorStore** (`src/vectorStore.js`): Manages embeddings and similarity search
- **Retriever** (`src/retrieve.js`): Handles query processing and document retrieval
- **Generator** (`src/generate.js`): Generates answers using LLM and context
- **RAGSystem** (`src/index.js`): Main orchestrator

### File Processing

The system intelligently chunks different file types:

- **Code files**: Chunked by functions/classes
- **Markdown files**: Chunked by sections
- **Other files**: Chunked by word count with overlap

### Supported File Types

- Documentation: `.md`, `.txt`
- Code: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`
- Config: `.json`, `.yaml`, `.yml`
- Web: `.html`, `.css`, `.scss`
- Scripts: `.sh`, `.dockerfile`

## 🔧 Development

### Running Tests

```bash
# Run basic tests
npm test

# Or directly
node test/basic.test.js
```

### Adding New File Types

1. Add extension to `config.supportedFileTypes`
2. Optionally add custom chunking logic in `ingest.js`

### Extending the API

1. Add new routes in `api.js`
2. Implement corresponding methods in `RAGSystem`

## 📊 System Requirements

- Node.js 18+
- OpenAI API key
- 2GB+ RAM (for vector storage)
- 1GB+ disk space (for vector index)

## 🔐 Security

- API keys are loaded from environment variables
- No sensitive data is logged or stored in vectors
- Input validation on all API endpoints

## 🚨 Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY not found"**
   - Set the environment variable: `export OPENAI_API_KEY="sk-..."`

2. **"No documents found"**
   - Check if you're in the right directory
   - Verify supported file types exist

3. **"Rate limit exceeded"**
   - The system includes delays between API calls
   - Consider using a higher tier OpenAI plan

### Debug Commands

```bash
# Check system health
npm run ff rag:health

# View statistics
npm run ff rag:stats

# Clear and rebuild
npm run ff rag:clear
npm run ff rag:rebuild
```

## 📄 License

MIT License - see the main repository license.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

---

For more information, see the main FlashFusion documentation or run `npm run ff rag:help`.
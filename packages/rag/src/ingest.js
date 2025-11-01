/**
 * Content Ingestion System
 * Scans repository files and chunks content for embeddings
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const crypto = require('crypto');
const config = require('./config');

class ContentIngestion {
    constructor() {
        this.documents = [];
        this.processedFiles = new Set();
    }

    /**
     * Scan repository for relevant files
     */
    async scanRepository(rootPath = config.scan.rootPath) {
        console.log(`🔍 Scanning repository: ${rootPath}`);
        
        const allFiles = [];

        for (const ext of config.supportedFileTypes) {
            const pattern = `**/*${ext}`;
            try {
                // Use glob.sync for simplicity and reliability
                const files = glob.sync(pattern, {
                    cwd: rootPath,
                    ignore: config.scan.excludePatterns,
                    absolute: true
                });
                allFiles.push(...files);
            } catch (error) {
                console.warn(`Warning: Failed to scan for ${ext} files:`, error.message);
            }
        }

        // Remove duplicates
        const uniqueFiles = [...new Set(allFiles)];
        console.log(`📄 Found ${uniqueFiles.length} files to process`);
        return uniqueFiles;
    }

    /**
     * Process a single file and extract content
     */
    async processFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            // Skip large files
            if (stats.size > config.scan.maxFileSize) {
                console.log(`⚠️  Skipping large file: ${filePath} (${stats.size} bytes)`);
                return null;
            }

            const content = await fs.readFile(filePath, 'utf-8');
            const relativePath = path.relative(config.scan.rootPath, filePath);
            
            // Get file metadata
            const fileExtension = path.extname(filePath);
            const fileName = path.basename(filePath);
            
            return {
                filePath: relativePath,
                fileName,
                fileExtension,
                content,
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                hash: this.generateContentHash(content)
            };
        } catch (error) {
            console.error(`❌ Error processing file ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Chunk content into semantically meaningful units
     */
    chunkContent(content, metadata) {
        const chunks = [];
        const chunkSize = config.embedding.chunkSize;
        const chunkOverlap = config.embedding.chunkOverlap;

        // For code files, try to chunk by functions/classes
        if (this.isCodeFile(metadata.fileExtension)) {
            return this.chunkCodeFile(content, metadata);
        }

        // For markdown files, chunk by sections
        if (metadata.fileExtension === '.md') {
            return this.chunkMarkdownFile(content, metadata);
        }

        // Default chunking strategy
        const words = content.split(/\s+/);
        
        for (let i = 0; i < words.length; i += chunkSize - chunkOverlap) {
            const chunkWords = words.slice(i, i + chunkSize);
            const chunkContent = chunkWords.join(' ');
            
            if (chunkContent.trim().length > 0) {
                chunks.push({
                    id: this.generateChunkId(metadata.filePath, i),
                    content: chunkContent,
                    metadata: {
                        ...metadata,
                        chunkIndex: Math.floor(i / (chunkSize - chunkOverlap)),
                        startIndex: i,
                        endIndex: i + chunkWords.length
                    }
                });
            }
        }

        return chunks;
    }

    /**
     * Chunk code files by functions/classes
     */
    chunkCodeFile(content, metadata) {
        const chunks = [];
        const lines = content.split('\n');
        let currentChunk = [];
        let inFunction = false;
        let braceCount = 0;
        let chunkIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentChunk.push(line);

            // Simple heuristic for function/class boundaries
            if (line.match(/^(function|class|const|let|var.*=.*function|export.*function)/)) {
                inFunction = true;
            }

            // Track braces for code blocks
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;

            // End of function/class or reached chunk size limit
            if ((inFunction && braceCount === 0) || currentChunk.length >= 50) {
                if (currentChunk.length > 0) {
                    const chunkContent = currentChunk.join('\n');
                    chunks.push({
                        id: this.generateChunkId(metadata.filePath, chunkIndex),
                        content: chunkContent,
                        metadata: {
                            ...metadata,
                            chunkIndex,
                            startLine: i - currentChunk.length + 1,
                            endLine: i,
                            chunkType: 'code_block'
                        }
                    });
                    chunkIndex++;
                }
                currentChunk = [];
                inFunction = false;
            }
        }

        // Handle remaining content
        if (currentChunk.length > 0) {
            const chunkContent = currentChunk.join('\n');
            chunks.push({
                id: this.generateChunkId(metadata.filePath, chunkIndex),
                content: chunkContent,
                metadata: {
                    ...metadata,
                    chunkIndex,
                    startLine: lines.length - currentChunk.length,
                    endLine: lines.length,
                    chunkType: 'code_block'
                }
            });
        }

        return chunks;
    }

    /**
     * Chunk markdown files by sections
     */
    chunkMarkdownFile(content, metadata) {
        const chunks = [];
        const sections = content.split(/^#+ /gm);
        
        sections.forEach((section, index) => {
            if (section.trim().length > 0) {
                chunks.push({
                    id: this.generateChunkId(metadata.filePath, index),
                    content: section.trim(),
                    metadata: {
                        ...metadata,
                        chunkIndex: index,
                        chunkType: 'markdown_section'
                    }
                });
            }
        });

        return chunks.length > 0 ? chunks : this.chunkContent(content, metadata);
    }

    /**
     * Check if file is a code file
     */
    isCodeFile(extension) {
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'];
        return codeExtensions.includes(extension);
    }

    /**
     * Generate content hash for change detection
     */
    generateContentHash(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * Generate unique chunk ID
     */
    generateChunkId(filePath, index) {
        return crypto.createHash('md5')
            .update(`${filePath}:${index}`)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Process all files in repository
     */
    async ingestRepository(rootPath = config.scan.rootPath) {
        console.log('🚀 Starting repository ingestion...');
        
        const files = await this.scanRepository(rootPath);
        const allChunks = [];

        for (const filePath of files) {
            console.log(`📄 Processing: ${path.relative(rootPath, filePath)}`);
            
            const fileData = await this.processFile(filePath);
            if (!fileData) continue;

            const chunks = this.chunkContent(fileData.content, fileData);
            allChunks.push(...chunks);
            
            this.processedFiles.add(filePath);
        }

        console.log(`✅ Ingestion complete. Generated ${allChunks.length} chunks from ${this.processedFiles.size} files`);
        this.documents = allChunks;
        return allChunks;
    }

    /**
     * Get processed documents
     */
    getDocuments() {
        return this.documents;
    }

    /**
     * Clear processed documents
     */
    clear() {
        this.documents = [];
        this.processedFiles.clear();
    }
}

module.exports = ContentIngestion;
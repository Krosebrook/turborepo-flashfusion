/**
 * FlashFusion Notion Integration Service
 * Provides comprehensive Notion API integration for FlashFusion platform
 */

const { Client } = require('@notionhq/client');
const logger = console; // Use console logger for compatibility

class NotionService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.connectionStatus = {
            connected: false,
            lastConnected: null,
            error: null
        };
    }

    /**
   * Initialize Notion service
   */
    async initialize() {
        try {
            const notionToken =
        process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;

            if (!notionToken) {
                logger.warn('Notion token not provided - service will be disabled');
                return false;
            }

            this.client = new Client({
                auth: notionToken
            });

            // Test connection by getting user info
            await this.client.users.me();

            this.isInitialized = true;
            this.connectionStatus = {
                connected: true,
                lastConnected: new Date().toISOString(),
                error: null
            };

            logger.info('Notion service initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Notion service:', error);
            this.connectionStatus = {
                connected: false,
                lastConnected: null,
                error: error.message
            };
            return false;
        }
    }

    /**
   * Get connection status
   */
    getConnectionStatus() {
        return {
            service: 'notion',
            ...this.connectionStatus,
            initialized: this.isInitialized
        };
    }

    /**
   * Test connection to Notion
   */
    async testConnection() {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const user = await this.client.users.me();
            return {
                success: true,
                user: {
                    name: user.name,
                    avatar: user.avatar_url,
                    type: user.type
                }
            };
        } catch (error) {
            logger.error('Notion connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Get all databases accessible to the integration
   */
    async getDatabases() {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const response = await this.client.search({
                filter: {
                    value: 'database',
                    property: 'object'
                }
            });

            const databases = response.results.map((db) => ({
                id: db.id,
                title: db.title?.[0]?.plain_text || 'Untitled',
                url: db.url,
                created_time: db.created_time,
                last_edited_time: db.last_edited_time
            }));

            return { success: true, data: databases };
        } catch (error) {
            logger.error('Failed to get Notion databases:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Get pages from a specific database
   */
    async getDatabasePages(databaseId, filters = {}) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const queryOptions = {
                database_id: databaseId
            };

            if (filters.filter) {
                queryOptions.filter = filters.filter;
            }

            if (filters.sorts) {
                queryOptions.sorts = filters.sorts;
            }

            const response = await this.client.databases.query(queryOptions);

            const pages = response.results.map((page) => ({
                id: page.id,
                title: this.extractPageTitle(page),
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
                properties: this.extractPageProperties(page.properties)
            }));

            return {
                success: true,
                data: {
                    pages,
                    has_more: response.has_more,
                    next_cursor: response.next_cursor
                }
            };
        } catch (error) {
            logger.error('Failed to get database pages:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Create a new page in a database
   */
    async createPage(databaseId, properties, content = []) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const pageData = {
                parent: {
                    database_id: databaseId
                },
                properties: properties
            };

            if (content.length > 0) {
                pageData.children = content;
            }

            const response = await this.client.pages.create(pageData);

            return {
                success: true,
                data: {
                    id: response.id,
                    url: response.url,
                    title: this.extractPageTitle(response)
                }
            };
        } catch (error) {
            logger.error('Failed to create Notion page:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Update an existing page
   */
    async updatePage(pageId, properties) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const response = await this.client.pages.update({
                page_id: pageId,
                properties: properties
            });

            return {
                success: true,
                data: {
                    id: response.id,
                    url: response.url,
                    title: this.extractPageTitle(response)
                }
            };
        } catch (error) {
            logger.error('Failed to update Notion page:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Search across all accessible content
   */
    async search(query, filters = {}) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const searchOptions = {
                query: query
            };

            if (filters.filter) {
                searchOptions.filter = filters.filter;
            }

            if (filters.sort) {
                searchOptions.sort = filters.sort;
            }

            const response = await this.client.search(searchOptions);

            const results = response.results.map((item) => ({
                id: item.id,
                object: item.object,
                title:
          item.object === 'page'
              ? this.extractPageTitle(item)
              : item.title?.[0]?.plain_text || 'Untitled',
                url: item.url,
                created_time: item.created_time,
                last_edited_time: item.last_edited_time
            }));

            return {
                success: true,
                data: {
                    results,
                    has_more: response.has_more,
                    next_cursor: response.next_cursor
                }
            };
        } catch (error) {
            logger.error('Failed to search Notion:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Get page content with blocks
   */
    async getPageContent(pageId) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        try {
            const [pageResponse, blocksResponse] = await Promise.all([
                this.client.pages.retrieve({ page_id: pageId }),
                this.client.blocks.children.list({ block_id: pageId })
            ]);

            return {
                success: true,
                data: {
                    page: {
                        id: pageResponse.id,
                        title: this.extractPageTitle(pageResponse),
                        url: pageResponse.url,
                        created_time: pageResponse.created_time,
                        last_edited_time: pageResponse.last_edited_time,
                        properties: this.extractPageProperties(pageResponse.properties)
                    },
                    blocks: blocksResponse.results
                }
            };
        } catch (error) {
            logger.error('Failed to get page content:', error);
            return { success: false, error: error.message };
        }
    }

    /**
   * Create workflow integration with Notion
   */
    async createWorkflowIntegration(workflowId, notionConfig) {
        const actions = [];

        if (notionConfig.createPages) {
            actions.push({
                type: 'create_page',
                database_id: notionConfig.databaseId,
                template: notionConfig.pageTemplate
            });
        }

        if (notionConfig.updatePages) {
            actions.push({
                type: 'update_page',
                filters: notionConfig.updateFilters,
                properties: notionConfig.updateProperties
            });
        }

        if (notionConfig.syncData) {
            actions.push({
                type: 'sync_data',
                source: notionConfig.syncSource,
                target: notionConfig.syncTarget,
                mapping: notionConfig.fieldMapping
            });
        }

        return {
            success: true,
            data: {
                workflowId,
                integration: 'notion',
                actions,
                config: notionConfig
            }
        };
    }

    /**
   * Helper method to extract page title
   */
    extractPageTitle(page) {
        if (!page.properties) {
            return 'Untitled';
        }

        const titleProperty = Object.values(page.properties).find(
            (prop) => prop.type === 'title'
        );

        return titleProperty?.title?.[0]?.plain_text || 'Untitled';
    }

    /**
   * Helper method to extract page properties
   */
    extractPageProperties(properties) {
        const extracted = {};

        Object.entries(properties).forEach(([key, prop]) => {
            switch (prop.type) {
            case 'title':
                extracted[key] = prop.title?.[0]?.plain_text || '';
                break;
            case 'rich_text':
                extracted[key] =
            prop.rich_text?.map((t) => t.plain_text).join('') || '';
                break;
            case 'number':
                extracted[key] = prop.number;
                break;
            case 'select':
                extracted[key] = prop.select?.name || null;
                break;
            case 'multi_select':
                extracted[key] = prop.multi_select?.map((s) => s.name) || [];
                break;
            case 'date':
                extracted[key] = prop.date?.start || null;
                break;
            case 'checkbox':
                extracted[key] = prop.checkbox;
                break;
            case 'url':
                extracted[key] = prop.url;
                break;
            case 'email':
                extracted[key] = prop.email;
                break;
            case 'phone_number':
                extracted[key] = prop.phone_number;
                break;
            default:
                extracted[key] = prop;
            }
        });

        return extracted;
    }

    /**
   * Health check for the service
   */
    getHealth() {
        return {
            service: 'notion',
            status:
        this.isInitialized && this.connectionStatus.connected
            ? 'healthy'
            : 'unhealthy',
            initialized: this.isInitialized,
            connected: this.connectionStatus.connected,
            lastConnected: this.connectionStatus.lastConnected,
            error: this.connectionStatus.error
        };
    }

    /**
   * Cleanup resources
   */
    async cleanup() {
        this.client = null;
        this.isInitialized = false;
        this.connectionStatus = {
            connected: false,
            lastConnected: null,
            error: null
        };
        logger.info('Notion service cleaned up');
    }
}

module.exports = new NotionService();
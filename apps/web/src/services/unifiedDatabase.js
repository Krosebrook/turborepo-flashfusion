const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const ErrorHandler = require('../utils/errorHandler');
const { configManager } = require('../utils/configManager');
const logger = require('../utils/logger');

class UnifiedDatabaseService {
    constructor() {
        this.supabase = null;
        this.pgPool = null;
        this.isConnected = false;
        this.dbType = 'none';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.connectionMonitor = null;
        this.errorHandler = ErrorHandler.createServiceErrorHandler('UnifiedDatabase');
    }

    async initialize() {
        return this.errorHandler.execute(async () => {
            const config = configManager.load();
            this.dbType = config.get('database').type;

            logger.info(`Initializing database service with type: ${this.dbType}`);

            switch (this.dbType) {
            case 'supabase':
                await this.initializeSupabase();
                break;
            case 'postgresql':
                await this.initializePostgreSQL();
                break;
            default:
                logger.warn('No database configuration found - running in offline mode');
                return false;
            }

            this.isConnected = true;
            this.startConnectionMonitor();

            logger.info(`Database service initialized successfully (${this.dbType})`);
            return true;
        }, 'initialize');
    }

    async initializeSupabase() {
        const config = configManager.getConfig('database').supabase;

        if (!config.url || !config.anonKey) {
            throw new Error('Supabase configuration incomplete');
        }

        this.supabase = createClient(config.url, config.serviceRoleKey || config.anonKey);

        // Test connection
        const { error } = await this.supabase.from('_test').select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is OK for test
            throw new Error(`Supabase connection test failed: ${error.message}`);
        }

        logger.info('Supabase client initialized successfully');
    }

    async initializePostgreSQL() {
        const config = configManager.getConfig('database').postgresql;
        const connectionString = configManager.getConnectionString('postgresql');

        if (!connectionString) {
            throw new Error('PostgreSQL configuration incomplete');
        }

        this.pgPool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });

        // Test connection
        const client = await this.pgPool.connect();
        await client.query('SELECT NOW()');
        client.release();

        logger.info('PostgreSQL pool initialized successfully');
    }

    async query(queryText, params = []) {
        return this.errorHandler.execute(async () => {
            if (!this.isConnected) {
                throw this.errorHandler.createError('Database not connected', 503);
            }

            if (this.dbType === 'postgresql' && this.pgPool) {
                const client = await this.pgPool.connect();
                try {
                    const result = await client.query(queryText, params);
                    return result;
                } finally {
                    client.release();
                }
            } else {
                throw this.errorHandler.createError('Query method not available for current database type', 501);
            }
        }, 'query');
    }

    async supabaseQuery(table) {
        if (!this.supabase) {
            throw this.errorHandler.createError('Supabase not initialized', 503);
        }
        return this.supabase.from(table);
    }

    async insert(table, data) {
        return this.errorHandler.execute(async () => {
            if (this.dbType === 'supabase') {
                const { data: result, error } = await this.supabase
                    .from(table)
                    .insert(data)
                    .select();

                if (error) {throw ErrorHandler.handleDatabaseError(error);}
                return result;
            } else if (this.dbType === 'postgresql') {
                const columns = Object.keys(data);
                const values = Object.values(data);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                const queryText = `
                    INSERT INTO ${table} (${columns.join(', ')})
                    VALUES (${placeholders})
                    RETURNING *
                `;

                const result = await this.query(queryText, values);
                return result.rows;
            }
        }, 'insert');
    }

    async select(table, filters = {}, options = {}) {
        return this.errorHandler.execute(async () => {
            if (this.dbType === 'supabase') {
                let query = this.supabase.from(table).select(options.select || '*');

                // Apply filters
                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });

                // Apply options
                if (options.limit) {query = query.limit(options.limit);}
                if (options.offset) {query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);}
                if (options.orderBy) {query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });}

                const { data, error } = await query;
                if (error) {throw ErrorHandler.handleDatabaseError(error);}
                return data;
            } else if (this.dbType === 'postgresql') {
                let queryText = `SELECT ${options.select || '*'} FROM ${table}`;
                const params = [];

                // Build WHERE clause
                if (Object.keys(filters).length > 0) {
                    const conditions = Object.keys(filters).map((key, i) => {
                        params.push(filters[key]);
                        return `${key} = $${i + 1}`;
                    });
                    queryText += ` WHERE ${conditions.join(' AND ')}`;
                }

                // Add ordering
                if (options.orderBy) {
                    queryText += ` ORDER BY ${options.orderBy.column} ${options.orderBy.ascending ? 'ASC' : 'DESC'}`;
                }

                // Add pagination
                if (options.limit) {
                    queryText += ` LIMIT ${options.limit}`;
                }
                if (options.offset) {
                    queryText += ` OFFSET ${options.offset}`;
                }

                const result = await this.query(queryText, params);
                return result.rows;
            }
        }, 'select');
    }

    async update(table, data, filters) {
        return this.errorHandler.execute(async () => {
            if (this.dbType === 'supabase') {
                let query = this.supabase.from(table).update(data);

                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });

                const { data: result, error } = await query.select();
                if (error) {throw ErrorHandler.handleDatabaseError(error);}
                return result;
            } else if (this.dbType === 'postgresql') {
                const updateColumns = Object.keys(data);
                const updateValues = Object.values(data);
                const filterColumns = Object.keys(filters);
                const filterValues = Object.values(filters);

                const setClause = updateColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');
                const whereClause = filterColumns.map((col, i) => `${col} = $${updateValues.length + i + 1}`).join(' AND ');

                const queryText = `
                    UPDATE ${table} 
                    SET ${setClause}
                    WHERE ${whereClause}
                    RETURNING *
                `;

                const result = await this.query(queryText, [...updateValues, ...filterValues]);
                return result.rows;
            }
        }, 'update');
    }

    async delete(table, filters) {
        return this.errorHandler.execute(async () => {
            if (this.dbType === 'supabase') {
                let query = this.supabase.from(table).delete();

                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });

                const { error } = await query;
                if (error) {throw ErrorHandler.handleDatabaseError(error);}
                return true;
            } else if (this.dbType === 'postgresql') {
                const columns = Object.keys(filters);
                const values = Object.values(filters);
                const whereClause = columns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');

                const queryText = `DELETE FROM ${table} WHERE ${whereClause}`;

                await this.query(queryText, values);
                return true;
            }
        }, 'delete');
    }

    async cleanup() {
        return this.errorHandler.execute(async () => {
            if (this.connectionMonitor) {
                clearInterval(this.connectionMonitor);
                this.connectionMonitor = null;
            }

            logger.info('Database cleanup completed');
        }, 'cleanup');
    }

    async shutdown() {
        return this.errorHandler.execute(async () => {
            await this.cleanup();

            if (this.pgPool) {
                await this.pgPool.end();
                this.pgPool = null;
            }

            this.supabase = null;
            this.isConnected = false;

            logger.info('Database service shut down');
        }, 'shutdown');
    }

    startConnectionMonitor() {
        this.connectionMonitor = setInterval(async () => {
            try {
                await this.healthCheck();
            } catch (error) {
                logger.error('Database health check failed:', error);
                this.isConnected = false;

                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.attemptReconnect(), this.reconnectDelay);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    async attemptReconnect() {
        try {
            logger.info(`Attempting database reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            await this.initialize();
            this.reconnectAttempts = 0;
            logger.info('Database reconnection successful');
        } catch (error) {
            logger.error('Database reconnection failed:', error);
        }
    }

    async healthCheck() {
        return this.errorHandler.execute(async () => {
            if (!this.isConnected) {
                return { status: 'disconnected', type: this.dbType };
            }

            if (this.dbType === 'supabase' && this.supabase) {
                const { error } = await this.supabase.from('_test').select('*').limit(1);
                return {
                    status: error && error.code !== 'PGRST116' ? 'error' : 'healthy',
                    type: 'supabase',
                    error: error?.message
                };
            } else if (this.dbType === 'postgresql' && this.pgPool) {
                const client = await this.pgPool.connect();
                try {
                    await client.query('SELECT 1');
                    return { status: 'healthy', type: 'postgresql' };
                } finally {
                    client.release();
                }
            }

            return { status: 'unknown', type: this.dbType };
        }, 'healthCheck');
    }

    getHealth() {
        return {
            connected: this.isConnected,
            type: this.dbType,
            reconnectAttempts: this.reconnectAttempts,
            hasSupabase: !!this.supabase,
            hasPostgreSQL: !!this.pgPool
        };
    }
}

module.exports = UnifiedDatabaseService;
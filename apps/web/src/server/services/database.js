const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dbConfig = require('../../config/database.json');
const logger = require('../../utils/logger');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.supabase = null;
        this.isConnected = false;
        this.environment = process.env.NODE_ENV || 'development';
    }

    async initialize() {
        try {
            // Initialize Supabase client
            if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                this.supabase = createClient(
                    process.env.SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );
                logger.info('Supabase client initialized');
            }

            // Initialize PostgreSQL connection pool
            const config = dbConfig[this.environment];

            if (process.env.DATABASE_URL) {
                // Use connection string if provided (for production)
                this.pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl:
            process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,
                    ...config.pgOptions
                });
            } else if (config) {
                // Use config file settings
                this.pool = new Pool({
                    host: config.server,
                    port: config.port,
                    database: config.database,
                    user: config.username,
                    password: process.env.DB_PASSWORD,
                    ...config.pgOptions
                });
            }

            // Test connection
            if (this.pool) {
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();
                this.isConnected = true;
                logger.info('PostgreSQL connection established');
            }

            return true;
        } catch (error) {
            logger.error('Database initialization failed:', error);
            throw error;
        }
    }

    // PostgreSQL query wrapper with error handling
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;

            logger.debug('Query executed', {
                text: text.substring(0, 100),
                duration,
                rows: result.rowCount
            });

            return result;
        } catch (error) {
            logger.error('Query failed:', {
                error: error.message,
                query: text.substring(0, 100)
            });
            throw error;
        }
    }

    // Supabase wrapper methods
    async supabaseQuery(table) {
        if (!this.supabase) {
            throw new Error('Supabase not initialized');
        }
        return this.supabase.from(table);
    }

    // Agent logs specific methods
    async logAgentInteraction(
        agentId,
        input,
        output,
        modelUsed,
        userId,
        metadata = {}
    ) {
        try {
            if (this.supabase) {
                // Use Supabase
                const { data, error } = await this.supabase.from('agent_logs').insert([
                    {
                        agent_id: agentId,
                        input: input.substring(0, 1000),
                        output: output.substring(0, 2000),
                        model_used: modelUsed,
                        user_id: userId,
                        metadata
                    }
                ]);

                if (error) {
                    throw error;
                }
                return data;
            } else if (this.pool) {
                // Fallback to direct PostgreSQL
                const result = await this.query(
                    `INSERT INTO agent_logs (agent_id, input, output, model_used, user_id, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
                    [
                        agentId,
                        input.substring(0, 1000),
                        output.substring(0, 2000),
                        modelUsed,
                        userId,
                        metadata
                    ]
                );
                return result.rows[0];
            }
        } catch (error) {
            logger.error('Failed to log agent interaction:', error);
            // Don't throw - logging shouldn't break the app
        }
    }

    async getAgentLogs(filters = {}) {
        try {
            if (this.supabase) {
                let query = this.supabase.from('agent_logs').select('*');

                if (filters.agentId) {
                    query = query.eq('agent_id', filters.agentId);
                }
                if (filters.userId) {
                    query = query.eq('user_id', filters.userId);
                }
                if (filters.limit) {
                    query = query.limit(filters.limit);
                }

                query = query.order('timestamp', { ascending: false });

                const { data, error } = await query;
                if (error) {
                    throw error;
                }
                return data;
            } else if (this.pool) {
                let queryText = 'SELECT * FROM agent_logs WHERE 1=1';
                const params = [];

                if (filters.agentId) {
                    params.push(filters.agentId);
                    queryText += ` AND agent_id = $${params.length}`;
                }
                if (filters.userId) {
                    params.push(filters.userId);
                    queryText += ` AND user_id = $${params.length}`;
                }

                queryText += ' ORDER BY timestamp DESC';

                if (filters.limit) {
                    params.push(filters.limit);
                    queryText += ` LIMIT $${params.length}`;
                }

                const result = await this.query(queryText, params);
                return result.rows;
            }

            return [];
        } catch (error) {
            logger.error('Failed to get agent logs:', error);
            throw error;
        }
    }

    // Connection health check
    async healthCheck() {
        const health = {
            postgresql: false,
            supabase: false,
            details: {}
        };

        try {
            if (this.pool) {
                const result = await this.query(
                    'SELECT NOW() as time, current_database() as database'
                );
                health.postgresql = true;
                health.details.postgresql = {
                    database: result.rows[0].database,
                    time: result.rows[0].time
                };
            }
        } catch (error) {
            health.details.postgresql = { error: error.message };
        }

        try {
            if (this.supabase) {
                const { count, error } = await this.supabase
                    .from('agent_logs')
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    health.supabase = true;
                    health.details.supabase = { agent_logs_count: count };
                } else {
                    health.details.supabase = { error: error.message };
                }
            }
        } catch (error) {
            health.details.supabase = { error: error.message };
        }

        return health;
    }

    // Cleanup
    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('PostgreSQL connection pool closed');
        }
    }
}

// Export singleton instance
module.exports = new DatabaseService();
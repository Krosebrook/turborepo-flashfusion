// Database Service Layer for FlashFusion
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.pgPool = null;
        this.isConnected = false;
        this.isPgConnected = false;
        this.connectionError = null;
        this.dbType = 'supabase'; // 'supabase' or 'postgresql'
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 seconds
        this.connectionMonitor = null;
    }

    async initialize() {
        try {
            // Determine database type based on environment variables
            const hasPostgreSQL =
        process.env.POSTGRES_URL || process.env.DATABASE_URL;
            const hasSupabase =
        process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

            if (hasPostgreSQL) {
                this.dbType = 'postgresql';
                await this.initializePostgreSQL();
            } else if (hasSupabase) {
                this.dbType = 'supabase';
                await this.initializeSupabase();
            } else {
                throw new Error(
                    'No database configuration found. Set either POSTGRES_URL/DATABASE_URL ' +
                    'or SUPABASE_URL/SUPABASE_ANON_KEY'
                );
            }

            console.log(
                `✅ ${this.dbType.toUpperCase()} database connection established successfully`
            );

            // Start connection monitoring for PostgreSQL
            if (this.dbType === 'postgresql') {
                this.startConnectionMonitoring();
            }

            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
            return true;
        } catch (error) {
            this.connectionError = error.message;
            this.isConnected = false;
            this.isPgConnected = false;
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }

    async initializeSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
            );
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);

        // Test connection
        const { error } = await this.supabase
            .from('agent_personalities')
            .select('count(*)')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Supabase connection failed: ${error.message}`);
        }

        this.isConnected = true;
        await this.ensureSchemaExists();
    }

    async initializePostgreSQL() {
        const connectionString =
      process.env.POSTGRES_URL || process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error(
                'Missing PostgreSQL connection string. Set POSTGRES_URL or DATABASE_URL environment variable.'
            );
        }

        this.pgPool = new Pool({
            connectionString,
            ssl:
        process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });

        // Test connection
        const client = await this.pgPool.connect();
        try {
            await client.query('SELECT NOW()');
            this.isPgConnected = true;
            this.isConnected = true;
            await this.ensurePostgreSQLSchema();
        } finally {
            client.release();
        }
    }

    async ensureSchemaExists() {
        if (this.dbType === 'supabase') {
            try {
                // Check if agent_personalities table exists
                const { error } = await this.supabase
                    .from('agent_personalities')
                    .select('id')
                    .limit(1);

                if (error && error.code === 'PGRST116') {
                    console.log('🔧 Database schema not found, would need manual setup');
                    // Note: Schema creation requires admin privileges
                    // User should run the schema.sql file manually
                }
            } catch (error) {
                console.warn('Schema check failed:', error.message);
            }
        }
    }

    async ensurePostgreSQLSchema() {
        const client = await this.pgPool.connect();
        try {
            // Create tables if they don't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS agent_personalities (
                    id SERIAL PRIMARY KEY,
                    agent_id VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    traits JSONB DEFAULT '{}',
                    capabilities JSONB DEFAULT '[]',
                    personality_config JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS agent_states (
                    id SERIAL PRIMARY KEY,
                    agent_id VARCHAR(255) UNIQUE NOT NULL,
                    current_state JSONB DEFAULT '{}',
                    memory JSONB DEFAULT '{}',
                    context JSONB DEFAULT '{}',
                    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS agent_logs (
                    id SERIAL PRIMARY KEY,
                    agent_id VARCHAR(255) NOT NULL,
                    user_id VARCHAR(255),
                    conversation_id VARCHAR(255),
                    interaction_type VARCHAR(100),
                    input_data JSONB,
                    output_data JSONB,
                    metadata JSONB DEFAULT '{}',
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS agent_memory (
                    id SERIAL PRIMARY KEY,
                    agent_id VARCHAR(255) NOT NULL,
                    user_id VARCHAR(255) NOT NULL,
                    conversation_id VARCHAR(255) NOT NULL,
                    sequence_number INTEGER NOT NULL,
                    memory_type VARCHAR(100) DEFAULT 'conversation',
                    content JSONB NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    expires_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    project_id VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    owner_id VARCHAR(255) NOT NULL,
                    status VARCHAR(100) DEFAULT 'active',
                    config JSONB DEFAULT '{}',
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS api_usage (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255),
                    agent_id VARCHAR(255),
                    api_provider VARCHAR(100) NOT NULL,
                    endpoint VARCHAR(255),
                    tokens_used INTEGER DEFAULT 0,
                    cost_usd DECIMAL(10,6) DEFAULT 0,
                    request_data JSONB,
                    response_data JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Create indexes for better performance
                CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs(agent_id);
                CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
                CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_user_conv 
                ON agent_memory(agent_id, user_id, conversation_id);
                CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
                CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
                CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
            `);

            console.log('🔧 PostgreSQL schema initialized successfully');
        } finally {
            client.release();
        }
    }

    // Agent Personalities
    async getAgentPersonalities() {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            if (this.dbType === 'supabase') {
                const { data, error } = await this.supabase
                    .from('agent_personalities')
                    .select('*');

                if (error) {
                    throw error;
                }
                return { success: true, data: data || [] };
            } else {
                const client = await this.pgPool.connect();
                try {
                    const result = await client.query(
                        'SELECT * FROM agent_personalities ORDER BY created_at DESC'
                    );
                    return { success: true, data: result.rows };
                } finally {
                    client.release();
                }
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createAgentPersonality(agentData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_personalities')
                .insert([agentData])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateAgentPersonality(agentId, updates) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_personalities')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('agent_id', agentId)
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Agent States
    async getAgentState(agentId) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_states')
                .select('*')
                .eq('agent_id', agentId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return { success: true, data: data || null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateAgentState(agentId, stateData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_states')
                .upsert({
                    agent_id: agentId,
                    ...stateData,
                    updated_at: new Date().toISOString()
                })
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Agent Logs
    async logAgentInteraction(logData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_logs')
                .insert([
                    {
                        ...logData,
                        timestamp: new Date().toISOString()
                    }
                ])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAgentLogs(agentId, limit = 100) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            let query = this.supabase
                .from('agent_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (agentId) {
                query = query.eq('agent_id', agentId);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Agent Memory
    async saveAgentMemory(memoryData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_memory')
                .insert([memoryData])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAgentMemory(agentId, userId, conversationId, limit = 50) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('agent_memory')
                .select('*')
                .eq('agent_id', agentId)
                .eq('user_id', userId)
                .eq('conversation_id', conversationId)
                .order('sequence_number', { ascending: true })
                .limit(limit);

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Projects
    async createProject(projectData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('projects')
                .insert([projectData])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProjects(ownerId) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            let query = this.supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (ownerId) {
                query = query.eq('owner_id', ownerId);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // API Usage Tracking
    async logApiUsage(usageData) {
        if (!this.isConnected) {
            return { success: false, error: 'Database not connected' };
        }

        try {
            const { data, error } = await this.supabase
                .from('api_usage')
                .insert([usageData])
                .select();

            if (error) {
                throw error;
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Health Check
    async healthCheck() {
        try {
            const { error } = await this.supabase
                .from('agent_personalities')
                .select('count(*)')
                .limit(1);

            if (error) {
                throw error;
            }

            return {
                status: 'healthy',
                connected: this.isConnected,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Utility Methods
    async cleanup() {
        if (!this.isConnected) {
            return;
        }

        try {
            // Clean up expired agent memory
            await this.supabase
                .from('agent_memory')
                .delete()
                .lt('expires_at', new Date().toISOString());

            console.log('🧹 Database cleanup completed');
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            dbType: this.dbType,
            error: this.connectionError,
            reconnectAttempts: this.reconnectAttempts,
            timestamp: new Date().toISOString()
        };
    }

    // Connection monitoring and persistence
    startConnectionMonitoring() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }

        this.connectionMonitor = setInterval(async () => {
            try {
                if (this.dbType === 'postgresql' && this.pgPool) {
                    const client = await this.pgPool.connect();
                    await client.query('SELECT 1');
                    client.release();
                } else if (this.dbType === 'supabase' && this.supabase) {
                    await this.supabase
                        .from('agent_personalities')
                        .select('count(*)')
                        .limit(1);
                }

                // Connection is healthy
                if (!this.isConnected) {
                    console.log('🔄 Database connection restored');
                    this.isConnected = true;
                    this.connectionError = null;
                    this.reconnectAttempts = 0;
                }
            } catch (error) {
                if (this.isConnected) {
                    console.warn('⚠️ Database connection lost, attempting reconnect...');
                    this.isConnected = false;
                    this.connectionError = error.message;
                    await this.attemptReconnect();
                }
            }
        }, 30000); // Check every 30 seconds
    }

    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return false;
        }

        this.reconnectAttempts++;
        console.log(
            `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );

        try {
            await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
            return await this.initialize();
        } catch (error) {
            console.error(
                `❌ Reconnection attempt ${this.reconnectAttempts} failed:`,
                error.message
            );
            return false;
        }
    }

    // Graceful shutdown
    async disconnect() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
            this.connectionMonitor = null;
        }

        if (this.pgPool) {
            try {
                await this.pgPool.end();
                console.log('🔌 PostgreSQL pool disconnected');
            } catch (error) {
                console.warn('⚠️ Error disconnecting PostgreSQL pool:', error.message);
            }
        }

        this.isConnected = false;
        this.isPgConnected = false;
        console.log('👋 Database service disconnected');
    }
}

// Export singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;
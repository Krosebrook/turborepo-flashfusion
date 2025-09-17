/**
 * Sample Migration: Initial Schema Setup
 * Version: 20250917102200
 * Description: Create initial database tables for FlashFusion
 * Environment: development
 * Generated: 2025-09-17T10:22:00.000Z
 */

module.exports = {
    version: '20250917102200',
    name: 'initial_schema_setup',
    description: 'Create initial database tables for FlashFusion',
    dependencies: [], // No dependencies for initial migration

    async up(databaseService, migrationAgent) {
        // Create agent_workflows table for workflow tracking
        await databaseService.query(`
            CREATE TABLE IF NOT EXISTS agent_workflows (
                id SERIAL PRIMARY KEY,
                workflow_id VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                agent_id VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                input_data JSONB DEFAULT '{}',
                output_data JSONB DEFAULT '{}',
                execution_log JSONB DEFAULT '[]',
                started_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Create migration_checkpoints table for deployment tracking
        await databaseService.query(`
            CREATE TABLE IF NOT EXISTS migration_checkpoints (
                id SERIAL PRIMARY KEY,
                checkpoint_name VARCHAR(255) UNIQUE NOT NULL,
                environment VARCHAR(50) NOT NULL,
                schema_version VARCHAR(50) NOT NULL,
                deployment_tag VARCHAR(100),
                codebase_commit VARCHAR(64),
                migration_count INTEGER DEFAULT 0,
                validation_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                validated_at TIMESTAMP WITH TIME ZONE
            );
        `);

        // Create indexes for performance
        await databaseService.query(`
            CREATE INDEX IF NOT EXISTS idx_agent_workflows_agent_id ON agent_workflows(agent_id);
            CREATE INDEX IF NOT EXISTS idx_agent_workflows_status ON agent_workflows(status);
            CREATE INDEX IF NOT EXISTS idx_migration_checkpoints_env ON migration_checkpoints(environment);
            CREATE INDEX IF NOT EXISTS idx_migration_checkpoints_version ON migration_checkpoints(schema_version);
        `);

        migrationAgent.logger.info('✅ Initial schema tables created successfully');
        
        // Return rollback data
        return {
            tables_created: ['agent_workflows', 'migration_checkpoints'],
            rollback_instructions: `
                DROP TABLE IF EXISTS agent_workflows CASCADE;
                DROP TABLE IF EXISTS migration_checkpoints CASCADE;
            `
        };
    },

    async down(databaseService, migrationAgent, rollbackData) {
        migrationAgent.logger.info('🔄 Rolling back initial schema setup...');
        
        if (rollbackData?.rollback_instructions) {
            await databaseService.query(rollbackData.rollback_instructions);
            migrationAgent.logger.info('✅ Initial schema rollback completed');
        }
    },

    async validate(databaseService) {
        try {
            // Validate that tables were created
            const result = await databaseService.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('agent_workflows', 'migration_checkpoints')
            `);
            
            const tableNames = result.rows.map(row => row.table_name);
            const expectedTables = ['agent_workflows', 'migration_checkpoints'];
            
            for (const table of expectedTables) {
                if (!tableNames.includes(table)) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
};
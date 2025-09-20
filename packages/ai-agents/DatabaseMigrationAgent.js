/**
 * Database Migration Agent
 * 
 * Handles schema and data migrations across environments with proper
 * dependency resolution, rollback capabilities, and success tracking.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DatabaseMigrationAgent {
    constructor(databaseService, options = {}) {
        this.databaseService = databaseService;
        this.migrationsPath = options.migrationsPath || './migrations';
        this.environment = options.environment || process.env.NODE_ENV || 'development';
        this.dryRun = options.dryRun || false;
        this.migrationLog = [];
        this.rollbackData = new Map();
        
        // Migration tracking table
        this.migrationTable = 'migration_history';
        
        this.logger = options.logger || console;
    }

    /**
     * Initialize the migration agent and ensure tracking table exists
     */
    async initialize() {
        this.logger.info('🚀 Initializing Database Migration Agent');
        
        try {
            await this.ensureMigrationTable();
            await this.createMigrationsDirectory();
            this.logger.info('✅ Database Migration Agent initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize Database Migration Agent:', error.message);
            throw error;
        }
    }

    /**
     * Create the migration tracking table
     */
    async ensureMigrationTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                version VARCHAR(50) NOT NULL,
                description TEXT,
                checksum VARCHAR(64) NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                execution_time_ms INTEGER,
                success BOOLEAN DEFAULT TRUE,
                rollback_data JSONB,
                environment VARCHAR(50) DEFAULT '${this.environment}',
                agent_version VARCHAR(20) DEFAULT '1.0.0'
            );
            
            CREATE INDEX IF NOT EXISTS idx_migration_history_name ON ${this.migrationTable}(migration_name);
            CREATE INDEX IF NOT EXISTS idx_migration_history_version ON ${this.migrationTable}(version);
            CREATE INDEX IF NOT EXISTS idx_migration_history_environment ON ${this.migrationTable}(environment);
        `;

        if (this.databaseService.dbType === 'postgresql') {
            const client = await this.databaseService.pgPool.connect();
            try {
                await client.query(createTableSQL);
                this.logger.info('📊 Migration tracking table ready');
            } finally {
                client.release();
            }
        } else if (this.databaseService.dbType === 'supabase') {
            // For Supabase, we'll need to handle schema creation differently
            this.logger.warn('⚠️ Supabase schema creation requires admin privileges - please run schema manually');
        }
    }

    /**
     * Create migrations directory if it doesn't exist
     */
    async createMigrationsDirectory() {
        try {
            await fs.access(this.migrationsPath);
        } catch {
            await fs.mkdir(this.migrationsPath, { recursive: true });
            this.logger.info(`📁 Created migrations directory: ${this.migrationsPath}`);
        }
    }

    /**
     * Generate a new migration file
     */
    async generateMigration(name, description = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const version = timestamp.replace(/[-T]/g, '');
        const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.js`;
        const filepath = path.join(this.migrationsPath, filename);

        const migrationTemplate = `/**
 * Migration: ${name}
 * Version: ${version}
 * Description: ${description}
 * Environment: ${this.environment}
 * Generated: ${new Date().toISOString()}
 */

module.exports = {
    version: '${version}',
    name: '${name}',
    description: '${description}',
    dependencies: [], // List of migration versions this depends on

    async up(databaseService, migrationAgent) {
        // Schema/data changes go here
        // Example:
        // await databaseService.query(\`
        //     CREATE TABLE example_table (
        //         id SERIAL PRIMARY KEY,
        //         name VARCHAR(255) NOT NULL,
        //         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        //     );
        // \`);
        
        // Return rollback data if needed
        return {
            tables_created: ['example_table'],
            rollback_instructions: 'DROP TABLE IF EXISTS example_table;'
        };
    },

    async down(databaseService, migrationAgent, rollbackData) {
        // Rollback logic goes here
        if (rollbackData?.rollback_instructions) {
            await databaseService.query(rollbackData.rollback_instructions);
        }
    },

    async validate(databaseService) {
        // Validation logic to ensure migration was successful
        // Return true if validation passes, false otherwise
        return true;
    }
};
`;

        await fs.writeFile(filepath, migrationTemplate);
        this.logger.info(`📝 Generated migration: ${filename}`);
        return { filename, filepath, version };
    }

    /**
     * Get all available migrations sorted by version
     */
    async getAvailableMigrations() {
        try {
            const files = await fs.readdir(this.migrationsPath);
            const migrations = [];

            for (const file of files) {
                if (file.endsWith('.js')) {
                    const filepath = path.join(this.migrationsPath, file);
                    const migration = require(path.resolve(filepath));
                    const content = await fs.readFile(filepath, 'utf8');
                    const checksum = crypto.createHash('sha256').update(content).digest('hex');
                    
                    migrations.push({
                        filename: file,
                        filepath,
                        ...migration,
                        checksum
                    });
                }
            }

            return migrations.sort((a, b) => a.version.localeCompare(b.version));
        } catch (error) {
            this.logger.error('❌ Failed to read migrations:', error.message);
            return [];
        }
    }

    /**
     * Get executed migrations from database
     */
    async getExecutedMigrations() {
        try {
            if (this.databaseService.dbType === 'postgresql') {
                const result = await this.databaseService.query(
                    `SELECT * FROM ${this.migrationTable} WHERE environment = $1 ORDER BY version`,
                    [this.environment]
                );
                return result.rows;
            } else {
                // Handle Supabase or other database types
                const result = await this.databaseService.select(this.migrationTable, 
                    { environment: this.environment },
                    { orderBy: { column: 'version', ascending: true } }
                );
                return result || [];
            }
        } catch (error) {
            this.logger.warn('⚠️ Could not read migration history:', error.message);
            return [];
        }
    }

    /**
     * Get pending migrations
     */
    async getPendingMigrations() {
        const available = await this.getAvailableMigrations();
        const executed = await this.getExecutedMigrations();
        const executedVersions = new Set(executed.map(m => m.version));

        return available.filter(migration => !executedVersions.has(migration.version));
    }

    /**
     * Validate migration dependencies
     */
    async validateDependencies(migration, executedMigrations) {
        if (!migration.dependencies || migration.dependencies.length === 0) {
            return true;
        }

        const executedVersions = new Set(executedMigrations.map(m => m.version));
        
        for (const depVersion of migration.dependencies) {
            if (!executedVersions.has(depVersion)) {
                throw new Error(`Migration ${migration.name} depends on ${depVersion} which has not been executed`);
            }
        }

        return true;
    }

    /**
     * Execute a single migration
     */
    async executeMigration(migration) {
        const startTime = Date.now();
        this.logger.info(`🔄 Executing migration: ${migration.name} (v${migration.version})`);

        if (this.dryRun) {
            this.logger.info('🧪 DRY RUN - Migration would execute but no changes will be made');
            return { success: true, dryRun: true };
        }

        try {
            // Validate dependencies
            const executedMigrations = await this.getExecutedMigrations();
            await this.validateDependencies(migration, executedMigrations);

            // Create backup point
            const backupData = await this.createBackupPoint(migration.name);

            // Execute the migration
            const rollbackData = await migration.up(this.databaseService, this);

            // Validate the migration
            const validationResult = await migration.validate(this.databaseService);
            if (!validationResult) {
                throw new Error('Migration validation failed');
            }

            const executionTime = Date.now() - startTime;

            // Record successful migration
            await this.recordMigration(migration, executionTime, true, rollbackData);

            const logEntry = {
                migration: migration.name,
                version: migration.version,
                status: 'success',
                executionTime,
                timestamp: new Date().toISOString()
            };

            this.migrationLog.push(logEntry);
            this.logger.info(`✅ Migration completed: ${migration.name} (${executionTime}ms)`);

            return { success: true, executionTime, rollbackData };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            // Record failed migration
            await this.recordMigration(migration, executionTime, false, null, error.message);

            const logEntry = {
                migration: migration.name,
                version: migration.version,
                status: 'failed',
                error: error.message,
                executionTime,
                timestamp: new Date().toISOString()
            };

            this.migrationLog.push(logEntry);
            this.logger.error(`❌ Migration failed: ${migration.name} - ${error.message}`);

            throw error;
        }
    }

    /**
     * Create a backup point before migration
     */
    async createBackupPoint(migrationName) {
        const backupId = `backup_${migrationName}_${Date.now()}`;
        
        // This is a simplified backup - in production you might want to create
        // actual database backups or more sophisticated rollback mechanisms
        const backupData = {
            id: backupId,
            migration: migrationName,
            timestamp: new Date().toISOString(),
            environment: this.environment
        };

        this.rollbackData.set(backupId, backupData);
        return backupData;
    }

    /**
     * Record migration execution in the tracking table
     */
    async recordMigration(migration, executionTime, success, rollbackData = null, errorMessage = null) {
        const record = {
            migration_name: migration.name,
            version: migration.version,
            description: migration.description || '',
            checksum: migration.checksum,
            execution_time_ms: executionTime,
            success,
            rollback_data: rollbackData ? JSON.stringify(rollbackData) : null,
            environment: this.environment,
            error_message: errorMessage
        };

        try {
            if (this.databaseService.dbType === 'postgresql') {
                await this.databaseService.query(`
                    INSERT INTO ${this.migrationTable} (
                        migration_name, version, description, checksum, 
                        execution_time_ms, success, rollback_data, environment
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    record.migration_name, record.version, record.description,
                    record.checksum, record.execution_time_ms, record.success,
                    record.rollback_data, record.environment
                ]);
            } else {
                await this.databaseService.insert(this.migrationTable, record);
            }
        } catch (error) {
            this.logger.warn('⚠️ Could not record migration in tracking table:', error.message);
        }
    }

    /**
     * Rollback a specific migration
     */
    async rollbackMigration(migrationName) {
        this.logger.info(`🔄 Rolling back migration: ${migrationName}`);

        try {
            // Get migration details from tracking table
            const executedMigrations = await this.getExecutedMigrations();
            const migrationRecord = executedMigrations.find(m => m.migration_name === migrationName);

            if (!migrationRecord) {
                throw new Error(`Migration ${migrationName} not found in execution history`);
            }

            // Find the migration file
            const migrations = await this.getAvailableMigrations();
            const migration = migrations.find(m => m.name === migrationName);

            if (!migration || !migration.down) {
                throw new Error(`Migration ${migrationName} does not have rollback support`);
            }

            // Parse rollback data
            const rollbackData = migrationRecord.rollback_data ? 
                JSON.parse(migrationRecord.rollback_data) : null;

            // Execute rollback
            await migration.down(this.databaseService, this, rollbackData);

            // Update migration record to mark as rolled back
            await this.markMigrationRolledBack(migrationName);

            this.logger.info(`✅ Migration rolled back successfully: ${migrationName}`);
            return { success: true };

        } catch (error) {
            this.logger.error(`❌ Rollback failed for ${migrationName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Mark migration as rolled back in tracking table
     */
    async markMigrationRolledBack(migrationName) {
        try {
            if (this.databaseService.dbType === 'postgresql') {
                await this.databaseService.query(`
                    UPDATE ${this.migrationTable} 
                    SET success = false, 
                        executed_at = NOW(),
                        rollback_data = jsonb_set(
                            COALESCE(rollback_data, '{}'), 
                            '{rolled_back}', 
                            'true'
                        )
                    WHERE migration_name = $1 AND environment = $2
                `, [migrationName, this.environment]);
            } else {
                await this.databaseService.update(
                    this.migrationTable,
                    { 
                        success: false,
                        rollback_data: JSON.stringify({ rolled_back: true, timestamp: new Date().toISOString() })
                    },
                    { migration_name: migrationName, environment: this.environment }
                );
            }
        } catch (error) {
            this.logger.warn('⚠️ Could not update rollback status:', error.message);
        }
    }

    /**
     * Run all pending migrations
     */
    async migrate() {
        this.logger.info(`🚀 Starting database migration process for environment: ${this.environment}`);

        try {
            const pendingMigrations = await this.getPendingMigrations();

            if (pendingMigrations.length === 0) {
                this.logger.info('✅ No pending migrations found - database is up to date');
                return { success: true, migrationsExecuted: 0, log: [] };
            }

            this.logger.info(`📋 Found ${pendingMigrations.length} pending migration(s)`);

            const results = [];
            let successCount = 0;

            for (const migration of pendingMigrations) {
                try {
                    const result = await this.executeMigration(migration);
                    results.push({ migration: migration.name, ...result });
                    successCount++;
                } catch (error) {
                    results.push({ 
                        migration: migration.name, 
                        success: false, 
                        error: error.message 
                    });
                    
                    // Stop on first failure unless configured otherwise
                    this.logger.error(`💥 Migration process stopped due to failure in: ${migration.name}`);
                    break;
                }
            }

            const success = successCount === pendingMigrations.length;
            
            this.logger.info(success ? 
                `🎉 Migration completed successfully! Executed ${successCount} migration(s)` :
                `⚠️ Migration partially completed: ${successCount}/${pendingMigrations.length} successful`
            );

            return {
                success,
                migrationsExecuted: successCount,
                totalMigrations: pendingMigrations.length,
                results,
                log: this.migrationLog
            };

        } catch (error) {
            this.logger.error(`❌ Migration process failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get migration status and summary
     */
    async getStatus() {
        try {
            const available = await this.getAvailableMigrations();
            const executed = await this.getExecutedMigrations();
            const pending = await this.getPendingMigrations();

            return {
                environment: this.environment,
                dryRun: this.dryRun,
                migrationsPath: this.migrationsPath,
                totalMigrations: available.length,
                executedCount: executed.length,
                pendingCount: pending.length,
                lastMigration: executed.length > 0 ? executed[executed.length - 1] : null,
                pendingMigrations: pending.map(m => ({ name: m.name, version: m.version })),
                status: pending.length === 0 ? 'up-to-date' : 'pending-migrations'
            };
        } catch (error) {
            this.logger.error('❌ Could not get migration status:', error.message);
            return {
                environment: this.environment,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * Get detailed migration log
     */
    getMigrationLog() {
        return {
            environment: this.environment,
            timestamp: new Date().toISOString(),
            log: this.migrationLog
        };
    }
}

module.exports = DatabaseMigrationAgent;
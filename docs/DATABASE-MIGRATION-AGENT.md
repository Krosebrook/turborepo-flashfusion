# Database Migration Agent

The Database Migration Agent is responsible for applying schema and data migrations in the correct order across environments, ensuring the database schema matches the codebase at each deploy.

## Features

- **Automated Migration Execution**: Runs migrations in dependency order
- **Environment-Specific Migrations**: Supports different environments (development, staging, production)
- **Rollback Capabilities**: Provides safe rollback functionality with backup data
- **Migration Validation**: Validates successful migration execution
- **Dependency Resolution**: Ensures migrations run in the correct order based on dependencies
- **Dry Run Mode**: Preview migrations without executing them
- **Comprehensive Logging**: Tracks migration success/failure with detailed logs

## Quick Start

### Generate a New Migration

```bash
ff db generate create_user_profiles "Add user profile management tables"
```

### Check Migration Status

```bash
ff db status
```

### Run Migrations

```bash
# Preview what will be executed
ff db migrate --dry-run

# Execute all pending migrations
ff db migrate
```

### Rollback a Migration

```bash
ff db rollback create_user_profiles
```

## CLI Commands

### Migration Operations

- `ff db migrate` - Run all pending migrations
- `ff db migrate --dry-run` - Preview migrations without executing
- `ff db status` - Show current migration status
- `ff db generate <name> [description]` - Generate new migration file
- `ff db rollback <name>` - Rollback specific migration

### Options

- `--dry-run` - Preview changes without executing
- `--env=<environment>` - Specify environment (default: development)

## Migration File Structure

Each migration file follows this structure:

```javascript
module.exports = {
    version: '20250917102200',
    name: 'migration_name',
    description: 'Description of what this migration does',
    dependencies: ['20250915100000'], // Array of migration versions this depends on

    async up(databaseService, migrationAgent) {
        // Schema/data changes go here
        await databaseService.query(`
            CREATE TABLE example_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        `);
        
        // Return rollback data for safe rollbacks
        return {
            tables_created: ['example_table'],
            rollback_instructions: 'DROP TABLE IF EXISTS example_table;'
        };
    },

    async down(databaseService, migrationAgent, rollbackData) {
        // Rollback logic
        if (rollbackData?.rollback_instructions) {
            await databaseService.query(rollbackData.rollback_instructions);
        }
    },

    async validate(databaseService) {
        // Validation logic to ensure migration was successful
        const result = await databaseService.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'example_table'
            );
        `);
        return result.rows[0].exists;
    }
};
```

## Migration Tracking

The agent maintains a `migration_history` table to track:

- Migration name and version
- Execution timestamp
- Success/failure status
- Execution time
- Rollback data
- Environment information
- Checksum for integrity validation

## Environment Configuration

Set your environment with:

```bash
export NODE_ENV=development  # or staging, production
```

The migration agent will:
- Use environment-specific database connections
- Track migrations separately per environment
- Apply environment-specific validation rules

## Best Practices

### Migration Design

1. **Make migrations idempotent** - Use `IF NOT EXISTS` and similar constructs
2. **Include rollback logic** - Always provide a way to undo changes
3. **Test migrations** - Run with `--dry-run` first
4. **Use dependencies** - Ensure migrations run in correct order

### Schema Changes

1. **Additive changes** - Add columns/tables rather than modifying existing ones
2. **Backward compatibility** - Ensure changes don't break existing code
3. **Index management** - Add indexes for performance, remove unused ones
4. **Data validation** - Validate data integrity after structural changes

### Deployment Workflow

1. **Development** - Create and test migrations locally
2. **Staging** - Run migrations in staging environment
3. **Production** - Apply validated migrations to production
4. **Monitoring** - Check migration logs and application health

## Error Handling

The migration agent includes comprehensive error handling:

- **Pre-migration validation** - Checks dependencies and prerequisites
- **Execution monitoring** - Tracks execution time and success
- **Automatic rollback** - On failure, attempts to rollback changes
- **Error logging** - Detailed error messages and context
- **Recovery procedures** - Guidance for manual intervention when needed

## Integration with Existing Systems

The Database Migration Agent integrates with:

- **UnifiedDatabaseService** - Uses existing database connections
- **ff CLI** - Provides command-line interface
- **Existing schemas** - Works with current database structure
- **Error handling** - Uses existing error handling patterns

## Monitoring and Logs

Migration logs include:

- Migration execution status
- Execution time metrics
- Error details and stack traces
- Rollback information
- Environment and context data

Access logs via:

```bash
ff db status  # Current status and recent migrations
```

## Security Considerations

- **Database permissions** - Ensure proper database user permissions
- **Environment isolation** - Keep environments separate
- **Backup procedures** - Maintain regular database backups
- **Access control** - Limit migration execution to authorized users
- **Audit trail** - All migration activities are logged

## Troubleshooting

### Common Issues

1. **Migration fails** - Check error logs, verify database permissions
2. **Dependency errors** - Ensure required migrations have been run
3. **Rollback issues** - Verify rollback data integrity
4. **Environment mismatch** - Check NODE_ENV and database configuration

### Recovery Procedures

1. **Failed migration** - Check logs, fix issues, re-run migration
2. **Corrupted state** - Use rollback, restore from backup if needed
3. **Missing dependencies** - Run missing migrations first
4. **Database connectivity** - Verify database service and credentials

## Examples

### Create User Management Migration

```bash
ff db generate user_management "Add user authentication and profile tables"
```

### Migration with Dependencies

```javascript
module.exports = {
    version: '20250917120000',
    name: 'add_user_preferences',
    description: 'Add user preferences table',
    dependencies: ['20250917102200'], // Depends on initial schema

    async up(databaseService, migrationAgent) {
        await databaseService.query(`
            CREATE TABLE user_preferences (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                preferences JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        
        return {
            tables_created: ['user_preferences'],
            rollback_instructions: 'DROP TABLE IF EXISTS user_preferences;'
        };
    },

    async down(databaseService, migrationAgent, rollbackData) {
        await databaseService.query(rollbackData.rollback_instructions);
    },

    async validate(databaseService) {
        const result = await databaseService.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'user_preferences'
        `);
        return result.rows[0].count > 0;
    }
};
```

This Database Migration Agent ensures reliable, trackable, and rollback-safe database schema management across all environments in the FlashFusion monorepo.
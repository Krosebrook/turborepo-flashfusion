import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TestDatabase } from '../types';

export interface TestDatabaseOptions {
  type: 'postgresql' | 'supabase' | 'mock';
  connectionString?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export class TestDatabaseManager {
  private db: TestDatabase;
  private pgPool?: Pool;
  private supabase?: SupabaseClient;

  constructor(options: TestDatabaseOptions) {
    this.db = {
      type: options.type,
      connectionString: options.connectionString,
      isConnected: false
    };
  }

  async connect(): Promise<void> {
    switch (this.db.type) {
      case 'postgresql':
        if (!this.db.connectionString) {
          throw new Error('PostgreSQL connection string is required');
        }
        this.pgPool = new Pool({ connectionString: this.db.connectionString });
        await this.pgPool.connect();
        this.db.isConnected = true;
        this.db.pool = this.pgPool;
        break;

      case 'supabase':
        // For testing, we'll use a mock Supabase client
        this.supabase = createClient(
          process.env.SUPABASE_URL || 'https://test.supabase.co',
          process.env.SUPABASE_ANON_KEY || 'test-key'
        );
        this.db.isConnected = true;
        break;

      case 'mock':
        // Mock database - always connected
        this.db.isConnected = true;
        this.db.pool = {
          query: async (sql: string, params?: any[]) => ({
            rows: [],
            rowCount: 0
          })
        };
        break;

      default:
        throw new Error(`Unsupported database type: ${this.db.type}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    this.db.isConnected = false;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.db.isConnected) {
      throw new Error('Database not connected');
    }

    switch (this.db.type) {
      case 'postgresql':
        if (!this.pgPool) {
          throw new Error('PostgreSQL pool not initialized');
        }
        return await this.pgPool.query(sql, params);

      case 'supabase':
        // Mock Supabase query for testing
        return { data: [], error: null };

      case 'mock':
        return { rows: [], rowCount: 0 };

      default:
        throw new Error(`Query not supported for database type: ${this.db.type}`);
    }
  }

  getDatabase(): TestDatabase {
    return this.db;
  }

  getClient() {
    if (this.db.type === 'postgresql') {
      return this.pgPool;
    } else if (this.db.type === 'supabase') {
      return this.supabase;
    }
    return this.db.pool;
  }
}

export function createTestDatabase(options: TestDatabaseOptions): TestDatabaseManager {
  return new TestDatabaseManager(options);
}
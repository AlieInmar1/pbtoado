import { SupabaseDatabaseProvider } from './supabase';
import type { DatabaseProvider } from './types';
import type { DatabaseConfig } from './types/config';

/**
 * Factory class for creating database providers
 */
export class DatabaseProviderFactory {
  /**
   * Create a database provider based on the configuration
   * @param config The database provider configuration
   * @returns A database provider instance
   */
  static create(config: DatabaseConfig): DatabaseProvider {
    switch (config.type) {
      case 'supabase':
        return new SupabaseDatabaseProvider(
          config.connection.url,
          config.connection.key
        );
      
      case 'postgres':
        // TODO: Implement PostgreSQL provider
        throw new Error('PostgreSQL provider not implemented yet');
      
      case 'mongodb':
        // TODO: Implement MongoDB provider
        throw new Error('MongoDB provider not implemented yet');
      
      case 'mock':
        // TODO: Implement mock provider
        throw new Error('Mock provider not implemented yet');
      
      default:
        throw new Error(`Unknown database provider type: ${(config as any).type}`);
    }
  }

  /**
   * Get the default configuration for a provider type
   * @param type The database provider type
   * @returns The default configuration for the provider
   */
  static getDefaultConfig(type: DatabaseConfig['type']): DatabaseConfig {
    switch (type) {
      case 'supabase':
        return {
          type: 'supabase',
          connection: {
            url: import.meta.env.VITE_SUPABASE_URL || '',
            key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            options: {
              useServiceRole: false,
            },
          },
          schemaVersion: '1.0.0',
          debug: false,
        };
      
      case 'postgres':
        return {
          type: 'postgres',
          connection: {
            url: 'postgresql://localhost:5432',
            key: '',
            options: {
              database: 'pbtoado',
              user: 'postgres',
              ssl: false,
            },
          },
          schemaVersion: '1.0.0',
          debug: false,
        };
      
      case 'mongodb':
        return {
          type: 'mongodb',
          connection: {
            url: 'mongodb://localhost:27017',
            key: '',
            options: {
              database: 'pbtoado',
            },
          },
          schemaVersion: '1.0.0',
          debug: false,
        };
      
      case 'mock':
        return {
          type: 'mock',
          connection: {
            url: 'memory://',
            key: 'mock-key',
            options: {
              seedData: true,
              simulateLatency: false,
              simulateErrors: false,
            },
          },
          schemaVersion: '1.0.0',
          debug: true,
        };
      
      default:
        throw new Error(`Unknown database provider type: ${type}`);
    }
  }
}

/**
 * Configuration interface for database providers
 */
export interface DatabaseProviderConfig {
  /**
   * The type of database provider
   */
  type: 'supabase' | 'postgres' | 'mongodb' | 'mock';
  
  /**
   * Connection details for the database
   */
  connection: {
    /**
     * The URL of the database
     */
    url: string;
    
    /**
     * The API key or password for the database
     */
    key: string;
    
    /**
     * Additional connection options
     */
    options?: Record<string, any>;
  };
  
  /**
   * Schema version for migration tracking
   */
  schemaVersion?: string;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * Configuration for the Supabase database provider
 */
export interface SupabaseDatabaseConfig extends DatabaseProviderConfig {
  type: 'supabase';
  connection: {
    url: string;
    key: string;
    options?: {
      /**
       * Whether to use the service role key instead of the anon key
       */
      useServiceRole?: boolean;
    };
  };
}

/**
 * Configuration for the PostgreSQL database provider
 */
export interface PostgresDatabaseConfig extends DatabaseProviderConfig {
  type: 'postgres';
  connection: {
    url: string;
    key: string;
    options?: {
      /**
       * The database name
       */
      database?: string;
      
      /**
       * The database user
       */
      user?: string;
      
      /**
       * SSL configuration
       */
      ssl?: boolean | Record<string, any>;
    };
  };
}

/**
 * Configuration for the MongoDB database provider
 */
export interface MongoDBDatabaseConfig extends DatabaseProviderConfig {
  type: 'mongodb';
  connection: {
    url: string;
    key: string;
    options?: {
      /**
       * The database name
       */
      database?: string;
      
      /**
       * Authentication options
       */
      auth?: {
        username?: string;
        password?: string;
      };
    };
  };
}

/**
 * Configuration for the mock database provider (for testing)
 */
export interface MockDatabaseConfig extends DatabaseProviderConfig {
  type: 'mock';
  connection: {
    url: string;
    key: string;
    options?: {
      /**
       * Whether to seed the database with test data
       */
      seedData?: boolean;
      
      /**
       * Whether to simulate network latency
       */
      simulateLatency?: boolean;
      
      /**
       * Whether to simulate errors
       */
      simulateErrors?: boolean;
    };
  };
}

/**
 * Union type of all database provider configurations
 */
export type DatabaseConfig = 
  | SupabaseDatabaseConfig
  | PostgresDatabaseConfig
  | MongoDBDatabaseConfig
  | MockDatabaseConfig;

// Script to directly apply the system_config table migration
// Run with: node scripts/apply-system-config-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key are required.');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applySystemConfigMigration() {
  console.log('Applying system_config migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0020_create_system_config_table.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the SQL directly against the database
    const { error } = await supabase.rpc('pgtle.install_extension', {
      name: 'system_config_migration',
      version: '1.0',
      ext: migrationSql
    });

    if (error) {
      // If the RPC method fails, try direct query as fallback
      console.log('Direct extension installation not available, attempting plain SQL execution...');
      
      // Split the SQL into statements (simplistic approach)
      const statements = migrationSql.split(';').filter(stmt => stmt.trim());
      
      // Execute each statement separately
      for (const stmt of statements) {
        if (stmt.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          if (error) {
            // Last resort - just log that manual execution is needed
            console.error('Could not execute SQL automatically. Please run the migration manually through Supabase dashboard');
            console.error('Migration error:', error);
            
            console.log('\nCopy the SQL below and execute it in the Supabase SQL Editor:\n');
            console.log(migrationSql);
            return;
          }
        }
      }
    }

    console.log('Migration applied successfully!');
    console.log('The system_config table has been created.');
    console.log('\nYou can now use the UI at /admin/system-config to manage configuration values.');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    
    console.log('\nPlease apply the migration manually through the Supabase dashboard SQL Editor:');
    console.log('1. Go to https://app.supabase.io/project/_/sql');
    console.log('2. Copy and paste the contents of: supabase/migrations/0020_create_system_config_table.sql');
    console.log('3. Run the SQL');
  }
}

// Run the migration
applySystemConfigMigration()
  .catch(console.error)
  .finally(() => {
    setTimeout(() => process.exit(0), 1000);
  });

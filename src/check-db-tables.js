// Script to check if the required database tables exist and have data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  console.log(`\nChecking table: ${tableName}`);
  
  try {
    // Check if table exists by trying to count rows
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error(`Error checking table ${tableName}:`, countError);
      console.error('Error code:', countError.code);
      console.error('Error message:', countError.message);
      console.error('Error details:', countError.details);
      return false;
    }
    
    console.log(`Table ${tableName} exists with ${count} rows`);
    
    // If table has data, fetch a sample row
    if (count > 0) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`Error fetching sample from ${tableName}:`, error);
      } else {
        console.log(`Sample data from ${tableName}:`, data[0]);
      }
    } else {
      console.log(`Table ${tableName} is empty`);
    }
    
    return true;
  } catch (err) {
    console.error(`Exception checking table ${tableName}:`, err);
    return false;
  }
}

async function checkRLS(tableName) {
  console.log(`\nChecking RLS policies for table: ${tableName}`);
  
  try {
    // This is a custom function that needs to be created in your database
    // If it doesn't exist, this will fail
    const { data, error } = await supabase
      .rpc('get_rls_policies', { table_name: tableName });
      
    if (error) {
      console.error(`Error checking RLS policies for ${tableName}:`, error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`RLS policies for ${tableName}:`, data);
    } else {
      console.log(`No RLS policies found for ${tableName}`);
    }
  } catch (err) {
    console.error(`Exception checking RLS for ${tableName}:`, err);
  }
}

async function main() {
  console.log('Checking database tables...');
  console.log('Supabase URL:', supabaseUrl);
  
  // Check connection
  const { data: connectionTest, error: connectionError } = await supabase.from('productboard_features').select('count(*)', { count: 'exact', head: true });
  
  if (connectionError) {
    console.error('Connection test failed:', connectionError);
    console.log('Checking if the database is accessible...');
    
    // Try to get the server version to check if the database is accessible
    const { data: versionData, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('Database version check failed:', versionError);
      console.error('Database connection issues detected. Please check your credentials and network connection.');
    } else {
      console.log('Database is accessible, version:', versionData);
      console.log('The issue might be with table permissions or RLS policies.');
    }
  } else {
    console.log('Connection test successful!');
  }
  
  // Check tables
  const tables = [
    'productboard_features',
    'productboard_components',
    'workspaces',
    'workspace_users',
    'story_templates'
  ];
  
  for (const table of tables) {
    const exists = await checkTable(table);
    if (exists) {
      await checkRLS(table);
    }
  }
  
  // Check if the current user has the necessary permissions
  console.log('\nChecking current user and permissions...');
  const { data: user, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('Error getting current user:', userError);
  } else if (user) {
    console.log('Current user:', user);
    
    // Check user's workspace access
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspace_users')
      .select('workspace_id')
      .eq('user_id', user.id);
      
    if (workspacesError) {
      console.error('Error checking user workspaces:', workspacesError);
    } else {
      console.log('User has access to workspaces:', workspaces);
    }
  }
  
  console.log('\nDatabase check complete');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

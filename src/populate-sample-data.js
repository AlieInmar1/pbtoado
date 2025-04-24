// Script to populate the database with sample data for testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Using service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data
const workspace = {
  id: uuidv4(),
  name: 'Test Workspace',
  description: 'A workspace for testing',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const components = [
  {
    productboard_id: 'comp-1',
    name: 'Frontend',
    description: 'Frontend components',
    parent_id: null,
    business_unit: 'Engineering',
    product_code: 'FE',
    workspace_id: workspace.id,
    metadata: { status: 'active' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    productboard_id: 'comp-2',
    name: 'Backend',
    description: 'Backend services',
    parent_id: null,
    business_unit: 'Engineering',
    product_code: 'BE',
    workspace_id: workspace.id,
    metadata: { status: 'active' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    productboard_id: 'comp-3',
    name: 'Mobile',
    description: 'Mobile applications',
    parent_id: null,
    business_unit: 'Engineering',
    product_code: 'MOB',
    workspace_id: workspace.id,
    metadata: { status: 'active' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const features = [
  {
    productboard_id: 'feat-1',
    name: 'User Authentication',
    description: 'User authentication system',
    status: 'in_progress',
    type: 'feature',
    feature_type: 'functional',
    parent_id: 'comp-1', // Parent is Frontend component
    metadata: { parent_type: 'component', priority: 'high' },
    workspace_id: workspace.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    productboard_id: 'feat-2',
    name: 'Dashboard',
    description: 'User dashboard',
    status: 'planned',
    type: 'feature',
    feature_type: 'functional',
    parent_id: 'comp-1', // Parent is Frontend component
    metadata: { parent_type: 'component', priority: 'medium' },
    workspace_id: workspace.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    productboard_id: 'feat-3',
    name: 'API Integration',
    description: 'External API integration',
    status: 'completed',
    type: 'feature',
    feature_type: 'functional',
    parent_id: 'comp-2', // Parent is Backend component
    metadata: { parent_type: 'component', priority: 'high' },
    workspace_id: workspace.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    productboard_id: 'subfeat-1',
    name: 'Login Form',
    description: 'User login form',
    status: 'in_progress',
    type: 'sub-feature',
    feature_type: 'functional',
    parent_id: 'feat-1', // Parent is User Authentication feature
    metadata: { parent_type: 'feature', priority: 'high' },
    workspace_id: workspace.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Function to insert data
async function insertData() {
  console.log('Inserting sample data...');
  
  // Insert workspace
  console.log('Inserting workspace...');
  const { data: workspaceData, error: workspaceError } = await supabase
    .from('workspaces')
    .insert(workspace)
    .select();
    
  if (workspaceError) {
    console.error('Error inserting workspace:', workspaceError);
    return false;
  }
  
  console.log('Workspace inserted:', workspaceData);
  
  // Insert components
  console.log('Inserting components...');
  const { data: componentsData, error: componentsError } = await supabase
    .from('productboard_components')
    .insert(components)
    .select();
    
  if (componentsError) {
    console.error('Error inserting components:', componentsError);
    return false;
  }
  
  console.log('Components inserted:', componentsData);
  
  // Insert features
  console.log('Inserting features...');
  const { data: featuresData, error: featuresError } = await supabase
    .from('productboard_features')
    .insert(features)
    .select();
    
  if (featuresError) {
    console.error('Error inserting features:', featuresError);
    return false;
  }
  
  console.log('Features inserted:', featuresData);
  
  return true;
}

// Function to check if data already exists
async function checkExistingData() {
  console.log('Checking for existing data...');
  
  // Check workspaces
  const { count: workspaceCount, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true });
    
  if (workspaceError) {
    console.error('Error checking workspaces:', workspaceError);
    return false;
  }
  
  // Check components
  const { count: componentCount, error: componentError } = await supabase
    .from('productboard_components')
    .select('*', { count: 'exact', head: true });
    
  if (componentError) {
    console.error('Error checking components:', componentError);
    return false;
  }
  
  // Check features
  const { count: featureCount, error: featureError } = await supabase
    .from('productboard_features')
    .select('*', { count: 'exact', head: true });
    
  if (featureError) {
    console.error('Error checking features:', featureError);
    return false;
  }
  
  console.log('Existing data counts:');
  console.log('- Workspaces:', workspaceCount);
  console.log('- Components:', componentCount);
  console.log('- Features:', featureCount);
  
  return {
    hasWorkspaces: workspaceCount > 0,
    hasComponents: componentCount > 0,
    hasFeatures: featureCount > 0
  };
}

// Main function
async function main() {
  console.log('Starting sample data population...');
  
  // Check if data already exists
  const existingData = await checkExistingData();
  
  if (existingData.hasWorkspaces && existingData.hasComponents && existingData.hasFeatures) {
    console.log('Data already exists in the database. Skipping insertion.');
    return;
  }
  
  // Insert data
  const success = await insertData();
  
  if (success) {
    console.log('Sample data inserted successfully!');
  } else {
    console.error('Failed to insert sample data.');
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

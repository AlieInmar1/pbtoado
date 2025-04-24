// Seed script to add initial configuration values to the system_config table

import { supabase } from './lib/supabase';

// This script adds essential configuration values to the system_config table
// Run with: node src/seed-config.js

async function seedConfig() {
  console.log('Seeding system configuration...');

  // Get ProductBoard API token from environment if available
  const pbToken = process.env.VITE_PRODUCTBOARD_API_TOKEN || '';
  
  if (!pbToken) {
    console.warn('WARNING: VITE_PRODUCTBOARD_API_TOKEN not found in environment variables.');
    console.warn('You will need to add it manually in the System Configuration UI.');
  }

  // Add ProductBoard API token
  const { error: pbError } = await supabase
    .from('system_config')
    .upsert({
      key: 'productboard_api_token',
      value: pbToken,
      description: 'API token for ProductBoard integration',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
  
  if (pbError) {
    console.error('Error adding ProductBoard API token:', pbError);
  } else {
    console.log('Added/updated ProductBoard API token configuration');
  }
  
  // Add Azure DevOps token (if available)
  const adoToken = process.env.VITE_AZURE_DEVOPS_TOKEN || '';
  
  if (adoToken) {
    const { error: adoError } = await supabase
      .from('system_config')
      .upsert({
        key: 'azure_devops_token',
        value: adoToken,
        description: 'Personal access token for Azure DevOps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (adoError) {
      console.error('Error adding Azure DevOps token:', adoError);
    } else {
      console.log('Added/updated Azure DevOps token configuration');
    }
  }
  
  // Add Azure DevOps organization
  const adoOrg = process.env.VITE_AZURE_DEVOPS_ORG || '';
  
  if (adoOrg) {
    const { error: adoOrgError } = await supabase
      .from('system_config')
      .upsert({
        key: 'azure_devops_organization',
        value: adoOrg,
        description: 'Azure DevOps organization name',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (adoOrgError) {
      console.error('Error adding Azure DevOps organization:', adoOrgError);
    } else {
      console.log('Added/updated Azure DevOps organization configuration');
    }
  }
  
  // Add Azure DevOps project
  const adoProject = process.env.VITE_AZURE_DEVOPS_PROJECT || '';
  
  if (adoProject) {
    const { error: adoProjectError } = await supabase
      .from('system_config')
      .upsert({
        key: 'azure_devops_project',
        value: adoProject,
        description: 'Azure DevOps project name',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (adoProjectError) {
      console.error('Error adding Azure DevOps project:', adoProjectError);
    } else {
      console.log('Added/updated Azure DevOps project configuration');
    }
  }

  console.log('System configuration seeding completed.');
  console.log('You can now add or update these values through the Admin UI at /admin/system-config');
}

// Run the seed function
seedConfig()
  .catch(error => {
    console.error('Error seeding configuration:', error);
  })
  .finally(() => {
    // Disconnect from Supabase client
    supabase.removeAllSubscriptions();
    // Exit process after a short delay to ensure all operations complete
    setTimeout(() => process.exit(0), 500);
  });

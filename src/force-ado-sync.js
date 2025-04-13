import { syncAllData } from './lib/api/azureDevOpsWithCacheProxy.js';
import { supabase } from './lib/supabase.js';

/**
 * This script forces a full sync of Azure DevOps data to update the database with our new mapping function.
 */
async function forceSync() {
  try {
    console.log('Starting forced full sync of Azure DevOps data...');
    
    // Get Azure DevOps credentials from environment variables
    const organization = process.env.VITE_AZURE_DEVOPS_ORG;
    const project = process.env.VITE_AZURE_DEVOPS_PROJECT;
    const apiKey = process.env.VITE_AZURE_DEVOPS_TOKEN;
    
    if (!organization || !project || !apiKey) {
      console.error('Missing Azure DevOps credentials in environment variables.');
      console.error('Please ensure VITE_AZURE_DEVOPS_ORG, VITE_AZURE_DEVOPS_PROJECT, and VITE_AZURE_DEVOPS_TOKEN are set.');
      return;
    }
    
    // Force a full sync (true = force full sync)
    const result = await syncAllData(organization, project, apiKey, true);
    
    if (result.success) {
      console.log('Sync completed successfully!');
      console.log(result.message);
    } else {
      console.error('Sync failed:');
      console.error(result.message);
    }
  } catch (error) {
    console.error('Error during forced sync:', error);
  } finally {
    // Close the Supabase connection
    await supabase.auth.signOut();
  }
}

// Run the sync
forceSync();

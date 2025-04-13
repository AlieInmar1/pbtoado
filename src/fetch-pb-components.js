/**
 * Script to fetch ProductBoard components and store them in the database
 * This script uses the pb-connect module to fetch components from ProductBoard
 * and store them in the Supabase database.
 */

const pbConnect = require('../core/pb-connect');
const { api, transformer, db } = pbConnect;

/**
 * Main function to fetch and store ProductBoard components
 */
async function fetchAndStoreComponents() {
  try {
    console.log('Starting component fetch from ProductBoard...');
    
    // Get workspace ID from environment variable
    const workspaceId = process.env.PRODUCTBOARD_WORKSPACE_ID || null;
    
    // Fetch components from ProductBoard
    console.log('Fetching components from ProductBoard API...');
    const components = await api.fetchComponents();
    console.log(`Fetched ${components.length} components from ProductBoard`);
    
    // Transform components for database insertion
    console.log('Transforming components for database insertion...');
    const transformedComponents = transformer.batchTransform(
      components,
      transformer.transformComponentForDb,
      workspaceId
    );
    
    // Store components in database
    console.log(`Storing ${transformedComponents.length} components in database...`);
    const result = await db.batchUpsert(transformedComponents, db.upsertComponents);
    
    // Log results
    console.log('Component storage complete');
    console.log(`Total components: ${result.length}`);
    
    if (result.statsArray) {
      const stats = {
        inserted: 0,
        updated: 0,
        unchanged: 0,
        errors: 0
      };
      
      result.statsArray.forEach(stat => {
        if (stat.inserted) stats.inserted += stat.inserted;
        if (stat.updated) stats.updated += stat.updated;
        if (stat.unchanged) stats.unchanged += stat.unchanged;
        if (stat.errors) stats.errors += stat.errors;
      });
      
      console.log(`Inserted: ${stats.inserted}`);
      console.log(`Updated: ${stats.updated}`);
      console.log(`Unchanged: ${stats.unchanged}`);
      console.log(`Errors: ${stats.errors}`);
    }
    
    console.log('Component fetch and store completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error fetching and storing components:', error.message);
    return { success: false, error: error.message };
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  fetchAndStoreComponents()
    .then(result => {
      if (result.success) {
        console.log('Script completed successfully');
        process.exit(0);
      } else {
        console.error('Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { fetchAndStoreComponents };

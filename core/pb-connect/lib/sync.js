/**
 * Sync module for coordinating ProductBoard data import
 * Fetches data from ProductBoard and stores it in Supabase
 */

const api = require('./api');
const transformer = require('./transformer');
const db = require('./db');
require('dotenv').config();

/**
 * Main sync function to fetch and store ProductBoard data
 * @param {string} workspaceId - Workspace ID (optional, defaults to env var)
 * @param {string} boardId - Board ID (required)
 * @param {Object} options - Additional options
 * @param {boolean} options.reset - Whether to clear all tables before syncing
 * @param {Array<string>} options.resetTables - Tables to clear before syncing
 * @returns {Object} - Sync results
 */
async function syncProductBoardData(workspaceId, boardId, options = {}) {
  // Use environment workspace ID if not provided
  const workspace = workspaceId || process.env.PRODUCTBOARD_WORKSPACE_ID || null;
  
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  
  db.logSyncActivity(`Starting ProductBoard sync for workspace ${workspace}, board ${boardId}`);
  
  // Stats object to track counts
  const stats = {
    features_count: 0,
    initiatives_count: 0,
    objectives_count: 0,
    components_count: 0
  };
  
  try {
    // Handle table clearing if requested
    if (options.reset) {
      const baseTables = [
        'productboard_initiatives', 
        'productboard_objectives', 
        'productboard_features',
        'productboard_components'
      ];
      
      db.logSyncActivity('Clearing all base tables before sync');
      for (const table of baseTables) {
        await db.clearTable(table);
      }
    } else if (options.resetTables && options.resetTables.length > 0) {
      // Clear only the specified tables
      db.logSyncActivity(`Clearing specified tables: ${options.resetTables.join(', ')}`);
      for (const table of options.resetTables) {
        await db.clearTable(table);
      }
    }
    
    // Create object to track detailed stats
    const detailedStats = {
      initiatives: { inserted: 0, updated: 0, unchanged: 0 },
      objectives: { inserted: 0, updated: 0, unchanged: 0 },
      features: { inserted: 0, updated: 0, unchanged: 0 },
      components: { inserted: 0, updated: 0, unchanged: 0 }
    };
    
    // Fetch and store initiatives
    db.logSyncActivity('Fetching initiatives from ProductBoard');
    const initiatives = await api.fetchInitiatives();
    stats.initiatives_count = initiatives.length;
    
    db.logSyncActivity('Transforming initiatives for database insertion');
    const transformedInitiatives = transformer.batchTransform(
      initiatives, 
      transformer.transformInitiativeForDb, 
      workspace
    );
    
    db.logSyncActivity(`Storing ${initiatives.length} initiatives in database`);
    const initiativeResult = await db.batchUpsert(transformedInitiatives, db.upsertInitiatives);
    
    // Track initiative stats
    if (initiativeResult && initiativeResult.statsArray) {
      initiativeResult.statsArray.forEach(stat => {
        if (stat.inserted) detailedStats.initiatives.inserted += stat.inserted;
        if (stat.updated) detailedStats.initiatives.updated += stat.updated;
        if (stat.unchanged) detailedStats.initiatives.unchanged += stat.unchanged;
      });
    }
    
    db.logSyncActivity('Initiative storage complete', { 
      total: stats.initiatives_count,
      processed: initiativeResult.length,
      inserted: detailedStats.initiatives.inserted,
      updated: detailedStats.initiatives.updated,
      unchanged: detailedStats.initiatives.unchanged
    });
    
    // Fetch and store objectives
    db.logSyncActivity('Fetching objectives from ProductBoard');
    const objectives = await api.fetchObjectives();
    stats.objectives_count = objectives.length;
    
    db.logSyncActivity('Transforming objectives for database insertion');
    const transformedObjectives = transformer.batchTransform(
      objectives, 
      transformer.transformObjectiveForDb, 
      workspace
    );
    
    db.logSyncActivity(`Storing ${objectives.length} objectives in database`);
    const objectiveResult = await db.batchUpsert(transformedObjectives, db.upsertObjectives);
    
    // Track objective stats
    if (objectiveResult && objectiveResult.statsArray) {
      objectiveResult.statsArray.forEach(stat => {
        if (stat.inserted) detailedStats.objectives.inserted += stat.inserted;
        if (stat.updated) detailedStats.objectives.updated += stat.updated;
        if (stat.unchanged) detailedStats.objectives.unchanged += stat.unchanged;
      });
    }
    
    db.logSyncActivity('Objective storage complete', { 
      total: stats.objectives_count,
      processed: objectiveResult.length,
      inserted: detailedStats.objectives.inserted,
      updated: detailedStats.objectives.updated,
      unchanged: detailedStats.objectives.unchanged
    });
    
    // Fetch and store features
    db.logSyncActivity('Fetching features from ProductBoard');
    const features = await api.fetchFeatures();
    stats.features_count = features.length;
    
    db.logSyncActivity('Transforming features for database insertion');
    const transformedFeatures = transformer.batchTransform(
      features, 
      transformer.transformFeatureForDb, 
      workspace
    );
    
    db.logSyncActivity(`Storing ${features.length} features in database`);
    const featureResult = await db.batchUpsert(transformedFeatures, db.upsertFeatures);
    
    // Track feature stats
    if (featureResult && featureResult.statsArray) {
      featureResult.statsArray.forEach(stat => {
        if (stat.inserted) detailedStats.features.inserted += stat.inserted;
        if (stat.updated) detailedStats.features.updated += stat.updated;
        if (stat.unchanged) detailedStats.features.unchanged += stat.unchanged;
      });
    }
    
    db.logSyncActivity('Feature storage complete', { 
      total: stats.features_count,
      processed: featureResult.length,
      inserted: detailedStats.features.inserted,
      updated: detailedStats.features.updated,
      unchanged: detailedStats.features.unchanged
    });
    
    // Fetch and store components
    db.logSyncActivity('Fetching components from ProductBoard');
    const components = await api.fetchComponents();
    stats.components_count = components.length;
    
    db.logSyncActivity('Transforming components for database insertion');
    const transformedComponents = transformer.batchTransform(
      components, 
      transformer.transformComponentForDb, 
      workspace
    );
    
    db.logSyncActivity(`Storing ${components.length} components in database`);
    const componentResult = await db.batchUpsert(transformedComponents, db.upsertComponents);
    
    // Track component stats
    if (componentResult && componentResult.statsArray) {
      componentResult.statsArray.forEach(stat => {
        if (stat.inserted) detailedStats.components.inserted += stat.inserted;
        if (stat.updated) detailedStats.components.updated += stat.updated;
        if (stat.unchanged) detailedStats.components.unchanged += stat.unchanged;
      });
    }
    
    db.logSyncActivity('Component storage complete', { 
      total: stats.components_count,
      processed: componentResult.length,
      inserted: detailedStats.components.inserted,
      updated: detailedStats.components.updated,
      unchanged: detailedStats.components.unchanged
    });
    
    // Log completion and stats
    db.logSyncActivity('ProductBoard sync completed successfully', stats);
    
    return {
      success: true,
      message: 'Sync completed successfully',
      stats: stats,
      detailedStats: detailedStats
    };
  } catch (error) {
    console.error('Error during ProductBoard sync:', error.message);
    
    // Log error
    db.logSyncActivity('ProductBoard sync failed', {
      error: error.message,
      stats: stats  // Include any stats collected before the error
    });
    
    return {
      success: false,
      message: 'Sync failed',
      error: error.message
    };
  }
}

module.exports = {
  syncProductBoardData
};

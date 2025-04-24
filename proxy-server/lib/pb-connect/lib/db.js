/**
 * Database module for Supabase interactions
 * Handles inserting and updating data in the database
 * Includes change detection to avoid unnecessary updates
 */

// Load environment variables first, before any other imports
require('./env-loader');
const { createClient } = require('@supabase/supabase-js');

// Validate Supabase environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error(`SUPABASE_URL: ${SUPABASE_URL ? 'Present ✓' : 'Missing ✗'}`);
  console.error(`SUPABASE_KEY: ${SUPABASE_KEY ? 'Present ✓' : 'Missing ✗'}`);
  
  // Only throw in non-test environments to allow partial functionality
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
    throw new Error('Missing Supabase credentials');
  }
}

// Initialize Supabase client with validated variables
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Log sync activity 
 * Note: This is a simplified replacement for the previous sync history functionality
 * that avoids database dependencies
 * 
 * @param {string} message - Message to log
 * @param {Object} data - Optional data to include in the log
 */
function logSyncActivity(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Clear all data from a Supabase table
 * This is useful to run before populating tables to avoid duplication
 * @param {string} tableName - Table name to clear
 */
async function clearTable(tableName) {
  try {
    logSyncActivity(`Clearing all data from ${tableName}...`);
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 'dummy'); // This will delete all records

    if (error) throw error;
    logSyncActivity(`Successfully cleared ${tableName}`);
  } catch (error) {
    console.error(`Error clearing ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Compare two objects to see if any tracked fields have changed
 * @param {Object} existingRecord - The record from the database
 * @param {Object} newRecord - The new data from ProductBoard
 * @param {Array<string>} fieldsToIgnore - Fields to ignore in comparison (e.g. 'id', 'created_at')
 * @returns {boolean} - True if records have differences, false if they're the same
 */
function hasRecordChanged(existingRecord, newRecord, fieldsToIgnore = ['id', 'created_at', 'updated_at']) {
  // Get all fields from both objects
  const allFields = new Set([
    ...Object.keys(existingRecord),
    ...Object.keys(newRecord)
  ]);
  
  // Filter out fields to ignore
  const fieldsToCompare = Array.from(allFields).filter(field => 
    !fieldsToIgnore.includes(field)
  );
  
  // Compare each field
  for (const field of fieldsToCompare) {
    const existingValue = existingRecord[field];
    const newValue = newRecord[field];
    
    // Handle nulls and undefined values
    if ((existingValue === null || existingValue === undefined) && 
        (newValue === null || newValue === undefined)) {
      continue; // Both are null/undefined, so no change
    }
    
    // Special handling for object comparisons (including arrays)
    if (typeof existingValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
        return true; // Objects differ
      }
    } 
    // Simple value comparison
    else if (existingValue !== newValue) {
      return true; // Values differ
    }
  }
  
  return false; // No differences found
}

/**
 * Check if records already exist in the database and track stats
 * @param {Array} items - Items to check
 * @param {string} tableName - Table name to check
 * @param {string} idField - Field containing the ProductBoard ID
 * @param {string} workspaceIdField - Field containing the workspace ID
 * @returns {Object} - Object with existing and new items
 */
async function checkExistingRecords(items, tableName, idField = 'productboard_id', workspaceIdField = 'workspace_id') {
  try {
    // Group items by workspace ID for more efficient querying
    const workspaceGroups = {};
    items.forEach(item => {
      const wsId = item[workspaceIdField] || 'null';
      if (!workspaceGroups[wsId]) {
        workspaceGroups[wsId] = [];
      }
      workspaceGroups[wsId].push(item[idField]);
    });
    
    // Track existing and new items
    const existing = [];
    const pbIdsFound = new Set();
    
    // Query for existing records in each workspace group
    for (const [wsId, pbIds] of Object.entries(workspaceGroups)) {
      logSyncActivity(`Checking for ${pbIds.length} records in workspace ${wsId}`);
      
      let query;
      
      if (wsId === 'null') {
        // Handle null workspace_id case properly - use 'is' for NULL comparison
        query = supabase
          .from(tableName)
          .select('id, ' + idField + ', ' + workspaceIdField)
          .in(idField, pbIds)
          .is(workspaceIdField, null);
      } else {
        // Normal case for non-null workspace_id
        query = supabase
          .from(tableName)
          .select('id, ' + idField + ', ' + workspaceIdField)
          .in(idField, pbIds)
          .eq(workspaceIdField, wsId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logSyncActivity(`Error checking existing records: ${error.message}`, error);
        throw error;
      }
      
      if (data) {
        logSyncActivity(`Found ${data.length} existing records in workspace ${wsId}`);
        
        // Check for duplicates in database (shouldn't happen after cleanup)
        const uniqueIds = new Set();
        const duplicatesInDb = [];
        
        data.forEach(record => {
          const key = record[idField] + '|' + (record[workspaceIdField] || 'null');
          if (uniqueIds.has(key)) {
            duplicatesInDb.push(key);
          }
          uniqueIds.add(key);
        });
        
        if (duplicatesInDb.length > 0) {
          logSyncActivity(`WARNING: Found ${duplicatesInDb.length} duplicate records in database!`, duplicatesInDb);
        }
        
        data.forEach(record => {
          existing.push(record);
          pbIdsFound.add(record[idField] + '|' + (record[workspaceIdField] || 'null'));
        });
      }
    }
    
    // Identify new items
    const newItems = items.filter(item => {
      const lookupKey = item[idField] + '|' + (item[workspaceIdField] || 'null');
      return !pbIdsFound.has(lookupKey);
    });
    
    return { 
      existing,
      new: newItems,
      stats: {
        total: items.length,
        existing: existing.length,
        new: newItems.length
      }
    };
  } catch (error) {
    console.error(`Error checking existing records in ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Enhanced upsert function with better tracking of operations and change detection
 * @param {Array} items - Items to upsert
 * @param {string} tableName - Table to upsert to
 * @param {string} idField - Field name for ProductBoard ID (default: productboard_id)
 * @param {string} workspaceIdField - Field name for workspace ID (default: workspace_id)
 * @returns {Object} - Upsert results with statistics
 */
async function enhancedUpsert(items, tableName, idField = 'productboard_id', workspaceIdField = 'workspace_id') {
  if (!items || items.length === 0) {
    return { 
      data: [], 
      stats: { 
        total: 0, 
        inserted: 0, 
        updated: 0, 
        unchanged: 0,
        errors: 0 
      } 
    };
  }
  
  try {
    logSyncActivity(`Processing ${items.length} items for ${tableName}...`);
    
    // Get existing vs new items
    const check = await checkExistingRecords(items, tableName, idField, workspaceIdField);
    logSyncActivity(`Found ${check.stats.existing} existing and ${check.stats.new} new records in ${tableName}`);
    
    // Track statistics
    const stats = {
      total: items.length,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      errors: 0
    };
    
    // Process new items (insert)
    let insertedData = [];
    if (check.new.length > 0) {
      logSyncActivity(`Inserting ${check.new.length} new records into ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .insert(check.new)
        .select();
      
      if (error) {
        logSyncActivity(`Error inserting records: ${error.message}`, { error });
        stats.errors += check.new.length;
      } else {
        insertedData = data || [];
        stats.inserted = insertedData.length;
        logSyncActivity(`Successfully inserted ${stats.inserted} records into ${tableName}`);
      }
    }
    
    // Process existing items - check for changes first then update if needed
    let updatedData = [];
    let unchangedCount = 0;
    if (check.existing.length > 0) {
      // Map items by their ProductBoard ID and workspace ID for lookup
      const itemMap = {};
      items.forEach(item => {
        const key = item[idField] + '|' + (item[workspaceIdField] || 'null');
        itemMap[key] = item;
      });
      
      // Fetch full data for existing records to compare fields
      const recordIds = check.existing.map(record => record.id);
      const { data: existingFullData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .in('id', recordIds);
      
      if (fetchError) {
        logSyncActivity(`Error fetching full data for comparison: ${fetchError.message}`, { error: fetchError });
        stats.errors += check.existing.length;
      } else {
        // Create map of existing records by id
        const existingRecordsMap = {};
        existingFullData.forEach(record => {
          existingRecordsMap[record.id] = record;
        });
        
        // Identify records that actually changed vs unchanged
        const recordsToUpdate = [];
        
        for (const record of check.existing) {
          const lookupKey = record[idField] + '|' + (record[workspaceIdField] || 'null');
          const newData = itemMap[lookupKey];
          const existingData = existingRecordsMap[record.id];
          
          // Skip if we couldn't find the full record data
          if (!existingData) {
            recordsToUpdate.push({
              ...newData,
              id: record.id // Include the Supabase ID for updating
            });
            continue;
          }
          
          // Compare fields to detect changes
          if (hasRecordChanged(existingData, newData)) {
            // Record changed, add to update list
            recordsToUpdate.push({
              ...newData,
              id: record.id // Include the Supabase ID for updating
            });
          } else {
            // Record unchanged, skip update
            unchangedCount++;
          }
        }
        
        stats.unchanged = unchangedCount;
        
        if (recordsToUpdate.length > 0) {
          logSyncActivity(`Updating ${recordsToUpdate.length} changed records in ${tableName} (${unchangedCount} unchanged)...`);
          
          // Update in smaller batches to avoid request size limitations
          const batchSize = 100;
          for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
            const batch = recordsToUpdate.slice(i, i + batchSize);
            const { data, error } = await supabase
              .from(tableName)
              .upsert(batch)
              .select();
            
            if (error) {
              logSyncActivity(`Error updating records (batch ${i / batchSize + 1}): ${error.message}`, { error });
              stats.errors += batch.length;
            } else {
              updatedData = [...updatedData, ...(data || [])];
              logSyncActivity(`Updated batch ${i / batchSize + 1} (${batch.length} records)`);
            }
          }
          
          stats.updated = updatedData.length;
          logSyncActivity(`Successfully updated ${stats.updated} records in ${tableName} (${stats.unchanged} unchanged)`);
        } else {
          logSyncActivity(`No changes detected in ${unchangedCount} existing records in ${tableName}, skipping update`);
        }
      }
    }
    
    // Combine data and return
    const allData = [...insertedData, ...updatedData];
    return { data: allData, stats };
  } catch (error) {
    console.error(`Error in enhancedUpsert for ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Upsert features into the database
 * @param {Array} features - Features to upsert
 * @returns {Object} - Object with upserted features and stats
 */
async function upsertFeatures(features) {
  try {
    const result = await enhancedUpsert(features, 'productboard_features');
    return result;
  } catch (error) {
    console.error('Error upserting features:', error.message);
    throw error;
  }
}

/**
 * Upsert initiatives into the database
 * @param {Array} initiatives - Initiatives to upsert
 * @returns {Object} - Object with upserted initiatives and stats
 */
async function upsertInitiatives(initiatives) {
  try {
    const result = await enhancedUpsert(initiatives, 'productboard_initiatives');
    return result;
  } catch (error) {
    console.error('Error upserting initiatives:', error.message);
    throw error;
  }
}

/**
 * Upsert objectives into the database
 * @param {Array} objectives - Objectives to upsert
 * @returns {Object} - Object with upserted objectives and stats
 */
async function upsertObjectives(objectives) {
  try {
    const result = await enhancedUpsert(objectives, 'productboard_objectives');
    return result;
  } catch (error) {
    console.error('Error upserting objectives:', error.message);
    throw error;
  }
}

/**
 * Upsert components into the database
 * @param {Array} components - Components to upsert
 * @returns {Object} - Object with upserted components and stats
 */
async function upsertComponents(components) {
  try {
    const result = await enhancedUpsert(components, 'productboard_components');
    return result;
  } catch (error) {
    console.error('Error upserting components:', error.message);
    throw error;
  }
}

/**
 * Batch upsert data in chunks to avoid request size limits
 * @param {Array} items - Items to upsert
 * @param {Function} upsertFn - Function to use for upserting
 * @param {number} chunkSize - Size of each chunk
 * @returns {Object} - Combined results and statistics
 */
async function batchUpsert(items, upsertFn, chunkSize = 100) {
  const results = [];
  const statsArray = [];
  
  // Process in chunks to avoid request size limits
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResult = await upsertFn(chunk);
    
    // If the result has data and stats, track them
    if (chunkResult && chunkResult.data) {
      results.push(...chunkResult.data);
      if (chunkResult.stats) {
        statsArray.push(chunkResult.stats);
      }
    } else {
      // Fallback for old function returns that don't include stats
      results.push(...(chunkResult || []));
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    length: results.length,
    data: results,
    statsArray
  };
}

/**
 * Upsert products into the database
 * @param {Array} products - Products to upsert
 * @returns {Object} - Object with upserted products and stats
 */
async function upsertProducts(products) {
  try {
    const result = await enhancedUpsert(products, 'productboard_products');
    return result;
  } catch (error) {
    console.error('Error upserting products:', error.message);
    throw error;
  }
}

/**
 * Upsert users into the database
 * @param {Array} users - Users to upsert
 * @returns {Object} - Object with upserted users and stats
 */
async function upsertUsers(users) {
  try {
    const result = await enhancedUpsert(users, 'productboard_users', 'email');
    return result;
  } catch (error) {
    console.error('Error upserting users:', error.message);
    throw error;
  }
}

module.exports = {
  // Export the Supabase client itself
  supabase,
  
  // Export helper functions
  logSyncActivity,
  clearTable,
  checkExistingRecords,
  enhancedUpsert,
  upsertFeatures,
  upsertInitiatives,
  upsertObjectives,
  upsertComponents,
  upsertProducts,
  upsertUsers,
  batchUpsert,
  
  // Add convenience methods that directly use the Supabase client
  from: (table) => supabase.from(table),
  select: (table) => supabase.from(table).select()
};

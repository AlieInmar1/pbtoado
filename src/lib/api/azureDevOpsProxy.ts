// API version
const API_VERSION = '7.0';
const PROXY_URL = 'http://localhost:3008/ado';
const BATCH_SIZE = 50; // Reduced batch size to avoid URL length issues

// Basic authentication helper
function getAuthHeader(apiKey: string): string {
  // Use browser-compatible Base64 encoding
  const token = btoa(`:${apiKey}`);
  return `Basic ${token}`;
}

// Test connection to Azure DevOps
export async function testConnection(
  organization: string,
  project: string, // Keep project for consistency, though not used in this specific URL
  apiKey: string
): Promise<boolean> {
  try {
    // Use the organization-level projects endpoint for connection testing
    const response = await fetch(
      `${PROXY_URL}/${organization}/_apis/projects?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Azure DevOps connection:', error);
    return false;
  }
}

// Fetch work items from Azure DevOps
export async function fetchWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  workItemIds?: number[]
): Promise<any[]> {
  try {
    // If specific work item IDs are provided, fetch those
    if (workItemIds && workItemIds.length > 0) {
      console.log(`Fetching ${workItemIds.length} work items in batches of ${BATCH_SIZE}...`);
      
      // Use getWorkItemDetails which already implements batching
      return await getWorkItemDetails(organization, project, apiKey, workItemIds);
    }
    
    // Otherwise, use WIQL to query for work items
    const wiqlResponse = await fetch(
      `${PROXY_URL}/${organization}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
        body: JSON.stringify({
          query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.ChangedDate] DESC"
        }),
      }
    );
    
    if (!wiqlResponse.ok) {
      throw new Error(`Failed to execute WIQL query: ${wiqlResponse.statusText}`);
    }
    
    const wiqlData = await wiqlResponse.json();
    const ids = wiqlData.workItems.map((item: any) => item.id);
    
    if (ids.length === 0) {
      return [];
    }
    
    // Fetch the actual work items with details
    return await fetchWorkItems(organization, project, apiKey, ids);
  } catch (error) {
    console.error('Error fetching Azure DevOps work items:', error);
    throw error;
  }
}

// Get work item types available in the project
export async function getWorkItemTypes(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `${PROXY_URL}/${organization}/${project}/_apis/wit/workitemtypes?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch work item types: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching work item types:', error);
    throw error;
  }
}

// Query work items using WIQL
export async function queryWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  wiqlQuery: string,
  changedSince?: Date
): Promise<any[]> {
  try {
    // Add date filter for incremental sync if changedSince is provided
    let finalQuery = wiqlQuery;
    if (changedSince) {
      const dateString = changedSince.toISOString();
      // Check if the query already has a WHERE clause
      if (finalQuery.includes('WHERE')) {
        finalQuery = finalQuery.replace('WHERE', `WHERE [System.ChangedDate] >= '${dateString}' AND`);
      } else {
        // If no WHERE clause, add one before any ORDER BY
        if (finalQuery.includes('ORDER BY')) {
          finalQuery = finalQuery.replace('ORDER BY', `WHERE [System.ChangedDate] >= '${dateString}' ORDER BY`);
        } else {
          finalQuery = `${finalQuery} WHERE [System.ChangedDate] >= '${dateString}'`;
        }
      }
      console.log(`Using incremental sync with date filter: ${dateString}`);
    }

    // Execute WIQL query to get work item IDs
    const wiqlResponse = await fetch(
      `${PROXY_URL}/${organization}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
        body: JSON.stringify({
          query: finalQuery
        }),
      }
    );
    
    if (!wiqlResponse.ok) {
      throw new Error(`Failed to execute WIQL query: ${wiqlResponse.statusText}`);
    }
    
    const wiqlData = await wiqlResponse.json();
    
    // If no work items found, return empty array
    if (!wiqlData.workItems || wiqlData.workItems.length === 0) {
      return [];
    }
    
    // Extract work item IDs
    const ids = wiqlData.workItems.map((item: any) => item.id);
    
    // Fetch work items with details
    return await getWorkItemDetails(organization, project, apiKey, ids);
  } catch (error) {
    console.error('Error querying work items:', error);
    throw error;
  }
}

// Get work item details with all fields and relations
export async function getWorkItemDetails(
  organization: string,
  project: string,
  apiKey: string,
  ids: number[]
): Promise<any[]> {
  try {
    // Split IDs into batches of 200 (API limit)
    const batchSize = 200;
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    // Process each batch
    const results = [];
    for (const batchIds of batches) {
      const idList = batchIds.join(',');
      const url = `${PROXY_URL}/${organization}/${project}/_apis/wit/workitems?ids=${idList}&$expand=all&api-version=${API_VERSION}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
      });

      if (!response.ok) {
        // Attempt to parse error response from ADO if possible
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorDetails;
        } catch (e) {
          // Ignore if response is not JSON
        }
        throw new Error(`Failed to fetch work item details (batch starting ${batchIds[0]}): ${response.status} ${errorDetails}`);
      }

      const result = await response.json();
      results.push(...(result.value || []));
    }

    return results;
  } catch (error) {
    console.error('Error fetching work item details:', error);
    throw error;
  }
}

// Get work items by type (Epic, Feature, User Story)
export async function getWorkItemsByType(
  organization: string,
  project: string,
  apiKey: string,
  workItemType: string,
  changedSince?: Date
): Promise<any[]> {
  const wiqlQuery = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AreaPath], [System.ChangedDate]
                     FROM WorkItems 
                     WHERE [System.TeamProject] = @project 
                       AND [System.WorkItemType] = '${workItemType}'`;
  
  return await queryWorkItems(organization, project, apiKey, wiqlQuery, changedSince);
}

// Get work items with hierarchy using WIQL
export async function getWorkItemsWithHierarchy(
  organization: string,
  project: string,
  apiKey: string,
  changedSince?: Date
): Promise<any> {
  try {
    // First, get all Epics
    const epics = await getWorkItemsByType(organization, project, apiKey, 'Epic', changedSince);
    
    // Then, get all Features
    const features = await getWorkItemsByType(organization, project, apiKey, 'Feature', changedSince);
    
    // Finally, get all User Stories
    const stories = await getWorkItemsByType(organization, project, apiKey, 'User Story', changedSince);
    
    // Build the hierarchy
    const hierarchy = buildHierarchy(epics, features, stories);
    
    return hierarchy;
  } catch (error) {
    console.error('Error fetching work items with hierarchy:', error);
    throw error;
  }
}

// Helper function to build the hierarchy
function buildHierarchy(epics: any[], features: any[], stories: any[]): any {
  // Create maps for quick lookup
  const epicsMap: Record<number, any> = {};
  const featuresMap: Record<number, any> = {};
  const featureToEpic: Record<number, number> = {};
  const storyToFeature: Record<number, number> = {};
  
  // Process epics
  epics.forEach(epic => {
    epicsMap[epic.id] = {
      ...epic,
      features: []
    };
  });
  
  // Process features
  features.forEach(feature => {
    featuresMap[feature.id] = {
      ...feature,
      stories: []
    };
    
    // Find parent epic
    if (feature.relations) {
      for (const relation of feature.relations) {
        if (relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
          const epicId = parseInt(relation.url.split('/').pop());
          if (epicsMap[epicId]) {
            featureToEpic[feature.id] = epicId;
            epicsMap[epicId].features.push(feature.id);
          }
        }
      }
    }
  });
  
  // Process stories
  stories.forEach(story => {
    // Find parent feature
    if (story.relations) {
      for (const relation of story.relations) {
        if (relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
          const featureId = parseInt(relation.url.split('/').pop());
          if (featuresMap[featureId]) {
            storyToFeature[story.id] = featureId;
            featuresMap[featureId].stories.push(story.id);
          }
        }
      }
    }
  });
  
  return {
    epics: epicsMap,
    features: featuresMap,
    stories,
    featureToEpic,
    storyToFeature
  };
}

// Get area paths
export async function getAreaPaths(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `${PROXY_URL}/${organization}/${project}/_apis/wit/classificationnodes/areas?$depth=10&api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch area paths: ${response.statusText}`);
    }
    
    const data = await response.json();
    return flattenAreaPaths(data);
  } catch (error) {
    console.error('Error fetching area paths:', error);
    throw error;
  }
}

// Helper function to flatten area paths
function flattenAreaPaths(node: any, parentPath = ''): any[] {
  const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
  let result = [{ id: node.id, name: node.name, path: currentPath }];
  
  if (node.children) {
    for (const child of node.children) {
      result = [...result, ...flattenAreaPaths(child, currentPath)];
    }
  }
  
  return result;
}

// Get teams
export async function getTeams(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `${PROXY_URL}/${organization}/_apis/projects/${project}/teams?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

// Get team settings (area paths assigned to teams)
export async function getTeamAreaPaths(
  organization: string,
  project: string,
  team: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `${PROXY_URL}/${organization}/${project}/${team}/_apis/work/teamsettings/teamfieldvalues?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team area paths: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching team area paths:', error);
    throw error;
  }
}

// Get the last sync time for a specific entity type
export async function getLastSyncTime(
  entityType: string
): Promise<Date | undefined> {
  try {
    // Import supabase dynamically to avoid circular dependencies
    const { supabase } = await import('../supabase');
    
    const { data, error } = await supabase
      .from('ado_sync_history')
      .select('last_sync_time')
      .eq('entity_type', entityType)
      .eq('status', 'success')
      .order('last_sync_time', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error(`Error getting last sync time for ${entityType}:`, error);
      return undefined;
    }
    
    if (data && data.length > 0 && data[0].last_sync_time) {
      return new Date(data[0].last_sync_time);
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error getting last sync time for ${entityType}:`, error);
    return undefined;
  }
}

// Update the sync history for a specific entity type
export async function updateSyncHistory(
  entityType: string,
  itemsCount: number,
  status: 'success' | 'error' = 'success',
  errorMessage?: string
): Promise<void> {
  try {
    // Import supabase dynamically to avoid circular dependencies
    const { supabase } = await import('../supabase');
    
    const { error } = await supabase
      .from('ado_sync_history')
      .upsert({
        entity_type: entityType,
        last_sync_time: new Date().toISOString(),
        items_synced: itemsCount,
        status,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'entity_type'
      });
    
    if (error) {
      console.error(`Error updating sync history for ${entityType}:`, error);
    }
  } catch (error) {
    console.error(`Error updating sync history for ${entityType}:`, error);
  }
}

// Sync all data (for manual sync button)
export async function syncAllData(
  organization: string,
  project: string,
  apiKey: string,
  forceFullSync: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Starting ${forceFullSync ? 'full' : 'incremental'} Azure DevOps data sync...`);
    
    // Get last sync times for each entity type
    const workItemsLastSync = forceFullSync ? undefined : await getLastSyncTime('work_items');
    const workItemTypesLastSync = forceFullSync ? undefined : await getLastSyncTime('work_item_types');
    const areaPathsLastSync = forceFullSync ? undefined : await getLastSyncTime('area_paths');
    const teamsLastSync = forceFullSync ? undefined : await getLastSyncTime('teams');
    
    console.log(`Last sync times: 
      Work Items: ${workItemsLastSync ? workItemsLastSync.toISOString() : 'Never'} 
      Work Item Types: ${workItemTypesLastSync ? workItemTypesLastSync.toISOString() : 'Never'}
      Area Paths: ${areaPathsLastSync ? areaPathsLastSync.toISOString() : 'Never'}
      Teams: ${teamsLastSync ? teamsLastSync.toISOString() : 'Never'}`);
    
    // Fetch work item types
    console.log('Fetching work item types from Azure DevOps...');
    const workItemTypes = await getWorkItemTypes(organization, project, apiKey);
    console.log(`Retrieved ${workItemTypes.length} work item types`);
    await updateSyncHistory('work_item_types', workItemTypes.length);
    
    // Fetch area paths
    console.log('Fetching area paths from Azure DevOps...');
    const areaPaths = await getAreaPaths(organization, project, apiKey);
    console.log(`Retrieved ${areaPaths.length} area paths`);
    await updateSyncHistory('area_paths', areaPaths.length);
    
    // Fetch teams
    console.log('Fetching teams from Azure DevOps...');
    const teams = await getTeams(organization, project, apiKey);
    console.log(`Retrieved ${teams.length} teams`);
    await updateSyncHistory('teams', teams.length);
    
    // Fetch work items with hierarchy
    console.log('Fetching work item hierarchy from Azure DevOps...');
    const hierarchy = await getWorkItemsWithHierarchy(organization, project, apiKey, workItemsLastSync);
    
    // Count the number of items
    const epicCount = Object.keys(hierarchy.epics).length;
    const featureCount = Object.keys(hierarchy.features).length;
    const storyCount = hierarchy.stories.length;
    const totalWorkItems = epicCount + featureCount + storyCount;
    
    console.log(`Retrieved ${epicCount} epics, ${featureCount} features, and ${storyCount} stories`);
    await updateSyncHistory('work_items', totalWorkItems);
    
    return {
      success: true,
      message: `Successfully synced ${epicCount} epics, ${featureCount} features, ${storyCount} stories, ${areaPaths.length} area paths, ${teams.length} teams, and ${workItemTypes.length} work item types.`
    };
  } catch (error) {
    console.error('Error during full Azure DevOps data sync:', error);
    return {
      success: false,
      message: `Error syncing Azure DevOps data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

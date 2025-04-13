import { supabase } from '../supabase';
import * as adoApi from './azureDevOpsProxy';

// API version
const API_VERSION = '7.0';

// Basic authentication helper (reused from azureDevOps.ts)
function getAuthHeader(apiKey: string): string {
  // Use browser-compatible Base64 encoding
  const token = btoa(`:${apiKey}`);
  return `Basic ${token}`;
}

// Helper function to map work item to database format
function mapWorkItemToDb(item: any): Record<string, any> | null {
  if (!item || !item.id || !item.fields) return null;
  const fields = item.fields;
  
  // Helper to safely access fields
  // IMPORTANT: Azure DevOps API returns fields with names like 'System.Title', but these are NOT nested objects.
  // They are flat fields with dots in their names, so we access them directly as fields['System.Title']
  // rather than trying to access them as fields['System']['Title'].
  // See docs/ADO_FIELD_EXTRACTION_FIX.md for more details on this fix.
  const getField = (path: string, defaultValue: any = null) => {
    // Direct field access (no dot notation needed for top-level fields)
    return fields[path] !== undefined ? fields[path] : defaultValue;
  };
  const getIdentityField = (path: string, field: 'displayName' | 'uniqueName', defaultValue: any = null) => {
     const identity = getField(path);
     return identity && identity[field] ? identity[field] : defaultValue;
  };

  // Extract Productboard ID from relations
  let productboardId = null;
  if (item.relations) {
    const pbLink = item.relations.find((r: any) => 
      r.rel === 'Hyperlink' && 
      r.url && 
      r.url.includes('productboard.com')
    );
    
    if (pbLink) {
      const match = pbLink.url.match(/features\/([a-f0-9-]+)/);
      productboardId = match ? match[1] : null;
    }
  }
  
  // --- BEGIN GRANULAR DIAGNOSTIC LOGGING ---
  const extracted = {
    title: getField('System.Title', `Untitled Item ${item.id}`),
    state: getField('System.State', 'Unknown'),
    area_id: getField('System.AreaId'),
    priority: getField('Microsoft.VSTS.Common.Priority'),
    stack_rank: getField('Microsoft.VSTS.Common.StackRank'),
  };
  console.log(`[DIAGNOSTIC item ${item.id}] Extracted values:`, JSON.stringify(extracted));
  // --- END GRANULAR DIAGNOSTIC LOGGING ---

  return {
    id: item.id,
    url: item.url,
    rev: item.rev,
    // Use pre-extracted values for logging consistency
    type: getField('System.WorkItemType', 'Unknown'),
    title: extracted.title, 
    state: extracted.state,
    reason: getField('System.Reason'),
    area_path: getField('System.AreaPath'),
    area_id: extracted.area_id,
    iteration_path: getField('System.IterationPath'),
    iteration_id: getField('System.IterationId'),
    priority: extracted.priority,
    value_area: getField('Microsoft.VSTS.Common.ValueArea'),
    tags: getField('System.Tags'),
    description: getField('System.Description'),
    history: getField('System.History'),
    acceptance_criteria: getField('Microsoft.VSTS.Common.AcceptanceCriteria'),
    assigned_to_name: getIdentityField('System.AssignedTo', 'displayName'),
    assigned_to_email: getIdentityField('System.AssignedTo', 'uniqueName'),
    created_by_name: getIdentityField('System.CreatedBy', 'displayName'),
    created_by_email: getIdentityField('System.CreatedBy', 'uniqueName'),
    created_date: getField('System.CreatedDate'),
    changed_by_name: getIdentityField('System.ChangedBy', 'displayName'),
    changed_by_email: getIdentityField('System.ChangedBy', 'uniqueName'),
    changed_date: getField('System.ChangedDate'),
    parent_id: getField('System.Parent'), // Direct parent field if available
    board_column: getField('System.BoardColumn'),
    board_column_done: getField('System.BoardColumnDone'),
    comment_count: getField('System.CommentCount'),
    watermark: getField('System.Watermark'),
    stack_rank: extracted.stack_rank,
    effort: getField('Microsoft.VSTS.Scheduling.Effort'),
    story_points: getField('Microsoft.VSTS.Scheduling.StoryPoints'),
    business_value: getField('Microsoft.VSTS.Common.BusinessValue'),
    productboard_id: productboardId,
    raw_data: item, // Store the whole item
    last_synced_at: new Date().toISOString(),
  };
}

// Helper function to map relation to database format
function mapRelationToDb(sourceId: number, relation: any): Record<string, any> | null {
   if (!relation || !relation.url || !relation.rel) return null;
   
   // Extract target ID if it's a work item link
   let target_work_item_id: number | null = null;
   const match = relation.url.match(/\/workItems\/(\d+)$/);
   if (match && match[1]) {
     target_work_item_id = parseInt(match[1], 10);
   }

   // Check relation types
   const isParent = relation.rel === 'System.LinkTypes.Hierarchy-Reverse';
   const isChild = relation.rel === 'System.LinkTypes.Hierarchy-Forward';
   const isRelated = relation.rel === 'System.LinkTypes.Related';
   const isHyperlink = relation.rel === 'Hyperlink';
   
   // Check if it's a Productboard link
   const isPbLink = isHyperlink && relation.url.includes('productboard.com');
   let productboardId = null;
   
   if (isPbLink) {
     const pbMatch = relation.url.match(/features\/([a-f0-9-]+)/);
     productboardId = pbMatch ? pbMatch[1] : null;
   }

   return {
     source_work_item_id: sourceId,
     target_work_item_id: target_work_item_id,
     target_url: relation.url,
     rel_type: relation.rel,
     attributes: relation.attributes || {},
     is_parent: isParent,
     is_child: isChild,
     is_related: isRelated,
     is_hyperlink: isHyperlink,
     is_productboard_link: isPbLink,
     productboard_id: productboardId
   };
}

// Helper function to map area path to database format
function mapAreaPathToDb(areaPath: any): Record<string, any> | null {
  if (!areaPath || !areaPath.id) return null;
  
  return {
    id: areaPath.id,
    name: areaPath.name,
    path: areaPath.path,
    structure_type: 'area',
    has_children: !!areaPath.hasChildren,
    raw_data: areaPath,
    last_synced_at: new Date().toISOString(),
  };
}

// Helper function to map work item type to database format
function mapWorkItemTypeToDb(type: any): Record<string, any> | null {
  if (!type || !type.name) return null;
  
  return {
    name: type.name,
    description: type.description,
    reference_name: type.referenceName,
    url: type.url,
    color: type.color,
    icon_url: type.icon?.url,
    is_disabled: !!type.isDisabled,
    raw_data: type,
    last_synced_at: new Date().toISOString(),
  };
}

// Helper function to map team to database format
function mapTeamToDb(team: any): Record<string, any> | null {
  if (!team || !team.id) return null;
  
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    url: team.url,
    identity_url: team.identityUrl,
    project_name: team.projectName,
    project_id: team.projectId,
    raw_data: team,
    last_synced_at: new Date().toISOString(),
  };
}

// Test connection to Azure DevOps (no caching needed)
export async function testConnection(
  organization: string,
  project: string,
  apiKey: string
): Promise<boolean> {
  return adoApi.testConnection(organization, project, apiKey);
}

// Fetch work items from Azure DevOps with Supabase caching
export async function fetchWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  workItemIds?: number[],
  forceRefresh: boolean = false
): Promise<any[]> {
  try {
    // If specific IDs are provided and not forcing refresh, try to get from cache first
    if (workItemIds && workItemIds.length > 0 && !forceRefresh) {
      const { data: cachedItems, error } = await supabase
        .from('ado_work_items')
        .select('*')
        .in('id', workItemIds);
      
      // If all items are in cache, return them
      if (!error && cachedItems && cachedItems.length === workItemIds.length) {
        console.log(`Retrieved ${cachedItems.length} work items from Supabase cache`);
        return cachedItems;
      }
    }
    
    // Fetch from Azure DevOps
    console.log('Fetching work items from Azure DevOps...');
    const adoItems = await adoApi.fetchWorkItems(organization, project, apiKey, workItemIds);
    
    if (adoItems.length > 0) {
      // --- BEGIN DIAGNOSTIC LOGGING ---
      console.log(`[DIAGNOSTIC] Received ${adoItems.length} items from ADO API.`);
      if (adoItems[0]) {
        console.log('[DIAGNOSTIC] Raw data for first item:', JSON.stringify(adoItems[0], null, 2));
      }
      // --- END DIAGNOSTIC LOGGING ---
      
      // Map items to database format
      const mappedItems = adoItems.map(mapWorkItemToDb).filter(Boolean) as Record<string, any>[];
      const mappedRelations: Record<string, any>[] = [];
      const parentUpdates: { id: number, parent_id: number }[] = [];
      const missingParentIds = new Set<number>();
      
      // --- BEGIN DIAGNOSTIC LOGGING ---
      if (mappedItems[0]) {
        console.log('[DIAGNOSTIC] Mapped data for first item:', JSON.stringify(mappedItems[0], null, 2));
      }
      // --- END DIAGNOSTIC LOGGING ---
      
      // Extract relations
      adoItems.forEach(item => {
        if (item.relations) {
          item.relations.forEach((rel: any) => {
            const mappedRel = mapRelationToDb(item.id, rel);
            if (mappedRel) {
              mappedRelations.push(mappedRel);
              // Track parent relationships
              if (rel.rel === 'System.LinkTypes.Hierarchy-Reverse' && mappedRel.target_work_item_id) {
                parentUpdates.push({ id: item.id, parent_id: mappedRel.target_work_item_id });
              }
            }
          });
        }
      });
      
      // Cache items in Supabase
      console.log(`Caching ${mappedItems.length} work items in Supabase...`);
      const { data: upsertData, error: upsertError } = await supabase
        .from('ado_work_items')
        .upsert(mappedItems, { onConflict: 'id' })
        .select(); // Select the upserted data to confirm
      
      if (upsertError) {
        console.error('Error caching work items:', upsertError);
        // --- BEGIN DIAGNOSTIC LOGGING ---
        console.error('[DIAGNOSTIC] Supabase upsert failed:', upsertError.message);
        // --- END DIAGNOSTIC LOGGING ---
      } else {
        // --- BEGIN DIAGNOSTIC LOGGING ---
        console.log(`[DIAGNOSTIC] Supabase upsert successful. Items processed: ${upsertData?.length || 0}`);
        if (upsertData && upsertData[0]) {
           console.log('[DIAGNOSTIC] First upserted item from Supabase:', JSON.stringify(upsertData[0], null, 2));
        }
        // --- END DIAGNOSTIC LOGGING ---
      }
      
      // Update parent IDs
      if (parentUpdates.length > 0) {
        console.log(`Updating ${parentUpdates.length} parent relationships...`);
        
        // First, check which parent IDs are missing from the database
        const parentIds = parentUpdates.map(update => update.parent_id);
        const { data: existingParents, error: checkError } = await supabase
          .from('ado_work_items')
          .select('id')
          .in('id', parentIds);
        
        if (checkError) {
          console.error('Error checking existing parents:', checkError);
        } else {
          // Create a set of existing parent IDs for quick lookup
          const existingParentIds = new Set(existingParents?.map(p => p.id) || []);
          
          // Find missing parent IDs
          const missingParentIds = parentIds.filter(id => !existingParentIds.has(id));
          
          // If there are missing parents, fetch them first
          if (missingParentIds.length > 0) {
            console.log(`Fetching ${missingParentIds.length} missing parent work items...`);
            try {
              const missingParents = await adoApi.fetchWorkItems(organization, project, apiKey, missingParentIds);
              
              if (missingParents.length > 0) {
                // Map and cache the missing parents
                const mappedParents = missingParents.map(mapWorkItemToDb).filter(Boolean) as Record<string, any>[];
                
                const { error: parentUpsertError } = await supabase
                  .from('ado_work_items')
                  .upsert(mappedParents, { onConflict: 'id' });
                
                if (parentUpsertError) {
                  console.error('Error caching missing parents:', parentUpsertError);
                } else {
                  console.log(`Successfully cached ${mappedParents.length} missing parent work items`);
                }
              }
            } catch (fetchError) {
              console.error('Error fetching missing parents:', fetchError);
            }
          }
        }
        
        // Now update the parent relationships
        for (const update of parentUpdates) {
          const { error: parentError } = await supabase
            .from('ado_work_items')
            .update({ parent_id: update.parent_id })
            .eq('id', update.id);
          
          if (parentError) {
            console.error(`Error updating parent for ${update.id}:`, parentError);
          }
        }
      }
      
      // Cache relations
      if (mappedRelations.length > 0) {
        console.log(`Caching ${mappedRelations.length} work item relations...`);
        
        // Delete existing relations for these items
        const sourceIds = mappedItems.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('ado_work_item_relations')
          .delete()
          .in('source_work_item_id', sourceIds);
        
        if (deleteError) {
          console.error('Error deleting existing relations:', deleteError);
        }
        
        // Insert new relations
        const { error: insertError } = await supabase
          .from('ado_work_item_relations')
          .insert(mappedRelations);
        
        if (insertError) {
          console.error('Error inserting relations:', insertError);
        }
      }
    }
    
    return adoItems;
  } catch (error) {
    console.error('Error in fetchWorkItems with cache:', error);
    
    // If ADO fetch fails, try to get from Supabase cache as fallback
    if (workItemIds && workItemIds.length > 0) {
      console.log('Attempting to fetch from cache as fallback...');
      const { data: cachedItems, error: cacheError } = await supabase
        .from('ado_work_items')
        .select('*')
        .in('id', workItemIds);
      
      if (!cacheError && cachedItems && cachedItems.length > 0) {
        console.log(`Retrieved ${cachedItems.length} work items from cache as fallback`);
        return cachedItems;
      }
    }
    
    throw error;
  }
}

// Get work item types with caching
export async function getWorkItemTypes(
  organization: string,
  project: string,
  apiKey: string,
  forceRefresh: boolean = false
): Promise<any[]> {
  try {
    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedTypes, error } = await supabase
        .from('ado_work_item_types')
        .select('*');
      
      if (!error && cachedTypes && cachedTypes.length > 0) {
        console.log(`Retrieved ${cachedTypes.length} work item types from cache`);
        return cachedTypes;
      }
    }
    
    // Fetch from Azure DevOps
    console.log('Fetching work item types from Azure DevOps...');
    const adoTypes = await adoApi.getWorkItemTypes(organization, project, apiKey);
    
    if (adoTypes.length > 0) {
      // Map types to database format
      const mappedTypes = adoTypes.map(mapWorkItemTypeToDb).filter(Boolean) as Record<string, any>[];
      
      // Cache in Supabase
      console.log(`Caching ${mappedTypes.length} work item types in Supabase...`);
      const { error: upsertError } = await supabase
        .from('ado_work_item_types')
        .upsert(mappedTypes, { onConflict: 'name' });
      
      if (upsertError) {
        console.error('Error caching work item types:', upsertError);
      }
    }
    
    return adoTypes;
  } catch (error) {
    console.error('Error in getWorkItemTypes with cache:', error);
    
    // Try to get from cache as fallback
    console.log('Attempting to fetch work item types from cache as fallback...');
    const { data: cachedTypes, error: cacheError } = await supabase
      .from('ado_work_item_types')
      .select('*');
    
    if (!cacheError && cachedTypes && cachedTypes.length > 0) {
      console.log(`Retrieved ${cachedTypes.length} work item types from cache as fallback`);
      return cachedTypes;
    }
    
    throw error;
  }
}

// Get area paths with caching
export async function getAreaPaths(
  organization: string,
  project: string,
  apiKey: string,
  forceRefresh: boolean = false
): Promise<any[]> {
  try {
    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedPaths, error } = await supabase
        .from('ado_area_paths')
        .select('*')
        .order('path', { ascending: true });
      
      if (!error && cachedPaths && cachedPaths.length > 0) {
        console.log(`Retrieved ${cachedPaths.length} area paths from cache`);
        return cachedPaths;
      }
    }
    
    // Fetch from Azure DevOps
    console.log('Fetching area paths from Azure DevOps...');
    const adoPaths = await adoApi.getAreaPaths(organization, project, apiKey);
    
    if (adoPaths.length > 0) {
      // Map paths to database format
      const mappedPaths = adoPaths.map(mapAreaPathToDb).filter(Boolean) as Record<string, any>[];
      
      // Cache in Supabase
      console.log(`Caching ${mappedPaths.length} area paths in Supabase...`);
      const { error: upsertError } = await supabase
        .from('ado_area_paths')
        .upsert(mappedPaths, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error caching area paths:', upsertError);
      }
    }
    
    return adoPaths;
  } catch (error) {
    console.error('Error in getAreaPaths with cache:', error);
    
    // Try to get from cache as fallback
    console.log('Attempting to fetch area paths from cache as fallback...');
    const { data: cachedPaths, error: cacheError } = await supabase
      .from('ado_area_paths')
      .select('*')
      .order('path', { ascending: true });
    
    if (!cacheError && cachedPaths && cachedPaths.length > 0) {
      console.log(`Retrieved ${cachedPaths.length} area paths from cache as fallback`);
      return cachedPaths;
    }
    
    throw error;
  }
}

// Get teams with caching
export async function getTeams(
  organization: string,
  project: string,
  apiKey: string,
  forceRefresh: boolean = false
): Promise<any[]> {
  try {
    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedTeams, error } = await supabase
        .from('ado_teams')
        .select('*');
      
      if (!error && cachedTeams && cachedTeams.length > 0) {
        console.log(`Retrieved ${cachedTeams.length} teams from cache`);
        return cachedTeams;
      }
    }
    
    // Fetch from Azure DevOps
    console.log('Fetching teams from Azure DevOps...');
    const adoTeams = await adoApi.getTeams(organization, project, apiKey);
    
    if (adoTeams.length > 0) {
      // Map teams to database format
      const mappedTeams = adoTeams.map(mapTeamToDb).filter(Boolean) as Record<string, any>[];
      
      // Cache in Supabase
      console.log(`Caching ${mappedTeams.length} teams in Supabase...`);
      const { error: upsertError } = await supabase
        .from('ado_teams')
        .upsert(mappedTeams, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error caching teams:', upsertError);
      }
    }
    
    return adoTeams;
  } catch (error) {
    console.error('Error in getTeams with cache:', error);
    
    // Try to get from cache as fallback
    console.log('Attempting to fetch teams from cache as fallback...');
    const { data: cachedTeams, error: cacheError } = await supabase
      .from('ado_teams')
      .select('*');
    
    if (!cacheError && cachedTeams && cachedTeams.length > 0) {
      console.log(`Retrieved ${cachedTeams.length} teams from cache as fallback`);
      return cachedTeams;
    }
    
    throw error;
  }
}

// Get team area paths (pass-through to original API, no caching for now)
export async function getTeamAreaPaths(
  organization: string,
  project: string,
  team: string,
  apiKey: string
): Promise<any[]> {
  return adoApi.getTeamAreaPaths(organization, project, team, apiKey);
}

// Query work items using WIQL (pass-through to original API with caching of results)
export async function queryWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  wiqlQuery: string,
  forceRefresh: boolean = false,
  changedSince?: Date
): Promise<any[]> {
  // Get the work items from ADO
  const workItems = await adoApi.queryWorkItems(organization, project, apiKey, wiqlQuery, changedSince);
  
  // If we have results, cache them
  if (workItems.length > 0) {
    await fetchWorkItems(organization, project, apiKey, workItems.map(item => item.id), forceRefresh);
  }
  
  return workItems;
}

// Get work items by type with caching
export async function getWorkItemsByType(
  organization: string,
  project: string,
  apiKey: string,
  workItemType: string,
  forceRefresh: boolean = false,
  changedSince?: Date
): Promise<any[]> {
  try {
    // If not forcing refresh, try to get from cache first
    if (!forceRefresh) {
      const { data: cachedItems, error } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('type', workItemType);
      
      if (!error && cachedItems && cachedItems.length > 0) {
        console.log(`Retrieved ${cachedItems.length} ${workItemType} items from cache`);
        return cachedItems;
      }
    }
    
    // Fetch from Azure DevOps
    console.log(`Fetching ${workItemType} items from Azure DevOps...`);
    const adoItems = await adoApi.getWorkItemsByType(organization, project, apiKey, workItemType, changedSince);
    
    // Cache the results (fetchWorkItems handles the caching)
    if (adoItems.length > 0) {
      await fetchWorkItems(organization, project, apiKey, adoItems.map(item => item.id), true);
    }
    
    return adoItems;
  } catch (error) {
    console.error(`Error in getWorkItemsByType(${workItemType}) with cache:`, error);
    
    // Try to get from cache as fallback
    console.log(`Attempting to fetch ${workItemType} items from cache as fallback...`);
    const { data: cachedItems, error: cacheError } = await supabase
      .from('ado_work_items')
      .select('*')
      .eq('type', workItemType);
    
    if (!cacheError && cachedItems && cachedItems.length > 0) {
      console.log(`Retrieved ${cachedItems.length} ${workItemType} items from cache as fallback`);
      return cachedItems;
    }
    
    throw error;
  }
}

// Helper function to build the hierarchy (copied from azureDevOps.ts since it's not exported)
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

// Get work items with hierarchy with caching
export async function getWorkItemsWithHierarchy(
  organization: string,
  project: string,
  apiKey: string,
  forceRefresh: boolean = false,
  changedSince?: Date
): Promise<any> {
  try {
    // If not forcing refresh, check if we have cached data for all types
    if (!forceRefresh) {
      const { count: epicCount, error: epicError } = await supabase
        .from('ado_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'Epic');
      
      const { count: featureCount, error: featureError } = await supabase
        .from('ado_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'Feature');
      
      const { count: storyCount, error: storyError } = await supabase
        .from('ado_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'User Story');
      
      // If we have data for all types, fetch from cache
      if (!epicError && !featureError && !storyError && 
          epicCount !== null && featureCount !== null && storyCount !== null &&
          epicCount > 0 && featureCount > 0) {
        
        console.log('Retrieving work item hierarchy from cache...');
        
        // Get all items from cache
        const { data: epics, error: epicsError } = await supabase
          .from('ado_work_items')
          .select('*')
          .eq('type', 'Epic');
        
        const { data: features, error: featuresError } = await supabase
          .from('ado_work_items')
          .select('*')
          .eq('type', 'Feature');
        
        const { data: stories, error: storiesError } = await supabase
          .from('ado_work_items')
          .select('*')
          .eq('type', 'User Story');
        
        // Get relations to build hierarchy
        const { data: relations, error: relationsError } = await supabase
          .from('ado_work_item_relations')
          .select('*')
          .in('rel_type', ['System.LinkTypes.Hierarchy-Forward', 'System.LinkTypes.Hierarchy-Reverse']);
        
        if (!epicsError && !featuresError && !storiesError && !relationsError &&
            epics && features && stories && relations) {
          
          // Add relations to the items, converting from DB format to ADO API format
          const itemsWithRelations = [...epics, ...features, ...stories].map(item => {
            const itemRelations = relations
              .filter(rel => rel.source_work_item_id === item.id)
              .map(rel => {
                // Convert DB relation to ADO API format
                return {
                  rel: rel.rel_type,
                  url: rel.target_url,
                  attributes: rel.attributes
                };
              });
            
            // Add debug logging
            console.log(`Item ${item.id} (${item.type}) has ${itemRelations.length} relations`);
            
            return { ...item, relations: itemRelations };
          });
          
          // Build hierarchy using our implementation
          const hierarchy = buildHierarchy(
            itemsWithRelations.filter(item => item.type === 'Epic'),
            itemsWithRelations.filter(item => item.type === 'Feature'),
            itemsWithRelations.filter(item => item.type === 'User Story')
          );
          
          return hierarchy;
        }
      }
    }
    
    // Fetch from Azure DevOps
    console.log('Fetching work item hierarchy from Azure DevOps...');
    const hierarchy = await adoApi.getWorkItemsWithHierarchy(organization, project, apiKey, changedSince);
    
    // Cache the results
    // Epics
    if (hierarchy.epics) {
      const epicItems = Object.values(hierarchy.epics);
      if (epicItems.length > 0) {
        await fetchWorkItems(organization, project, apiKey, epicItems.map((item: any) => item.id), true);
      }
    }
    
    // Features
    if (hierarchy.features) {
      const featureItems = Object.values(hierarchy.features);
      if (featureItems.length > 0) {
        await fetchWorkItems(organization, project, apiKey, featureItems.map((item: any) => item.id), true);
      }
    }
    
    // Stories
    if (hierarchy.stories && hierarchy.stories.length > 0) {
      await fetchWorkItems(organization, project, apiKey, hierarchy.stories.map((item: any) => item.id), true);
    }
    
    return hierarchy;
  } catch (error) {
    console.error('Error in getWorkItemsWithHierarchy with cache:', error);
    
    // Try to build hierarchy from cache as fallback
    console.log('Attempting to build hierarchy from cache as fallback...');
    
    try {
      const { data: epics, error: epicsError } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('type', 'Epic');
      
      const { data: features, error: featuresError } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('type', 'Feature');
      
      const { data: stories, error: storiesError } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('type', 'User Story');
      
      const { data: relations, error: relationsError } = await supabase
        .from('ado_work_item_relations')
        .select('*')
        .in('rel_type', ['System.LinkTypes.Hierarchy-Forward', 'System.LinkTypes.Hierarchy-Reverse']);
      
      if (!epicsError && !featuresError && !storiesError && !relationsError &&
          epics && features && stories && relations && 
          epics.length > 0 && features.length > 0) {
        
        // Add relations to the items, converting from DB format to ADO API format
        const itemsWithRelations = [...epics, ...features, ...stories].map(item => {
          const itemRelations = relations
            .filter(rel => rel.source_work_item_id === item.id)
            .map(rel => {
              // Convert DB relation to ADO API format
              return {
                rel: rel.rel_type,
                url: rel.target_url,
                attributes: rel.attributes
              };
            });
          
          // Add debug logging
          console.log(`Fallback: Item ${item.id} (${item.type}) has ${itemRelations.length} relations`);
          
          return { ...item, relations: itemRelations };
        });
        
        // Build hierarchy using our implementation
        const hierarchy = buildHierarchy(
          itemsWithRelations.filter(item => item.type === 'Epic'),
          itemsWithRelations.filter(item => item.type === 'Feature'),
          itemsWithRelations.filter(item => item.type === 'User Story')
        );
        
        return hierarchy;
      }
    } catch (fallbackError) {
      console.error('Error building hierarchy from cache:', fallbackError);
    }
    
    throw error;
  }
}

// Get the last sync time for a specific entity type
export async function getLastSyncTime(
  entityType: string
): Promise<Date | undefined> {
  return adoApi.getLastSyncTime(entityType);
}

// Update the sync history for a specific entity type
export async function updateSyncHistory(
  entityType: string,
  itemsCount: number,
  status: 'success' | 'error' = 'success',
  errorMessage?: string
): Promise<void> {
  return adoApi.updateSyncHistory(entityType, itemsCount, status, errorMessage);
}

// Manual sync function to force refresh all data
export async function syncAllData(
  organization: string,
  project: string,
  apiKey: string,
  forceFullSync: boolean = false
): Promise<{ success: boolean, message: string }> {
  try {
    console.log(`Starting ${forceFullSync ? 'full' : 'incremental'} Azure DevOps data sync...`);
    
    // Get last sync times for each entity type
    const workItemsLastSync = forceFullSync ? undefined : await getLastSyncTime('work_items');
    
    // Sync work item types
    console.log('Fetching work item types from Azure DevOps...');
    const workItemTypes = await getWorkItemTypes(organization, project, apiKey, true);
    console.log(`Retrieved ${workItemTypes.length} work item types`);
    await updateSyncHistory('work_item_types', workItemTypes.length);
    
    // Sync area paths
    console.log('Fetching area paths from Azure DevOps...');
    const areaPaths = await getAreaPaths(organization, project, apiKey, true);
    console.log(`Retrieved ${areaPaths.length} area paths`);
    await updateSyncHistory('area_paths', areaPaths.length);
    
    // Sync teams
    console.log('Fetching teams from Azure DevOps...');
    const teams = await getTeams(organization, project, apiKey, true);
    console.log(`Retrieved ${teams.length} teams`);
    await updateSyncHistory('teams', teams.length);
    
    // Sync work items with hierarchy (this will sync epics, features, and stories)
    console.log('Fetching work item hierarchy from Azure DevOps...');
    const hierarchy = await getWorkItemsWithHierarchy(organization, project, apiKey, true, workItemsLastSync);
    
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

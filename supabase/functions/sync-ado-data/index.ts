import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers (defined directly, similar to sync-productboard-hierarchy)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust if needed for production)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST for invocation, OPTIONS for preflight
};

// --- Azure DevOps API Configuration ---
// IMPORTANT: These should be set as environment variables in Supabase Edge Function settings
const ADO_ORGANIZATION = Deno.env.get('ADO_ORGANIZATION') || 'inmar'; // Replace with your default or env var
const ADO_PROJECT = Deno.env.get('ADO_PROJECT') || 'Healthcare'; // Replace with your default or env var
const ADO_API_KEY = Deno.env.get('AZURE_DEVOPS_PAT'); // Use the correct secret name set in Supabase

const API_VERSION = '7.0';

// --- Helper Functions (Adapted from src/lib/api/azureDevOps.ts for Deno) ---

function getAuthHeader(apiKey: string): string {
  // Deno uses standard btoa
  // Try with explicit username:password format (empty username)
  const token = btoa(`:${apiKey}`);
  return `Basic ${token}`;
}

// Alternative auth header format to try
function getAltAuthHeader(apiKey: string): string {
  // Some Azure DevOps configurations might require this format
  return `Bearer ${apiKey}`;
}

// Simplified fetch function for Deno
async function fetchAdo(url: string, apiKey: string, options: RequestInit = {}): Promise<any> {
  console.log(`Fetching from ADO: ${url}`);
  console.log(`Using API key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
  
  const authHeader = getAuthHeader(apiKey);
  console.log(`Auth header format: ${authHeader.substring(0, 10)}...`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  console.log(`Response status: ${response.status} ${response.statusText}`);
  console.log(`Response headers: ${JSON.stringify(Object.fromEntries([...response.headers]))}`);

  if (!response.ok) {
    let errorDetails = response.statusText;
    let responseText = '';
    
    try {
      // First get the raw text to see what's being returned
      responseText = await response.text();
      console.error(`Raw error response (first 500 chars): ${responseText.substring(0, 500)}...`);
      
      // Try to parse as JSON if it looks like JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        const errorData = JSON.parse(responseText);
        errorDetails = errorData.message || errorDetails;
      }
    } catch (e) { 
      console.error(`Error parsing response: ${e.message}`);
    }
    
    console.error(`ADO API Error (${response.status}) for ${url}: ${errorDetails}`);
    throw new Error(`ADO API Error: ${response.status} ${errorDetails}`);
  }

  // Handle potential empty responses for certain endpoints
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    console.log('Empty response, returning null');
    return null; 
  }

  // Get the response as text first
  const text = await response.text();
  
  // Log a sample of the response
  console.log(`Response from ${url} (first 100 chars): ${text.substring(0, 100)}...`);
  
  // Parse the text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error parsing JSON response: ${e.message}`);
    console.error(`Response text (first 500 chars): ${text.substring(0, 500)}`);
    throw new Error(`Failed to parse JSON response: ${e.message}`);
  }
}

// --- ADO Data Fetching Functions (Adapted for Edge Function) ---

async function getWorkItemsByIds(ids: number[], apiKey: string): Promise<any[]> {
  if (!ids || ids.length === 0) return [];
  
  const batchSize = 200; // ADO limit
  const results: any[] = []; // Explicitly type results array
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const idList = batchIds.join(',');
    const url = `https://dev.azure.com/${ADO_ORGANIZATION}/${ADO_PROJECT}/_apis/wit/workitems?ids=${idList}&$expand=all&api-version=${API_VERSION}`;
    try {
      const data = await fetchAdo(url, apiKey);
      if (data && data.value) {
        results.push(...data.value);
      }
    } catch (error) {
      console.error(`Error fetching work item batch starting ${batchIds[0]}:`, error.message);
      // Decide if you want to throw and stop the whole sync or continue with partial data
      // For now, log error and continue
    }
  }
  return results;
}

async function queryWorkItemIds(wiqlQuery: string, apiKey: string): Promise<number[]> {
  const url = `https://dev.azure.com/${ADO_ORGANIZATION}/${ADO_PROJECT}/_apis/wit/wiql?api-version=${API_VERSION}`;
  const data = await fetchAdo(url, apiKey, {
    method: 'POST',
    body: JSON.stringify({ query: wiqlQuery }),
  });
  return data?.workItems?.map((item: { id: number }) => item.id) || [];
}

async function getAllWorkItems(apiKey: string): Promise<any[]> {
   // Fetch all relevant types, adjust query as needed
   const query = `
     SELECT [System.Id] 
     FROM WorkItems 
     WHERE [System.TeamProject] = @project 
       AND [System.WorkItemType] IN ('Epic', 'Feature', 'User Story') 
     ORDER BY [System.ChangedDate] DESC`; // Order matters for potential incremental sync later
   
   const allIds = await queryWorkItemIds(query.replace('@project', `'${ADO_PROJECT}'`), apiKey);
   console.log(`Found ${allIds.length} total work items (Epics, Features, Stories).`);
   return await getWorkItemsByIds(allIds, apiKey);
}

async function getAreaPaths(apiKey: string): Promise<any[]> {
  const url = `https://dev.azure.com/${ADO_ORGANIZATION}/${ADO_PROJECT}/_apis/wit/classificationnodes/areas?$depth=10&api-version=${API_VERSION}`; // Adjust depth if needed
  const data = await fetchAdo(url, apiKey);
  
  // Flatten the tree structure
  function flatten(node: any, parentPath = ''): any[] {
    // Use project name as root if node name isn't it
    const isRoot = !parentPath && node.name !== ADO_PROJECT;
    const currentPath = parentPath ? `${parentPath}\\${node.name}` : (isRoot ? `${ADO_PROJECT}\\${node.name}` : node.name);
    let result = [{ 
      id: node.id, 
      name: node.name, 
      path: currentPath,
      structure_type: node.structureType,
      has_children: node.hasChildren || false,
      raw_data: node // Store raw node data
    }];
    if (node.children) {
      for (const child of node.children) {
        result = [...result, ...flatten(child, currentPath)];
      }
    }
    return result;
  }

  return data ? flatten(data) : [];
}

// --- Data Mapping and Upsert Logic ---

function mapWorkItemToDb(item: any): Record<string, any> | null {
  if (!item || !item.id || !item.fields) return null;
  const fields = item.fields;
  
  // Helper to safely access nested properties
  const getField = (path: string, defaultValue: any = null) => {
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : defaultValue, fields);
  };
  const getIdentityField = (path: string, field: 'displayName' | 'uniqueName', defaultValue: any = null) => {
     const identity = getField(path);
     return identity && identity[field] ? identity[field] : defaultValue;
  };

  return {
    id: item.id,
    url: item.url,
    rev: item.rev,
    type: getField('System.WorkItemType', 'Unknown'),
    title: getField('System.Title', `Untitled Item ${item.id}`),
    state: getField('System.State', 'Unknown'),
    reason: getField('System.Reason'),
    area_path: getField('System.AreaPath'),
    iteration_path: getField('System.IterationPath'),
    priority: getField('Microsoft.VSTS.Common.Priority'),
    value_area: getField('Microsoft.VSTS.Common.ValueArea'),
    tags: getField('System.Tags'),
    description: getField('System.Description'),
    assigned_to_name: getIdentityField('System.AssignedTo', 'displayName'),
    assigned_to_email: getIdentityField('System.AssignedTo', 'uniqueName'),
    created_by_name: getIdentityField('System.CreatedBy', 'displayName'),
    created_by_email: getIdentityField('System.CreatedBy', 'uniqueName'),
    created_date: getField('System.CreatedDate'),
    changed_by_name: getIdentityField('System.ChangedBy', 'displayName'),
    changed_by_email: getIdentityField('System.ChangedBy', 'uniqueName'),
    changed_date: getField('System.ChangedDate'),
    // parent_id will be handled via relations
    raw_data: item, // Store the whole item
    last_synced_at: new Date().toISOString(),
  };
}

function mapRelationToDb(sourceId: number, relation: any): Record<string, any> | null {
   if (!relation || !relation.url || !relation.rel) return null;
   
   // Extract target ID if it's a work item link
   let target_work_item_id: number | null = null; // Explicitly type as number | null
   const match = relation.url.match(/\/workItems\/(\d+)$/);
   if (match && match[1]) { // Ensure match[1] exists
     target_work_item_id = parseInt(match[1], 10);
   }

   return {
     source_work_item_id: sourceId,
     target_work_item_id: target_work_item_id,
     target_url: relation.url,
     rel_type: relation.rel,
     attributes: relation.attributes || {},
   };
}

async function syncData(supabaseClient: any) {
  if (!ADO_API_KEY) {
    // Update error message to reflect the correct secret name
    throw new Error("Missing AZURE_DEVOPS_PAT environment variable/secret."); 
  }
  console.log("Starting ADO data sync...");
  const syncStartTime = Date.now();

  try {
    // --- Sync Work Items and Relations ---
    console.log("Fetching all work items from ADO...");
    const adoWorkItems = await getAllWorkItems(ADO_API_KEY);
    console.log(`Fetched ${adoWorkItems.length} work items.`);

    if (adoWorkItems.length > 0) {
      const mappedWorkItems = adoWorkItems.map(mapWorkItemToDb).filter(Boolean);
      const mappedRelations: any[] = [];
      const parentUpdates: { id: number, parent_id: number }[] = [];

      adoWorkItems.forEach(item => {
        if (item.relations) {
          item.relations.forEach((rel: any) => {
            const mappedRel = mapRelationToDb(item.id, rel);
            if (mappedRel) {
              mappedRelations.push(mappedRel);
              // Specifically track parent relationships for direct update on work_items table
              if (rel.rel === 'System.LinkTypes.Hierarchy-Reverse' && mappedRel.target_work_item_id) {
                 parentUpdates.push({ id: item.id, parent_id: mappedRel.target_work_item_id });
              }
            }
          });
        }
      });
      
      console.log(`Mapped ${mappedWorkItems.length} work items and ${mappedRelations.length} relations.`);

      // TODO: Implement comparison logic (fetch existing rev/changed_date, compare, batch inserts/updates)
      // For now, using simple upsert for demonstration. Replace with refined logic.
      console.log("Upserting work items into Supabase...");
      const { error: workItemError } = await supabaseClient
        .from('ado_work_items')
        .upsert(mappedWorkItems, { onConflict: 'id', ignoreDuplicates: false }); // Update on conflict
      if (workItemError) throw workItemError;
      console.log("Work items upserted.");

      // Update parent_id separately (more complex with upsert, easier as separate update)
      if (parentUpdates.length > 0) {
         console.log(`Updating parent_id for ${parentUpdates.length} work items...`);
         // This might require multiple updates or a more complex SQL function for bulk updates
         for (const update of parentUpdates) {
            const { error: parentError } = await supabaseClient
               .from('ado_work_items')
               .update({ parent_id: update.parent_id })
               .eq('id', update.id);
            if (parentError) console.error(`Error updating parent for ${update.id}:`, parentError.message); // Log and continue
         }
         console.log("Parent IDs updated.");
      }

      // Sync Relations (Delete existing for source item, then insert new ones)
      // This is simpler than complex upsert logic for composite keys in Supabase JS client
      // Ensure mappedWorkItems doesn't contain nulls before mapping
      const validWorkItems = mappedWorkItems.filter(wi => wi !== null);
      const sourceIds = validWorkItems.map(wi => wi!.id); // Use non-null assertion after filtering
      if (sourceIds.length > 0) {
         console.log("Deleting existing relations for synced items...");
         const { error: deleteRelError } = await supabaseClient
            .from('ado_work_item_relations')
            .delete()
            .in('source_work_item_id', sourceIds);
         // Log error but continue, maybe relations just didn't exist yet
         if (deleteRelError) console.error("Error deleting old relations:", deleteRelError.message);
         else console.log("Old relations deleted.");

         if (mappedRelations.length > 0) {
            console.log("Inserting new relations...");
            const { error: insertRelError } = await supabaseClient
               .from('ado_work_item_relations')
               .insert(mappedRelations);
            if (insertRelError) throw insertRelError; // Throw if inserting new relations fails
            console.log("New relations inserted.");
         }
      }
    }

    // --- Sync Area Paths ---
    console.log("Fetching area paths from ADO...");
    const adoAreaPaths = await getAreaPaths(ADO_API_KEY);
    console.log(`Fetched ${adoAreaPaths.length} area paths.`);
    if (adoAreaPaths.length > 0) {
       // Add sync timestamp
       const pathsToUpsert = adoAreaPaths.map(p => ({ ...p, last_synced_at: new Date().toISOString() }));
       
       console.log("Upserting area paths into Supabase...");
       const { error: areaPathError } = await supabaseClient
         .from('ado_area_paths')
         .upsert(pathsToUpsert, { onConflict: 'id', ignoreDuplicates: false });
       if (areaPathError) throw areaPathError;
       console.log("Area paths upserted.");
    }

    // --- Sync Teams (Placeholder - Add fetchAdo call if needed) ---
    console.log("Syncing Teams (Placeholder)...");
    // const adoTeams = await fetchAdo(`...teams_url...`, ADO_API_KEY);
    // Map and upsert ado_teams table

    // --- Sync Work Item Types (Placeholder - Add fetchAdo call if needed) ---
    console.log("Syncing Work Item Types (Placeholder)...");
    // const adoTypes = await fetchAdo(`...types_url...`, ADO_API_KEY);
    // Map and upsert ado_work_item_types table

    const syncEndTime = Date.now();
    console.log(`ADO data sync completed successfully in ${syncEndTime - syncStartTime}ms.`);
    return { message: 'Sync successful' };

  } catch (error) {
    console.error('Error during ADO data sync:', error);
    // Consider logging error details to a Supabase table for monitoring
    throw error; // Re-throw error to indicate failure
  }
}


// --- Edge Function Handler ---

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Since direct ADO connection from Edge Function seems blocked, 
    // this function will not perform the sync.
    // We will move the sync logic to the frontend.
    
    console.log("sync-ado-data function invoked, but sync logic is disabled due to potential ADO access restrictions from Supabase servers.");
    
    return new Response(JSON.stringify({ 
      message: 'Sync logic disabled in Edge Function. Sync should be triggered from the frontend.',
      reason: 'Potential Azure DevOps IP restrictions or security policies blocking access from Supabase servers.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 OK but indicate sync is disabled
    });
  } catch (error) {
    console.error('Function error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/*
TODO:
1. The Edge Function cannot directly access Azure DevOps due to potential IP restrictions or security policies.
2. Implement the sync logic in the frontend instead, where the Azure DevOps API key is known to work.
3. The frontend can fetch data from Azure DevOps and then store it in Supabase for caching.
4. Update the frontend API functions to read from Supabase cache when possible.
*/

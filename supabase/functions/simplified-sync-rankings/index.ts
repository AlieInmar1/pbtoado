import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

// Item interface for type safety
interface ProductBoardItem {
  storyId: string;
  rank: number;
  name?: string;
  matchingId?: string;
  indentLevel?: number;
}

/**
 * Store all ranking items in the database, tracking changes
 */
async function storeRankingItems(
  supabase: any,
  workspaceId: string,
  boardId: string,
  rankings: ProductBoardItem[],
  syncHistoryId: string
): Promise<{ 
  newItems: number, 
  updatedItems: number, 
  changedItems: any[], 
  rankingIds: string[] 
}> {
  let newItems = 0;
  let updatedItems = 0;
  const changedItems: any[] = [];
  const rankingIds: string[] = [];
  
  for (const item of rankings) {
    // Check for existing record
    const { data: existingItem } = await supabase
      .from('productboard_item_rankings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('board_id', boardId)
      .eq('story_id', item.storyId)
      .single();
      
    if (existingItem) {
      // Only update if the rank has changed
      if (existingItem.current_rank !== item.rank) {
        // Update with previous rank tracking
        const { data: updatedItem, error } = await supabase
          .from('productboard_item_rankings')
          .update({
            story_name: item.name,
            previous_rank: existingItem.current_rank,
            current_rank: item.rank,
            updated_at: new Date().toISOString(),
            indent_level: item.indentLevel,
            matching_id: item.matchingId,
            sync_history_id: syncHistoryId,
            is_synced_to_ado: false
          })
          .eq('id', existingItem.id)
          .select()
          .single();
          
        if (!error && updatedItem) {
          updatedItems++;
          rankingIds.push(updatedItem.id);
          
          // Add to changed items if the rank has changed
          if (updatedItem.current_rank !== updatedItem.previous_rank) {
            changedItems.push({
              id: updatedItem.id,
              storyId: item.storyId,
              name: item.name || existingItem.story_name,
              currentRank: item.rank,
              previousRank: existingItem.current_rank,
              change: Math.abs(item.rank - existingItem.current_rank),
              direction: item.rank < existingItem.current_rank ? 'up' : 'down'
            });
          }
        }
      } else {
        // Just update the sync_history_id
        await supabase
          .from('productboard_item_rankings')
          .update({
            sync_history_id: syncHistoryId,
            story_name: item.name || existingItem.story_name,
            indent_level: item.indentLevel,
            matching_id: item.matchingId || existingItem.matching_id
          })
          .eq('id', existingItem.id);
          
        rankingIds.push(existingItem.id);
      }
    } else {
      // Insert new record
      const { data: newItem, error } = await supabase
        .from('productboard_item_rankings')
        .insert({
          workspace_id: workspaceId,
          board_id: boardId,
          story_id: item.storyId,
          story_name: item.name,
          current_rank: item.rank,
          indent_level: item.indentLevel,
          matching_id: item.matchingId,
          sync_history_id: syncHistoryId,
          is_synced_to_ado: false
        })
        .select()
        .single();
        
      if (!error && newItem) {
        newItems++;
        rankingIds.push(newItem.id);
        
        // Add all new items to changed items list
        changedItems.push({
          id: newItem.id,
          storyId: item.storyId,
          name: item.name,
          currentRank: item.rank,
          previousRank: null,
          change: null,
          direction: 'new'
        });
      }
    }
  }
  
  return {
    newItems,
    updatedItems,
    changedItems,
    rankingIds
  };
}

// Update Azure DevOps work items with new rankings
async function updateAzureDevOpsRankings(
  supabase: any,
  workspaceId: string,
  rankings: ProductBoardItem[],
  rankingIds: string[] = []
): Promise<{ success: boolean, updatedCount: number, errors: string[] }> {
  const errors: string[] = [];
  let updatedCount = 0;
  
  // Get Azure DevOps configuration
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, ado_api_key, ado_project_id')
    .eq('id', workspaceId)
    .single();
  
  if (workspaceError || !workspace) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: [`Failed to get workspace: ${workspaceError?.message || 'Workspace not found'}`] 
    };
  }
  
  // Get entity mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('entity_mappings')
    .select('id, productboard_id, ado_id')
    .eq('workspace_id', workspaceId);
  
  if (mappingsError) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: [`Failed to get entity mappings: ${mappingsError.message}`] 
    };
  }
  
  // Create ID map
  const idMap = new Map<string, string>();
  for (const mapping of mappings) {
    idMap.set(mapping.productboard_id, mapping.ado_id);
  }
  
  // Extract organization and project
  const [organization, project] = (workspace.ado_project_id || '').split('/');
  
  if (!organization || !project || !workspace.ado_api_key) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: ['Azure DevOps configuration is incomplete'] 
    };
  }
  
  // Update each work item
  for (const ranking of rankings) {
    // Get ADO ID from mapping or matchingId
    let adoId = idMap.get(ranking.storyId);
    
    if (ranking.matchingId && /^(\d+|AB#\d+)$/i.test(ranking.matchingId)) {
      adoId = ranking.matchingId.replace(/^AB#/i, '');
    }
    
    if (!adoId) {
      errors.push(`No mapping found for ProductBoard story ${ranking.storyId}`);
      continue;
    }
    
    try {
      // Call Azure DevOps API
      const response = await fetch(
        `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${adoId}?api-version=7.0`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json-patch+json',
            'Authorization': `Basic ${btoa(`:${workspace.ado_api_key}`)}`,
          },
          body: JSON.stringify([
            {
              op: 'add',
              path: '/fields/Microsoft.VSTS.Common.StackRank',
              value: ranking.rank
            }
          ]),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        errors.push(`Failed to update work item ${adoId}: ${errorData.message || response.statusText}`);
      } else {
        updatedCount++;
        
        // Update the database to mark this item as synced to ADO
        if (rankingIds.length > 0) {
          const rankingId = rankingIds.find(id => {
            return rankings.some(r => r.storyId === ranking.storyId);
          });
          
          if (rankingId) {
            await supabase
              .from('productboard_item_rankings')
              .update({
                is_synced_to_ado: true,
                synced_to_ado_at: new Date().toISOString()
              })
              .eq('id', rankingId);
          }
        }
      }
    } catch (error) {
      errors.push(`Error updating work item ${adoId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    success: errors.length === 0,
    updatedCount,
    errors
  };
}

// Main handler for the Supabase function
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { 
      workspace_id, 
      board_id, 
      rankings = [], // Accept pre-extracted rankings
      sync_to_ado = false 
    } = await req.json();
    
    if (!workspace_id || !board_id) {
      return new Response(
        JSON.stringify({ error: 'workspace_id and board_id are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No ranking data provided' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Create sync history record
    const { data: syncRecord, error: syncRecordError } = await supabase
      .from('productboard_sync_history')
      .insert({
        workspace_id,
        board_id,
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (syncRecordError) {
      return new Response(
        JSON.stringify({ error: `Failed to create sync record: ${syncRecordError.message}` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Store rankings in the database
    const rankingResult = await storeRankingItems(
      supabase, 
      workspace_id, 
      board_id, 
      rankings, 
      syncRecord.id
    );
    
    // If sync_to_ado is true, update Azure DevOps work items with new rankings
    let adoResult = { success: true, updatedCount: 0, errors: [] };
    
    if (sync_to_ado) {
      adoResult = await updateAzureDevOpsRankings(
        supabase, 
        workspace_id, 
        rankings, 
        rankingResult.rankingIds
      );
    }
    
    // Update sync history record
    await supabase
      .from('productboard_sync_history')
      .update({
        status: (sync_to_ado && !adoResult.success) ? 'failed' : 'completed',
        item_count: rankings.length,
        updated_count: adoResult.updatedCount,
        error_message: adoResult.errors.join('\n') || null,
        rankings_stored: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncRecord.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: sync_to_ado 
          ? `Synchronized ${adoResult.updatedCount} of ${rankings.length} items to Azure DevOps`
          : 'Rankings stored successfully',
        newItems: rankingResult.newItems,
        updatedItems: rankingResult.updatedItems,
        changedItems: rankingResult.changedItems,
        adoErrors: adoResult.errors
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SyncStoryRequest {
  storyId: string;
  direction: 'pb_to_ado' | 'ado_to_pb' | 'bidirectional';
}

// Helper function to apply field mappings
function applyFieldMappings(
  source: Record<string, any>,
  mappings: any[],
  direction: 'pb_to_ado' | 'ado_to_pb'
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const mapping of mappings) {
    const sourceField = direction === 'pb_to_ado' ? mapping.pb_field : mapping.ado_field;
    const targetField = direction === 'pb_to_ado' ? mapping.ado_field : mapping.pb_field;
    
    if (!sourceField || !targetField) continue;
    
    let value = source[sourceField];
    
    // Apply mapping rules based on mapping type
    switch (mapping.mapping_type) {
      case 'direct':
        // Direct mapping, just copy the value
        result[targetField] = value;
        break;
        
      case 'transform':
        // Apply transformation rules
        if (mapping.mapping_rules?.transforms && value in mapping.mapping_rules.transforms) {
          result[targetField] = mapping.mapping_rules.transforms[value];
        } else {
          result[targetField] = value;
        }
        break;
        
      case 'lookup':
        // Apply lookup table
        if (mapping.mapping_rules?.lookupTable && value in mapping.mapping_rules.lookupTable) {
          result[targetField] = mapping.mapping_rules.lookupTable[value];
        } else {
          result[targetField] = value;
        }
        break;
        
      // Special mapping types for hierarchy
      case 'epic_business_unit':
        if (source.level === 'epic') {
          result[targetField] = value;
        }
        break;
        
      case 'feature_product_code':
        if (source.level === 'feature') {
          result[targetField] = value;
        }
        break;
        
      case 'story_team':
        if (source.level === 'story') {
          result[targetField] = value;
        }
        break;
        
      default:
        // Unknown mapping type, just copy the value
        result[targetField] = value;
    }
  }
  
  return result;
}

// Helper function to create Azure DevOps client
function createAzureDevOpsClient(organization: string, project: string, apiKey: string) {
  // Create the Azure DevOps API URL
  const baseUrl = `https://dev.azure.com/${organization}/${project}/_apis`;
  
  return {
    // Get a work item by ID
    async getWorkItem(id: string) {
      const response = await fetch(`${baseUrl}/wit/workitems/${id}?api-version=7.0`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`:${apiKey}`)}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get work item ${id}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Create a new work item
    async createWorkItem(workItemType: string, fields: Record<string, any>) {
      // Convert fields to the format expected by the Azure DevOps API
      const operations = Object.entries(fields).map(([key, value]) => ({
        op: 'add',
        path: `/fields/${key}`,
        value,
      }));
      
      const response = await fetch(`${baseUrl}/wit/workitems/$${workItemType}?api-version=7.0`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Authorization': `Basic ${btoa(`:${apiKey}`)}`,
        },
        body: JSON.stringify(operations),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create work item: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Update an existing work item
    async updateWorkItem(id: string, fields: Record<string, any>) {
      // Convert fields to the format expected by the Azure DevOps API
      const operations = Object.entries(fields).map(([key, value]) => ({
        op: 'replace',
        path: `/fields/${key}`,
        value,
      }));
      
      const response = await fetch(`${baseUrl}/wit/workitems/${id}?api-version=7.0`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Authorization': `Basic ${btoa(`:${apiKey}`)}`,
        },
        body: JSON.stringify(operations),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update work item ${id}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Create a parent-child relationship between two work items
    async createParentChildRelationship(parentId: string, childId: string) {
      const operations = [
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: `${baseUrl}/wit/workItems/${childId}`,
            attributes: {
              comment: 'Added parent-child relationship',
            },
          },
        },
      ];
      
      const response = await fetch(`${baseUrl}/wit/workitems/${parentId}?api-version=7.0`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Authorization': `Basic ${btoa(`:${apiKey}`)}`,
        },
        body: JSON.stringify(operations),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create parent-child relationship: ${response.statusText}`);
      }
      
      return await response.json();
    },
  };
}

// Helper function to create ProductBoard client
function createProductBoardClient(apiKey: string) {
  const baseUrl = 'https://api.productboard.com';
  
  return {
    // Get a feature by ID
    async getFeature(id: string) {
      const response = await fetch(`${baseUrl}/features/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Version': '1',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get feature ${id}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Create a new feature
    async createFeature(data: Record<string, any>) {
      const response = await fetch(`${baseUrl}/features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Version': '1',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create feature: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Update an existing feature
    async updateFeature(id: string, data: Record<string, any>) {
      const response = await fetch(`${baseUrl}/features/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Version': '1',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update feature ${id}: ${response.statusText}`);
      }
      
      return await response.json();
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { storyId, direction }: SyncStoryRequest = await req.json();

    // Get story and workspace data
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        workspaces (
          id,
          pb_api_key,
          ado_api_key,
          pb_board_id,
          ado_project_id,
          ado_organization
        )
      `)
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        workspace_id: story.workspace_id,
        story_id: storyId,
        direction,
        status: 'started',
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // Get field mappings
      const { data: fieldMappings } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('workspace_id', story.workspace_id);

      // Extract workspace data
      const workspace = story.workspaces;
      
      // Parse ADO project ID to get organization and project
      const [organization, project] = workspace.ado_project_id.split('/');
      
      // Create API clients
      const adoClient = createAzureDevOpsClient(
        workspace.ado_organization || organization,
        project,
        workspace.ado_api_key
      );
      
      const pbClient = createProductBoardClient(workspace.pb_api_key);

      // Perform sync based on direction
      if (direction === 'pb_to_ado' || direction === 'bidirectional') {
        // Sync from Productboard to Azure DevOps
        if (story.pb_id && !story.ado_id) {
          // Story exists in ProductBoard but not in ADO, create it in ADO
          const adoFields = applyFieldMappings(story, fieldMappings, 'pb_to_ado');
          
          // Determine the work item type based on the story level
          let workItemType = 'User Story';
          if (story.level === 'epic') {
            workItemType = 'Epic';
          } else if (story.level === 'feature') {
            workItemType = 'Feature';
          }
          
          // Create the work item in ADO
          const adoWorkItem = await adoClient.createWorkItem(workItemType, adoFields);
          
          // Update the story with the ADO ID
          await supabase
            .from('stories')
            .update({
              ado_id: adoWorkItem.id.toString(),
              ado_title: adoWorkItem.fields['System.Title'],
            })
            .eq('id', storyId);
            
          // If the story has a parent, create the parent-child relationship in ADO
          if (story.parent_id) {
            const { data: parentStory } = await supabase
              .from('stories')
              .select('ado_id')
              .eq('id', story.parent_id)
              .single();
              
            if (parentStory && parentStory.ado_id) {
              await adoClient.createParentChildRelationship(
                parentStory.ado_id,
                adoWorkItem.id.toString()
              );
            }
          }
        } else if (story.pb_id && story.ado_id) {
          // Story exists in both systems, update ADO
          const adoFields = applyFieldMappings(story, fieldMappings, 'pb_to_ado');
          
          // Update the work item in ADO
          const adoWorkItem = await adoClient.updateWorkItem(story.ado_id, adoFields);
          
          // Update the story with the latest ADO title
          await supabase
            .from('stories')
            .update({
              ado_title: adoWorkItem.fields['System.Title'],
            })
            .eq('id', storyId);
        }
      }

      if (direction === 'ado_to_pb' || direction === 'bidirectional') {
        // Sync from Azure DevOps to Productboard
        // This is a mock implementation for now
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update sync log
      await supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Update story
      await supabase
        .from('stories')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          sync_error: null,
          sync_retries: 0,
        })
        .eq('id', storyId);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      // Update sync log with error
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Update story
      await supabase
        .from('stories')
        .update({
          sync_status: 'error',
          sync_error: error.message,
          sync_retries: story.sync_retries + 1,
        })
        .eq('id', storyId);

      throw error;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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

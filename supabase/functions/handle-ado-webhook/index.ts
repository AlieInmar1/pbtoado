import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
};

// ADO webhook payload interface for work item created/updated events
interface ADOWorkItemWebhookPayload {
  subscriptionId: string;
  notificationId: number;
  id: string;
  eventType: string;
  publisherId: string;
  message: {
    text: string;
    html: string;
    markdown: string;
  };
  detailedMessage: {
    text: string;
    html: string;
    markdown: string;
  };
  resource: {
    id: number;
    workItemId: number;
    revision: {
      id: number;
      rev: number;
      fields: {
        'System.Id': number;
        'System.Title': string;
        'System.State': string;
        'System.WorkItemType': string;
        'System.Description'?: string;
        [key: string]: any;
      };
      url: string;
    };
    fields: {
      'System.Id': number;
      'System.Title': string;
      'System.State': string;
      'System.WorkItemType': string;
      'System.Description'?: string;
      [key: string]: any;
    };
    _links: {
      self: {
        href: string;
      };
      workItemUpdates: {
        href: string;
      };
      parent: {
        href: string;
      };
      [key: string]: {
        href: string;
      };
    };
    url: string;
  };
  resourceVersion: string;
  resourceContainers: {
    collection: {
      id: string;
      baseUrl: string;
    };
    account: {
      id: string;
      baseUrl: string;
    };
    project: {
      id: string;
      baseUrl: string;
    };
  };
  createdDate: string;
}

// Feature flag to control whether to actually update ADO work items
const ENABLE_ADO_UPDATES = false;

// Feature flag to control whether to update ProductBoard items
const ENABLE_PB_UPDATES = false;

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const payload = await req.json() as ADOWorkItemWebhookPayload;
    
    console.log('Received ADO webhook:', {
      eventType: payload.eventType,
      workItemId: payload.resource.workItemId,
      workItemType: payload.resource.fields['System.WorkItemType'],
      title: payload.resource.fields['System.Title']
    });
    
    // Process based on event type
    if (payload.eventType === 'workitem.created') {
      await handleWorkItemCreated(supabase, payload);
    } else if (payload.eventType === 'workitem.updated') {
      await handleWorkItemUpdated(supabase, payload);
    } else {
      console.log(`Ignoring unsupported event type: ${payload.eventType}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${payload.eventType} event for work item ${payload.resource.workItemId}`,
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
    console.error('Error processing ADO webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined,
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

/**
 * Handle a work item created event
 */
async function handleWorkItemCreated(supabase: any, payload: ADOWorkItemWebhookPayload) {
  const workItemId = payload.resource.workItemId.toString();
  const workItemType = payload.resource.fields['System.WorkItemType'];
  const title = payload.resource.fields['System.Title'];
  const state = payload.resource.fields['System.State'];
  const url = payload.resource.url;
  
  console.log(`Processing work item created: ${workItemId} (${workItemType}): ${title}`);
  
  // Look for a matching entity in our database based on title
  // This is a simple approach - in production you might need more sophisticated matching
  const { data: existingMappings, error: mappingError } = await supabase
    .from('entity_mappings')
    .select('*')
    .eq('productboard_name', title)
    .is('ado_id', null); // Only get mappings that don't have an ADO ID yet
  
  if (mappingError) {
    console.error('Error looking up entity mapping:', mappingError);
    return;
  }
  
  if (existingMappings && existingMappings.length > 0) {
    // Found a matching entity - update it with the ADO ID
    const mapping = existingMappings[0];
    console.log(`Found matching entity mapping: ${mapping.id} (${mapping.productboard_name})`);
    
    // Update the entity mapping with ADO details
    const { error: updateError } = await supabase
      .from('entity_mappings')
      .update({
        ado_id: workItemId,
        ado_type: workItemType,
        ado_title: title,
        ado_state: state,
        ado_url: url,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mapping.id);
    
    if (updateError) {
      console.error('Error updating entity mapping:', updateError);
      return;
    }
    
    console.log(`Updated entity mapping ${mapping.id} with ADO ID ${workItemId}`);
    
    // If this is a story (sub-feature), update the title in ADO to include the PB ID
    if (workItemType === 'User Story' || workItemType === 'Story' || workItemType === 'Product Backlog Item') {
      await updateADOWorkItemTitle(supabase, workItemId, mapping.productboard_id, title);
    }
  } else {
    // No matching entity found - create a new one
    console.log(`No matching entity found for work item ${workItemId} (${title})`);
    
    // Create a new entity mapping
    const { error: createError } = await supabase
      .from('entity_mappings')
      .insert({
        ado_id: workItemId,
        ado_type: workItemType,
        ado_title: title,
        ado_state: state,
        ado_url: url,
        productboard_id: null, // We don't have a PB ID yet
        productboard_type: mapADOTypeToPBType(workItemType),
        productboard_name: title,
        sync_status: 'pending', // Mark as pending since we don't have a PB ID
        sync_direction: 'ado_to_pb',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (createError) {
      console.error('Error creating entity mapping:', createError);
      return;
    }
    
    console.log(`Created new entity mapping for ADO work item ${workItemId}`);
  }
}

/**
 * Handle a work item updated event
 */
async function handleWorkItemUpdated(supabase: any, payload: ADOWorkItemWebhookPayload) {
  const workItemId = payload.resource.workItemId.toString();
  const workItemType = payload.resource.fields['System.WorkItemType'];
  const title = payload.resource.fields['System.Title'];
  const state = payload.resource.fields['System.State'];
  
  console.log(`Processing work item updated: ${workItemId} (${workItemType}): ${title}`);
  
  // Look for a matching entity in our database
  const { data: existingMappings, error: mappingError } = await supabase
    .from('entity_mappings')
    .select('*')
    .eq('ado_id', workItemId);
  
  if (mappingError) {
    console.error('Error looking up entity mapping:', mappingError);
    return;
  }
  
  if (existingMappings && existingMappings.length > 0) {
    // Found a matching entity - update it
    const mapping = existingMappings[0];
    console.log(`Found matching entity mapping: ${mapping.id} (${mapping.productboard_name})`);
    
    // Check if the title has been changed and doesn't include the PB ID prefix
    const pbIdPrefix = mapping.productboard_id ? `[PB${mapping.productboard_id}]` : null;
    const titleChanged = mapping.ado_title !== title;
    const needsPrefixUpdate = pbIdPrefix && titleChanged && !title.includes(pbIdPrefix);
    
    // Update the entity mapping with the latest ADO details
    const { error: updateError } = await supabase
      .from('entity_mappings')
      .update({
        ado_title: title,
        ado_state: state,
        sync_status: needsPrefixUpdate ? 'pending' : 'synced',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mapping.id);
    
    if (updateError) {
      console.error('Error updating entity mapping:', updateError);
      return;
    }
    
    console.log(`Updated entity mapping ${mapping.id} with latest ADO details`);
    
    // If this is a story and the title was changed, update it to include the PB ID
    if (needsPrefixUpdate && (workItemType === 'User Story' || workItemType === 'Story' || workItemType === 'Product Backlog Item')) {
      await updateADOWorkItemTitle(supabase, workItemId, mapping.productboard_id, title);
    }
  } else {
    // No matching entity found - create a new one
    console.log(`No matching entity found for work item ${workItemId} (${title})`);
    
    // Create a new entity mapping
    const { error: createError } = await supabase
      .from('entity_mappings')
      .insert({
        ado_id: workItemId,
        ado_type: workItemType,
        ado_title: title,
        ado_state: state,
        ado_url: payload.resource.url,
        productboard_id: null, // We don't have a PB ID yet
        productboard_type: mapADOTypeToPBType(workItemType),
        productboard_name: title,
        sync_status: 'pending', // Mark as pending since we don't have a PB ID
        sync_direction: 'ado_to_pb',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (createError) {
      console.error('Error creating entity mapping:', createError);
      return;
    }
    
    console.log(`Created new entity mapping for ADO work item ${workItemId}`);
  }
}

/**
 * Update an ADO work item title to include the PB ID prefix
 */
async function updateADOWorkItemTitle(supabase: any, adoId: string, pbId: string, currentTitle: string) {
  if (!ENABLE_ADO_UPDATES) {
    console.log(`[DRY RUN] Would update ADO work item ${adoId} title to include PB ID ${pbId}`);
    return;
  }
  
  if (!pbId) {
    console.log(`Cannot update ADO work item ${adoId} title - no PB ID available`);
    return;
  }
  
  // Check if the title already has the prefix
  const pbIdPrefix = `[PB${pbId}]`;
  if (currentTitle.includes(pbIdPrefix)) {
    console.log(`ADO work item ${adoId} title already includes PB ID prefix`);
    return;
  }
  
  try {
    // Get the ADO API configuration
    const { data: configs, error: configError } = await supabase
      .from('configurations')
      .select('ado_api_key, ado_organization, ado_project_id')
      .eq('id', '1')
      .single();
    
    if (configError) {
      console.error('Error fetching ADO configuration:', configError);
      return;
    }
    
    if (!configs || !configs.ado_api_key || !configs.ado_organization || !configs.ado_project_id) {
      console.error('Missing ADO configuration');
      return;
    }
    
    // Create the authorization header
    const credentials = `:${configs.ado_api_key}`;
    const encodedCredentials = btoa(credentials);
    const authHeader = `Basic ${encodedCredentials}`;
    
    // Build the API URL
    const apiUrl = `https://dev.azure.com/${configs.ado_organization}/${configs.ado_project_id}/_apis/wit/workitems/${adoId}?api-version=7.0`;
    
    // Create the patch document
    const patchDocument = [
      {
        op: 'replace',
        path: '/fields/System.Title',
        value: `${pbIdPrefix} ${currentTitle}`
      }
    ];
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': authHeader
      },
      body: JSON.stringify(patchDocument)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating ADO work item title: ${response.status} ${response.statusText}`, errorText);
      return;
    }
    
    console.log(`Successfully updated ADO work item ${adoId} title to include PB ID ${pbId}`);
    
    // Update the entity mapping to reflect the new title
    const { error: updateError } = await supabase
      .from('entity_mappings')
      .update({
        ado_title: `${pbIdPrefix} ${currentTitle}`,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('ado_id', adoId);
    
    if (updateError) {
      console.error('Error updating entity mapping after title update:', updateError);
    }
  } catch (error) {
    console.error('Error updating ADO work item title:', error);
  }
}

/**
 * Map an ADO work item type to a ProductBoard type
 */
function mapADOTypeToPBType(adoType: string): string {
  switch (adoType.toLowerCase()) {
    case 'epic':
      return 'initiative';
    case 'feature':
      return 'feature';
    case 'user story':
    case 'story':
    case 'product backlog item':
    case 'task':
    case 'bug':
      return 'feature'; // Sub-features in ProductBoard are still "features"
    default:
      return 'feature';
  }
}

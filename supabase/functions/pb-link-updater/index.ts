import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing Supabase credentials');
}
const supabase = createClient(supabaseUrl, serviceRoleKey);
console.log('Supabase client initialized.');

// Get ProductBoard API Token and session cookie - for automation and UI interaction
const pbApiToken = Deno.env.get('PB_API_TOKEN');
const pbSessionToken = Deno.env.get('PB_SESSION_TOKEN');
if (!pbApiToken) {
  console.error('FATAL: Missing PB_API_TOKEN environment variable');
} else {
  console.log('ProductBoard API token loaded.');
}
if (!pbSessionToken) {
  console.error('WARNING: Missing PB_SESSION_TOKEN environment variable. UI automation will not work.');
} else {
  console.log('ProductBoard session token loaded.');
}

async function updateProductBoardLink(
  pbId: string, 
  adoUrl: string, 
  adoId: number,
  logEntryId: string | null
): Promise<{ success: boolean; message: string }> {
  // Validate inputs
  if (!pbId || !adoUrl || !adoId) {
    const message = 'Missing required parameters: pbId, adoUrl, or adoId';
    console.error(message);
    return { success: false, message };
  }

  if (!pbApiToken) {
    const message = 'Unable to update ProductBoard link: Missing PB_API_TOKEN';
    console.error(message);
    return { success: false, message };
  }

  try {
    // 1. Get current integrations for the feature
    console.log(`Fetching integrations for PB feature ${pbId}...`);
    const fetchResponse = await fetch(`https://api.productboard.com/features/${pbId}/integrations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pbApiToken}`,
        'Content-Type': 'application/json',
        'X-Version': '1'
      }
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      const message = `Failed to fetch PB integrations: ${fetchResponse.status} ${errorText}`;
      console.error(message);
      return { success: false, message };
    }

    const integrations = await fetchResponse.json();
    console.log(`Current integrations for feature ${pbId}:`, JSON.stringify(integrations, null, 2));

    // 2. Check if integration for this ADO ID already exists
    let integrationExists = false;
    let existingIntegrationId = null;

    if (integrations?.data?.length > 0) {
      for (const integration of integrations.data) {
        // Look at the URL or ID/name fields to see if this ADO item is already integrated
        if (
          integration.type === 'azure-devops' && 
          (integration.url === adoUrl || 
           (integration.externalId && integration.externalId.toString() === adoId.toString()) ||
           (integration.name && integration.name.includes(`#${adoId}`)))
        ) {
          integrationExists = true;
          existingIntegrationId = integration.id;
          console.log(`Found existing integration with id ${existingIntegrationId} for ADO item ${adoId}`);
          break;
        }
      }
    }

    // 3. Create or update the integration
    let operationResult;
    if (integrationExists && existingIntegrationId) {
      console.log(`Updating existing integration ${existingIntegrationId} for PB feature ${pbId}`);
      const updateResponse = await fetch(`https://api.productboard.com/features/${pbId}/integrations/${existingIntegrationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${pbApiToken}`,
          'Content-Type': 'application/json',
          'X-Version': '1'
        },
        body: JSON.stringify({
          type: 'azure-devops',
          name: `ADO User Story #${adoId}`,
          url: adoUrl,
          externalId: adoId.toString()
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        const message = `Failed to update PB integration: ${updateResponse.status} ${errorText}`;
        console.error(message);
        return { success: false, message };
      }

      operationResult = await updateResponse.json();
      console.log(`Successfully updated integration:`, JSON.stringify(operationResult, null, 2));
    } else {
      console.log(`Creating new integration for PB feature ${pbId}`);
      const createResponse = await fetch(`https://api.productboard.com/features/${pbId}/integrations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pbApiToken}`,
          'Content-Type': 'application/json',
          'X-Version': '1'
        },
        body: JSON.stringify({
          type: 'azure-devops',
          name: `ADO User Story #${adoId}`,
          url: adoUrl,
          externalId: adoId.toString()
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        const message = `Failed to create PB integration: ${createResponse.status} ${errorText}`;
        console.error(message);
        return { success: false, message };
      }

      operationResult = await createResponse.json();
      console.log(`Successfully created integration:`, JSON.stringify(operationResult, null, 2));
    }

    // 4. Update log in database if log entry ID was provided
    if (logEntryId) {
      console.log(`Updating log entry ${logEntryId} with link success status`);
      const { error } = await supabase
        .from('pb_ado_automation_logs')
        .update({ 
          status: 'link_updated',
          details: `Successfully ${integrationExists ? 'updated' : 'created'} link to ADO work item #${adoId}`
        })
        .eq('id', logEntryId);
      
      if (error) {
        console.error(`Failed to update log entry: ${error.message}`);
      }
    }

    return { 
      success: true, 
      message: `Successfully ${integrationExists ? 'updated' : 'created'} integration link for feature ${pbId} to ADO item ${adoId}`
    };
  } catch (error) {
    const message = `Error updating ProductBoard link: ${error.message}`;
    console.error(message);
    
    // Update log in database if log entry ID was provided
    if (logEntryId) {
      supabase
        .from('pb_ado_automation_logs')
        .update({ 
          status: 'link_error',
          details: `Error updating link: ${error.message}`
        })
        .eq('id', logEntryId)
        .then();
    }
    
    return { success: false, message };
  }
}

// Main API handler
serve(async (req) => {
  console.log(`---> Received request: ${req.method} ${req.url}`);

  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Handle GET request
    if (req.method === 'GET') {
      console.log('Handling simple GET request');
      return new Response('ProductBoard Link Updater Endpoint is active.', { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain', ...corsHeaders } 
      });
    }

    // Handle POST request
    if (req.method === 'POST') {
      console.log('Handling POST request');
      
      // Parse request body
      const requestText = await req.text();
      if (!requestText) {
        return new Response(JSON.stringify({ error: 'Empty request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const requestData = JSON.parse(requestText);
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      
      const pbId = requestData.productboard_id;
      const adoId = requestData.ado_work_item_id;
      const adoUrl = requestData.ado_work_item_url;
      const logEntryId = requestData.log_entry_id || null;
      
      if (!pbId || !adoId || !adoUrl) {
        return new Response(JSON.stringify({ error: 'Missing required fields: productboard_id, ado_work_item_id, or ado_work_item_url' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Log the request in database
      if (!logEntryId) {
        console.log('Creating new log entry for link update operation');
        const { data: logData, error: logError } = await supabase
          .from('pb_ado_automation_logs')
          .insert({
            event_type: 'link_update',
            pb_item_id: pbId,
            pb_item_type: 'feature',
            status: 'link_update_started',
            details: `Updating link for PB feature ${pbId} to ADO work item ${adoId}`,
            payload: requestData,
          })
          .select('id')
          .single();
        
        if (logError) {
          console.error('Failed to create log entry:', logError);
        } else if (logData) {
          console.log(`Created log entry with ID ${logData.id}`);
          requestData.log_entry_id = logData.id;
        }
      }
      
      // Update the link in ProductBoard
      const updateResult = await updateProductBoardLink(
        pbId, 
        adoUrl, 
        adoId, 
        requestData.log_entry_id || null
      );
      
      if (updateResult.success) {
        return new Response(JSON.stringify({ success: true, message: updateResult.message }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: updateResult.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Fallback for unhandled methods
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Allow': 'GET, POST, OPTIONS' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

console.log('pb-link-updater function started for integrating ADO items with ProductBoard.');

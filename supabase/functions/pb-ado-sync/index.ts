import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts'; // Import CORS headers

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) {
  console.error('FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing Supabase credentials');
}
const supabase = createClient(supabaseUrl, serviceRoleKey);
console.log('Supabase client initialized.');

// Get ProductBoard API Token
const pbApiToken = Deno.env.get('PB_API_TOKEN');
if (!pbApiToken) {
  console.error('FATAL: Missing PB_API_TOKEN environment variable');
} else {
  console.log('ProductBoard API token loaded.');
}

// Get ADO Credentials
const adoOrg = Deno.env.get('ADO_ORG');
const adoProject = Deno.env.get('ADO_PROJECT');
const adoPat = Deno.env.get('ADO_PAT');
if (!adoOrg || !adoProject || !adoPat) {
    console.error('FATAL: Missing ADO_ORG, ADO_PROJECT, or ADO_PAT environment variables');
} else {
    console.log('ADO credentials loaded.');
}

// Get ADO Sync Enable/Disable Flag
const adoSyncEnabled = Deno.env.get('ADO_SYNC_ENABLED') === 'true';
console.log(`ADO sync is ${adoSyncEnabled ? 'ENABLED' : 'DISABLED'} (controlled by ADO_SYNC_ENABLED env var)`);


// Function to verify the webhook signature
async function verifySignature(req: Request): Promise<boolean> {
  const expectedSecret = Deno.env.get('PB_WEBHOOK_SECRET');
  if (!expectedSecret) {
    console.error('Verification Error: PB_WEBHOOK_SECRET environment variable not set.');
    return false;
  }

  const signature = req.headers.get('authorization');
  console.log(`Received signature: ${signature ? 'Present' : 'Missing'}`);

  if (!signature) {
    console.warn('Verification Warning: Missing authorization header in webhook request.');
    return false;
  }

  const isValid = signature === expectedSecret;
  console.log(`Signature valid: ${isValid}`);
  return isValid;
}

// Helper Functions

/**
 * Extract content from a specific note type
 */
function extractNoteContent(notes: any[] = [], type: string): string {
  if (!notes || !Array.isArray(notes)) return '';
  const note = notes.find(n => n.type === type);
  return note ? note.content : '';
}

/**
 * Extract all required fields from ProductBoard API response
 */
function extractProductBoardFields(pbItemData: any) {
  // Basic fields
  const name = pbItemData?.data?.name || '';
  const description = pbItemData?.data?.description || '';
  const type = pbItemData?.data?.type || 'feature'; // 'feature', 'task', 'epic', 'initiative'
  const parentId = pbItemData?.data?.parent_id || null;
  const status = pbItemData?.data?.status?.name || '';
  const productId = pbItemData?.data?.product_id || null;
  const componentId = pbItemData?.data?.component_id || null;
  
  // Custom fields
  const customFields = pbItemData?.data?.custom_fields || {};
  const storyPoints = customFields.effort ? Number(customFields.effort) : null;
  const investmentCategory = customFields.investment_category || null;
  const growthDriver = customFields.growth_driver === true || customFields.growth_driver === 'true';
  const tentpole = customFields.tentpole === true || customFields.tentpole === 'true';
  const targetDate = customFields.timeframe || null;
  const owner = customFields.owner || null;
  
  // Notes - extract specific note types
  const notes = pbItemData?.data?.notes || [];
  const acceptanceCriteria = extractNoteContent(notes, 'acceptance_criteria');
  const customerNeed = extractNoteContent(notes, 'customer_need');
  const technicalNotes = extractNoteContent(notes, 'technical_notes');
  
  // Links - could be useful for referencing external resources
  const links = pbItemData?.data?.links || [];
  
  return {
    name,
    description,
    type,
    parentId,
    status,
    productId,
    componentId,
    customFields: {
      storyPoints,
      investmentCategory,
      growthDriver,
      tentpole,
      targetDate,
      owner
    },
    notes: {
      acceptanceCriteria,
      customerNeed,
      technicalNotes
    },
    links
  };
}

// Function to extract hierarchyEntity.id from URL
function extractHierarchyEntityId(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.searchParams.get('hierarchyEntity.id');
  } catch (e) {
    console.error('Error parsing target URL:', e);
    return null;
  }
}

// Simple Base64 encoding function
function simpleBtoa(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const bytes = new TextEncoder().encode(str);

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : NaN;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : NaN;

    const char1 = byte1 >> 2;
    const char2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const char3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const char4 = byte3 & 63;

    output += chars.charAt(char1);
    output += chars.charAt(char2);
    output += isNaN(byte2) ? '=' : chars.charAt(char3);
    output += isNaN(byte3) ? '=' : chars.charAt(char4);
  }
  return output;
}


// Main API handler
serve(async (req) => {
  console.log(`---> Received request: ${req.method} ${req.url}`);
  let logEntryId: string | null = null; // Define logEntryId early

  try { // Wrap main logic in a try block

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Handle ProductBoard webhook validation (GET request with validationToken)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const validationToken = url.searchParams.get('validationToken');
      if (validationToken) {
        console.log('Handling ProductBoard webhook validation request');
        return new Response(validationToken, { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } });
      } else {
        console.log('Handling simple GET request');
        return new Response('ProductBoard ADO Sync Webhook Endpoint is active.', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } });
      }
    }

    // Handle actual webhook events (POST request)
    if (req.method === 'POST') {
      console.log('Handling POST request (webhook event)');

      const isVerified = await verifySignature(req);
      if (!isVerified) {
        console.error('Webhook verification failed. Returning 401.');
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid signature' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      console.log('Webhook signature verified successfully.');

      let payload: any;
      let rawBody: string | null = null;

      // --- Step 1 & 2: Read and Parse Body ---
      console.log('Attempting to read and parse request body...');
      rawBody = await req.text();
      console.log('Successfully read request body as text. Length:', rawBody?.length ?? 0);
      if (!rawBody) throw new Error('Received empty request body');
      payload = JSON.parse(rawBody);
      console.log('Successfully parsed JSON payload.');

      // --- Step 3: Extract Event Info ---
      const eventType = payload?.data?.eventType;
      let itemId: string | null = null;
      let itemType: string | null = null;
      let details = `Received event type: ${eventType || 'unknown'}`;
      console.log(`Processing event type: ${eventType}`);

      if (eventType?.startsWith('feature.')) {
        itemId = payload?.data?.id;
        itemType = 'feature';
        if (!itemId) details = 'Feature event received, but feature ID missing.';
      } else if (eventType === 'hierarchy-entity.custom-field-value.updated') {
        const targetUrl = payload?.data?.links?.target;
        itemType = 'hierarchy-entity';
        if (targetUrl) {
          itemId = extractHierarchyEntityId(targetUrl);
          if (!itemId) details = `Could not extract hierarchyEntity.id from URL: ${targetUrl}`;
        } else {
          details = 'hierarchy-entity event received, but links.target URL missing.';
        }
      } else {
        itemType = 'unknown';
        details = `Received unhandled event type: ${eventType}`;
      }
      if (itemId) console.log(`Extracted ${itemType} ID: ${itemId}`);
      else console.warn(`Could not extract ID for event type: ${eventType}`);


      // --- Step 4: Log Initial Receipt ---
      console.log('Attempting to log initial event receipt...');
      const { data: initialLogResult, error: initialLogError } = await supabase
        .from('pb_ado_automation_logs')
        .insert({
          event_type: eventType || 'unknown',
          pb_item_id: itemId,
          pb_item_type: itemType,
          status: itemId ? 'received' : 'ignored',
          details: details,
          payload: payload,
        })
        .select('id')
        .single();

      if (initialLogError) console.error('Initial database logging error:', initialLogError);
      else if (initialLogResult) logEntryId = initialLogResult.id;
      else console.warn('Initial database insert returned no error, but also no data.');
      if (logEntryId) console.log('Event logged successfully initially. Log ID:', logEntryId);


      // --- Step 5: Fetch, Check Status, Sync ADO ---
      if (itemId && itemType !== 'unknown') {
        try {
          if (!pbApiToken) {
            console.error('Cannot process: PB_API_TOKEN is not configured.');
            if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'config_error', details: 'Missing PB_API_TOKEN' }).eq('id', logEntryId);
          } else {
            console.log(`Attempting to fetch full data for ${itemType} ID: ${itemId}`);
            let apiUrl = '';
            if (itemType === 'feature' || itemType === 'hierarchy-entity') {
              apiUrl = `https://api.productboard.com/features/${itemId}`;
              if (itemType === 'hierarchy-entity') console.warn(`Assuming hierarchy-entity ID ${itemId} maps to the /features endpoint.`);
            }

            if (apiUrl) {
              const pbResponse = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${pbApiToken}`, 'X-Version': '1', 'Content-Type': 'application/json' },
              });

              if (!pbResponse.ok) {
                const errorBody = await pbResponse.text();
                console.error(`Error fetching ProductBoard data: ${pbResponse.status} ${pbResponse.statusText}`, errorBody);
                if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'fetch_error', details: `PB API Error: ${pbResponse.status} ${errorBody}` }).eq('id', logEntryId);
              } else {
                const pbItemData = await pbResponse.json();
                
                // Add field extraction using the new function
                const extractedFields = extractProductBoardFields(pbItemData);
                console.log(`Successfully fetched data for ${itemType} ID: ${itemId}`);
                console.log('Extracted key fields from ProductBoard:');
                console.log(`- Name: ${extractedFields.name}`);
                console.log(`- Type: ${extractedFields.type}`);
                console.log(`- Status: ${extractedFields.status}`);
                console.log(`- Has Acceptance Criteria: ${extractedFields.notes.acceptanceCriteria ? 'Yes' : 'No'}`);
                
                if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'fetched' }).eq('id', logEntryId);

                const currentStatus = extractedFields.status;
                let proceedWithSync = false;
                let mappingRecord: { ado_work_item_id: number | null, last_known_pb_status: string | null } | null = null;

                if (currentStatus) {
                  console.log(`Current PB Status from API: ${currentStatus}`);
                  const { data: mappingData, error: mappingError } = await supabase
                    .from('pb_ado_mappings')
                    .select('ado_work_item_id, last_known_pb_status')
                    .eq('productboard_id', itemId)
                    .maybeSingle();

                  if (mappingError) {
                    console.error(`Error fetching mapping for productboard_id ${itemId}:`, mappingError);
                    if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'mapping_fetch_error', details: `Error fetching mapping: ${mappingError.message}` }).eq('id', logEntryId);
                  } else {
                    mappingRecord = mappingData;
                    const lastKnownStatus = mappingRecord?.last_known_pb_status;
                    console.log(`Last known status from DB: ${lastKnownStatus}`);

                    if (currentStatus === "With Engineering" && lastKnownStatus !== "With Engineering") {
                      console.log('Status changed TO "With Engineering". Proceeding with sync.');
                      proceedWithSync = true;
                      if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'processing_required', details: `Status changed to ${currentStatus}` }).eq('id', logEntryId);
                    } else {
                      console.log(`Status condition not met (Current: ${currentStatus}, Last Known: ${lastKnownStatus}). Skipping ADO sync.`);
                      if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'skipped_status_check', details: `Current status '${currentStatus}' did not meet trigger condition.` }).eq('id', logEntryId);
                    }

                    if (currentStatus !== lastKnownStatus && mappingRecord) {
                      console.log(`Updating last_known_pb_status in DB to ${currentStatus}`);
                      const { error: updateCacheError } = await supabase
                        .from('pb_ado_mappings')
                        .update({ last_known_pb_status: currentStatus })
                        .eq('productboard_id', itemId);
                      if (updateCacheError) console.error(`Error updating status cache for productboard_id ${itemId}:`, updateCacheError);
                      else console.log('Successfully updated status cache.');
                    } else if (currentStatus !== lastKnownStatus && !mappingRecord) {
                      console.log('No existing mapping to update status cache for.');
                    }
                  }
                } else {
                  console.warn(`Could not determine current status from fetched PB data for item ${itemId}. Skipping status check.`);
                  if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'skipped_no_status', details: 'Could not determine current status from PB API response.' }).eq('id', logEntryId);
                }

                // --- ADO Create/Update Logic ---
                if (proceedWithSync) {
                  console.log(`Proceeding with ADO sync for ${itemType} ID: ${itemId}`);
                  if (!adoOrg || !adoProject || !adoPat) {
                    console.error('ADO sync skipped: Missing ADO environment variables.');
                    if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'ado_config_error', details: 'Missing ADO credentials.' }).eq('id', logEntryId);
                  } else {
                    // Use Healthcare POC 1 as the default project
                    const defaultProject = 'Healthcare POC 1';
                    
                    // Get component's project or use default
                    const componentProject = pbItemData?.data?.component?.project || defaultProject;
                    
                    const targetWorkItemType = 'User Story'; // Hardcoded for test
                    // Get component name from the data
                    const componentName = pbItemData?.data?.component?.name || 'Frontend'; // Keep for potential future use
                    
                    // TEMPORARY: Hardcode Area Path for POC testing
                    const targetAreaPath = "Healthcare POC 1"; 
                    console.log(`Using TEMPORARY hardcoded Area Path: ${targetAreaPath}`);
                    
                    const adoApiVersion = '7.1-preview.3';
                    const existingAdoId = mappingRecord?.ado_work_item_id;
                    const pbFeatureName = extractedFields.name || `PB Item ${itemId}`;
                    let adoApiUrl = '';
                    let adoMethod = '';
                    let adoPayload: any[] = [];
                    let isCreate = !existingAdoId;
                    const adoAuthHeader = `Basic ${simpleBtoa(`:${adoPat}`)}`; // Use simpleBtoa

                    if (isCreate) {
                      console.log(`No existing mapping found. Preparing to CREATE ADO work item.`);
                      adoApiUrl = `https://dev.azure.com/${adoOrg}/${encodeURIComponent(adoProject)}/_apis/wit/workitems/$${encodeURIComponent(targetWorkItemType)}?api-version=${adoApiVersion}`;
                      adoMethod = 'POST';
                      
                      // Build a more complete ADO payload using extracted fields
                      adoPayload = [
                        // Basic fields
                        { "op": "add", "path": "/fields/System.Title", "value": pbFeatureName },
                        { "op": "add", "path": "/fields/System.AreaPath", "value": targetAreaPath },
                        
                        // Description - combine ProductBoard description and notes with enhanced formatting
                        { "op": "add", "path": "/fields/System.Description", "value": `
                          <div>${extractedFields.description || ''}</div>
                          ${extractedFields.notes.customerNeed ? `<div><h3>Customer Need:</h3>${extractedFields.notes.customerNeed}</div>` : ''}
                          ${extractedFields.notes.technicalNotes ? `<div><h3>Technical Notes:</h3>${extractedFields.notes.technicalNotes}</div>` : ''}
                          <div><h3>ProductBoard Link:</h3><a href="https://productboard.com/feature/${itemId}">ProductBoard Feature ${itemId}</a></div>
                        `.trim() },
                        
                        // Acceptance criteria as a dedicated field
                        { "op": "add", "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria", "value": extractedFields.notes.acceptanceCriteria || '' },

                        // State mapping to "New" by default
                        { "op": "add", "path": "/fields/System.State", "value": "New" },
                        
                        // Add story points if available
                        ...(extractedFields.customFields.storyPoints ? 
                          [{ "op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.StoryPoints", "value": extractedFields.customFields.storyPoints }] : 
                          []),
                        
                        // Add target date if available
                        ...(extractedFields.customFields.targetDate ? 
                          [{ "op": "add", "path": "/fields/Microsoft.VSTS.Scheduling.TargetDate", "value": extractedFields.customFields.targetDate }] : 
                          []),
                        
                        // Business Value - set to high for items from ProductBoard to prioritize them
                        { "op": "add", "path": "/fields/Microsoft.VSTS.Common.BusinessValue", "value": 2 },
                        
                        // Add ProductBoard metadata as tags
                        { "op": "add", "path": "/fields/System.Tags", "value": [
                          `ProductBoard:${itemId}`,
                          `PB-Component:${extractedFields.componentId || "none"}`,
                          `PB-Product:${extractedFields.productId || "none"}`,
                          extractedFields.customFields.growthDriver ? "GrowthDriver" : "",
                          extractedFields.customFields.tentpole ? "Tentpole" : "",
                          extractedFields.customFields.investmentCategory ? `Investment:${extractedFields.customFields.investmentCategory}` : ""
                        ].filter(Boolean).join("; ") },
                        
                        // Add custom fields for business context tracking (if your ADO instance supports them)
                        ...(extractedFields.customFields.investmentCategory ? 
                          [{ "op": "add", "path": "/fields/Custom.InvestmentCategory", "value": extractedFields.customFields.investmentCategory }] : 
                          []),
                        
                        ...(extractedFields.customFields.growthDriver ? 
                          [{ "op": "add", "path": "/fields/Custom.GrowthDriver", "value": "true" }] : 
                          []),
                        
                        ...(extractedFields.customFields.tentpole ? 
                          [{ "op": "add", "path": "/fields/Custom.Tentpole", "value": "true" }] : 
                          [])
                      ];
                      
                      // Filter out any undefined operations
                      adoPayload = adoPayload.filter(item => item !== undefined);
                      
                    } else {
                      console.log(`Existing mapping found (ADO ID: ${existingAdoId}). Preparing to UPDATE ADO work item.`);
                      adoApiUrl = `https://dev.azure.com/${adoOrg}/_apis/wit/workitems/${existingAdoId}?api-version=${adoApiVersion}`;
                      adoMethod = 'PATCH';
                      
                      // Build update payload
                      adoPayload = [
                        // Basic fields
                        { "op": "replace", "path": "/fields/System.Title", "value": pbFeatureName },
                        
                        // Description - combine ProductBoard description and customer need
                        { "op": "replace", "path": "/fields/System.Description", "value": `
                          <div>${extractedFields.description || ''}</div>
                          ${extractedFields.notes.customerNeed ? `<div><h3>Customer Need:</h3>${extractedFields.notes.customerNeed}</div>` : ''}
                        `.trim() },
                        
                        // Acceptance criteria
                        { "op": "replace", "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria", "value": extractedFields.notes.acceptanceCriteria || '' },
                        
                        // Add story points if available
                        ...(extractedFields.customFields.storyPoints ? 
                          [{ "op": "replace", "path": "/fields/Microsoft.VSTS.Scheduling.StoryPoints", "value": extractedFields.customFields.storyPoints }] : 
                          []),
                        
                        // Add target date if available
                        ...(extractedFields.customFields.targetDate ? 
                          [{ "op": "replace", "path": "/fields/Microsoft.VSTS.Scheduling.TargetDate", "value": extractedFields.customFields.targetDate }] : 
                          [])
                      ];
                      
                      // Filter out any undefined operations
                      adoPayload = adoPayload.filter(item => item !== undefined);
                    }
                    
                    console.log(`ADO Payload prepared with ${adoPayload.length} field operations`);
                    
                    // Log the full payload for inspection
                    console.log('ADO Payload:', JSON.stringify(adoPayload, null, 2));
                    
                    if (!adoSyncEnabled) {
                      console.log('⚠️ ADO_SYNC_DISABLED: Skipping actual API call to ADO');
                      console.log(`This would have ${isCreate ? 'created' : 'updated'} a work item with the above payload`);
                      
                      // Store the payload in the database for later reference
                      if (logEntryId) {
                        const { error: logError } = await supabase
                          .from('pb_ado_automation_logs')
                          .update({ 
                            status: 'dry_run',
                            details: `ADO sync disabled. Would have ${isCreate ? 'created' : 'updated'} work item.`,
                            ado_payload: adoPayload
                          })
                          .eq('id', logEntryId);
                        
                        if (logError) {
                          console.error('Error logging ADO payload:', logError);
                        } else {
                          console.log('Successfully stored ADO payload for dry run in logs table');
                        }
                      }
                    } else {
                      console.log(`Calling ADO API: ${adoMethod} ${adoApiUrl}`);
                      try {
                        const adoResponse = await fetch(adoApiUrl, {
                          method: adoMethod,
                          headers: { 'Authorization': adoAuthHeader, 'Content-Type': 'application/json-patch+json' },
                          body: JSON.stringify(adoPayload),
                        });
                        const adoResponseBody = await adoResponse.json();

                        if (!adoResponse.ok) {
                          console.error(`ADO API Error: ${adoResponse.status} ${adoResponse.statusText}`, JSON.stringify(adoResponseBody, null, 2));
                          if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'ado_error', details: `ADO API Error ${adoResponse.status}: ${adoResponseBody?.message || 'Unknown ADO error'}` }).eq('id', logEntryId);
                        } else {
                          const createdOrUpdatedAdoId = adoResponseBody.id;
                          const adoWorkItemUrl = adoResponseBody?._links?.html?.href || `https://dev.azure.com/${adoOrg}/${adoProject}/_workitems/edit/${createdOrUpdatedAdoId}`;
                          console.log(`ADO API Success. Work Item ID: ${createdOrUpdatedAdoId}`);

                          console.log(`Upserting mapping for PB ID ${itemId} and ADO ID ${createdOrUpdatedAdoId}`);
                          const { error: upsertError } = await supabase
                            .from('pb_ado_mappings')
                            .upsert({
                              productboard_id: itemId,
                              ado_work_item_id: createdOrUpdatedAdoId,
                              ado_work_item_url: adoWorkItemUrl,
                              last_known_pb_status: currentStatus,
                              last_synced_at: new Date().toISOString(),
                              sync_status: 'success',
                              sync_error: null,
                            }, { onConflict: 'productboard_id' });

                          if (upsertError) {
                            console.error(`Error upserting mapping for PB ID ${itemId}:`, upsertError);
                            if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'mapping_update_error', details: `Failed to upsert mapping: ${upsertError.message}` }).eq('id', logEntryId);
                          } else {
                            console.log('Successfully upserted mapping.');
                            if (logEntryId) {
                              const finalStatus = isCreate ? 'ado_created' : 'ado_updated';
                              await supabase.from('pb_ado_automation_logs').update({ status: finalStatus, details: `Successfully ${finalStatus} ADO item ${createdOrUpdatedAdoId}` }).eq('id', logEntryId);
                            }
                            // Only trigger the pb-link-updater if ADO sync is actually enabled
                            if (adoSyncEnabled) {
                              // Trigger the pb-link-updater function to add the ADO link to ProductBoard
                              console.log(`Triggering pb-link-updater for PB ID ${itemId} and ADO URL ${adoWorkItemUrl}`);
                              try {
                                const linkUpdaterUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pb-link-updater`;
                                const linkUpdaterResponse = await fetch(linkUpdaterUrl, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    productboard_id: itemId,
                                    ado_work_item_id: createdOrUpdatedAdoId,
                                    ado_work_item_url: adoWorkItemUrl,
                                    log_entry_id: logEntryId
                                  })
                                });
                                
                                if (!linkUpdaterResponse.ok) {
                                  const linkUpdaterError = await linkUpdaterResponse.text();
                                  console.error(`Error calling pb-link-updater: ${linkUpdaterResponse.status} ${linkUpdaterError}`);
                                  if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ 
                                    details: `ADO item created/updated, but failed to trigger link update: ${linkUpdaterResponse.status}`
                                  }).eq('id', logEntryId);
                                } else {
                                  const linkResult = await linkUpdaterResponse.json();
                                  console.log(`pb-link-updater response:`, JSON.stringify(linkResult, null, 2));
                                }
                              } catch (linkError) {
                                console.error(`Exception calling pb-link-updater:`, linkError);
                                if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ 
                                  details: `ADO item created/updated, but exception calling link updater: ${linkError.message}`
                                }).eq('id', logEntryId);
                              }
                            }
                          }
                        }
                      } catch (adoFetchError) {
                        console.error('Network or fetch error calling ADO API:', adoFetchError);
                        if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'ado_error', details: `Network/Fetch Error calling ADO: ${adoFetchError.message}` }).eq('id', logEntryId);
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (fetchError) {
          console.error('Network or fetch error calling ProductBoard API:', fetchError);
          if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'fetch_error', details: `Network/Fetch Error: ${fetchError.message}` }).eq('id', logEntryId);
        }
      } else {
         console.log(`No specific API endpoint determined for itemType: ${itemType}. Skipping fetch.`);
         if (logEntryId) await supabase.from('pb_ado_automation_logs').update({ status: 'ignored', details: `No PB API endpoint for itemType ${itemType}` }).eq('id', logEntryId);
      }
    } else {
      console.log('Skipping fetch/sync due to missing ID, itemType, or PB API token.');
       if (logEntryId && !pbApiToken) {
          await supabase.from('pb_ado_automation_logs').update({ status: 'config_error', details: 'Missing PB_API_TOKEN' }).eq('id', logEntryId);
       } else if (logEntryId) {
          await supabase.from('pb_ado_automation_logs').update({ details: 'Skipping fetch/sync due to missing ID or unhandled event type.' }).eq('id', logEntryId);
       }
    }

    // --- Step 6: Respond to ProductBoard ---
    console.log('Sending success response to ProductBoard.');
    return new Response(JSON.stringify({ success: true, message: 'Webhook received', logId: logEntryId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    // Catch any unexpected errors in the main POST handler
    console.error('Unexpected error processing POST request:', error);
    if (logEntryId) {
       supabase.from('pb_ado_automation_logs').update({ status: 'unexpected_error', details: error.message }).eq('id', logEntryId).then();
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Fallback for unhandled methods
  console.warn(`Method not allowed: ${req.method}. Returning 405.`);
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Allow': 'GET, POST, OPTIONS' },
  });
});

console.log('pb-ado-sync function started with enhanced logging and event handling.');

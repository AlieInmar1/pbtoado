// Copy and paste this entire script into your browser console while on the app
// It will test fetching, mapping, and saving a single work item

(async function() {
  try {
    // Work item ID to test
    const WORK_ITEM_ID = 9038; // The Feature ID you mentioned earlier
    
    // Get the supabase client from the window object (it should be available in the app)
    const supabase = window.supabase || window._supabase;
    
    if (!supabase) {
      console.error('Supabase client not found in window object. Make sure you run this in the app.');
      return;
    }
    
    // Get the ADO API functions from the window object
    const adoApi = window.adoApi;
    
    if (!adoApi) {
      console.error('ADO API functions not found. Creating a simple proxy to the API...');
      
      // Create a simple proxy to the Azure DevOps API
      window.adoApi = {
        async fetchWorkItems(organization, project, apiKey, workItemIds) {
          console.log(`Fetching work items: ${workItemIds}`);
          
          // Construct the URL for the Azure DevOps API
          const baseUrl = `/ado/${organization}/${project}/_apis/wit/workitems`;
          const ids = workItemIds.join(',');
          const url = `${baseUrl}?ids=${ids}&api-version=7.0&$expand=all`;
          
          // Make the request
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(`:${apiKey}`)}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch work items: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data.value || [];
        }
      };
    }
    
    // Get credentials from localStorage or prompt the user
    let organization = localStorage.getItem('ado_organization');
    let project = localStorage.getItem('ado_project');
    let apiKey = localStorage.getItem('ado_api_key');
    
    if (!organization) {
      organization = prompt('Enter Azure DevOps organization:');
      localStorage.setItem('ado_organization', organization);
    }
    
    if (!project) {
      project = prompt('Enter Azure DevOps project:');
      localStorage.setItem('ado_project', project);
    }
    
    if (!apiKey) {
      apiKey = prompt('Enter Azure DevOps API key:');
      localStorage.setItem('ado_api_key', apiKey);
    }
    
    // Helper function to map work item to database format
    function mapWorkItemToDb(item) {
      if (!item || !item.id || !item.fields) return null;
      const fields = item.fields;
      
      // Helper to safely access nested properties
      const getField = (path, defaultValue = null) => {
        return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : defaultValue, fields);
      };
      
      const getIdentityField = (path, field, defaultValue = null) => {
         const identity = getField(path);
         return identity && identity[field] ? identity[field] : defaultValue;
      };
    
      // Extract Productboard ID from relations
      let productboardId = null;
      if (item.relations) {
        const pbLink = item.relations.find((r) => 
          r.rel === 'Hyperlink' && 
          r.url && 
          r.url.includes('productboard.com')
        );
        
        if (pbLink) {
          const match = pbLink.url.match(/features\/([a-f0-9-]+)/);
          productboardId = match ? match[1] : null;
        }
      }
      
      // Extract values with detailed logging
      const extracted = {
        title: getField('System.Title', `Untitled Item ${item.id}`),
        state: getField('System.State', 'Unknown'),
        area_id: getField('System.AreaId'),
        priority: getField('Microsoft.VSTS.Common.Priority'),
        stack_rank: getField('Microsoft.VSTS.Common.StackRank'),
        board_column: getField('System.BoardColumn'),
        board_column_done: getField('System.BoardColumnDone'),
        comment_count: getField('System.CommentCount'),
        watermark: getField('System.Watermark'),
      };
      
      console.log(`[TEST] Extracted values for item ${item.id}:`, extracted);
      console.log(`[TEST] Raw fields for item ${item.id}:`, fields);
    
      return {
        id: item.id,
        url: item.url,
        rev: item.rev,
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
        board_column: extracted.board_column,
        board_column_done: extracted.board_column_done,
        comment_count: extracted.comment_count,
        watermark: extracted.watermark,
        stack_rank: extracted.stack_rank,
        effort: getField('Microsoft.VSTS.Scheduling.Effort'),
        story_points: getField('Microsoft.VSTS.Scheduling.StoryPoints'),
        business_value: getField('Microsoft.VSTS.Common.BusinessValue'),
        productboard_id: productboardId,
        raw_data: item, // Store the whole item
        last_synced_at: new Date().toISOString(),
      };
    }
    
    console.log(`Fetching work item ${WORK_ITEM_ID} from Azure DevOps...`);
    
    // Fetch the single work item
    const items = await window.adoApi.fetchWorkItems(organization, project, apiKey, [WORK_ITEM_ID]);
    
    if (!items || items.length === 0) {
      console.error(`Work item ${WORK_ITEM_ID} not found.`);
      return;
    }
    
    const item = items[0];
    console.log(`Successfully fetched work item ${WORK_ITEM_ID}.`);
    
    // Map the item to database format
    const mappedItem = mapWorkItemToDb(item);
    
    if (!mappedItem) {
      console.error(`Failed to map work item ${WORK_ITEM_ID}.`);
      return;
    }
    
    console.log(`Successfully mapped work item ${WORK_ITEM_ID}.`);
    console.log(`[TEST] Mapped item:`, mappedItem);
    
    // Save to Supabase
    console.log(`Saving work item ${WORK_ITEM_ID} to Supabase...`);
    
    const { data, error } = await supabase
      .from('ado_work_items')
      .upsert([mappedItem], { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`Error saving work item ${WORK_ITEM_ID} to Supabase:`, error);
      return;
    }
    
    console.log(`Successfully saved work item ${WORK_ITEM_ID} to Supabase.`);
    console.log(`[TEST] Saved item:`, data);
    
    // Verify the saved item
    const { data: verifyData, error: verifyError } = await supabase
      .from('ado_work_items')
      .select('*')
      .eq('id', WORK_ITEM_ID)
      .single();
    
    if (verifyError) {
      console.error(`Error verifying work item ${WORK_ITEM_ID} in Supabase:`, verifyError);
      return;
    }
    
    console.log(`Successfully verified work item ${WORK_ITEM_ID} in Supabase.`);
    console.log(`[TEST] Verified item:`, verifyData);
    
    // Compare mapped vs saved
    console.log(`[TEST] Comparing mapped vs saved fields:`);
    const mappedKeys = Object.keys(mappedItem).filter(k => k !== 'raw_data'); // Exclude raw_data for brevity
    
    for (const key of mappedKeys) {
      const mappedValue = mappedItem[key];
      const savedValue = verifyData[key];
      
      if (JSON.stringify(mappedValue) !== JSON.stringify(savedValue)) {
        console.log(`[TEST] Mismatch for field '${key}':`);
        console.log(`  - Mapped: ${JSON.stringify(mappedValue)}`);
        console.log(`  - Saved:  ${JSON.stringify(savedValue)}`);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
})();

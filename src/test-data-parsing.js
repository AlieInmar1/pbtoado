import { createClient } from '@supabase/supabase-js';

// Create Supabase client with the correct API key from .env
const supabaseUrl = 'https://tqzsfzhcwkhwketcbvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxenNmemhjd2tod2tldGNidm96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc2MDEwOSwiZXhwIjoyMDU5MzM2MTA5fQ.42Vp23GRhMVfIw42gpXI8j_yZbr9K9Y3M0LqTj9Tneg';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * This script checks if the work item data is being properly parsed into the individual fields in the database.
 * It compares the raw_data field with the individual fields to see if they match.
 */
async function testDataParsing() {
  try {
    console.log('Checking work item data parsing...');
    
    // Get a sample of work items from the database
    const { data: workItems, error } = await supabase
      .from('ado_work_items')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching work items:', error);
      return;
    }
    
    if (!workItems || workItems.length === 0) {
      console.log('No work items found in the database.');
      return;
    }
    
    console.log(`Found ${workItems.length} work items. Checking data parsing...`);
    
    // Check each work item
    workItems.forEach((item, index) => {
      console.log(`\nWork Item #${index + 1} (ID: ${item.id}):`);
      
      // Check if raw_data exists
      if (!item.raw_data) {
        console.log('  - No raw_data field found!');
        return;
      }
      
      // Check if raw_data.fields exists
      if (!item.raw_data.fields) {
        console.log('  - No fields in raw_data!');
        return;
      }
      
      const fields = item.raw_data.fields;
      
      // Check basic fields
      console.log(`  - Type: ${item.type} (Raw: ${fields['System.WorkItemType']})`);
      console.log(`  - Title: ${item.title} (Raw: ${fields['System.Title']})`);
      console.log(`  - State: ${item.state} (Raw: ${fields['System.State']})`);
      console.log(`  - Area Path: ${item.area_path} (Raw: ${fields['System.AreaPath']})`);
      
      // Check if any fields are missing
      const missingFields = [];
      if (fields['System.WorkItemType'] && item.type !== fields['System.WorkItemType']) missingFields.push('type');
      if (fields['System.Title'] && item.title !== fields['System.Title']) missingFields.push('title');
      if (fields['System.State'] && item.state !== fields['System.State']) missingFields.push('state');
      if (fields['System.AreaPath'] && item.area_path !== fields['System.AreaPath']) missingFields.push('area_path');
      
      if (missingFields.length > 0) {
        console.log(`  - MISMATCH in fields: ${missingFields.join(', ')}`);
      } else {
        console.log('  - All checked fields match correctly');
      }
      
      // Check if raw_data contains fields that aren't mapped
      const mappedFields = [
        'System.WorkItemType', 'System.Title', 'System.State', 'System.Reason',
        'System.AreaPath', 'System.IterationPath', 'Microsoft.VSTS.Common.Priority',
        'Microsoft.VSTS.Common.ValueArea', 'System.Tags', 'System.Description',
        'System.AssignedTo', 'System.CreatedBy', 'System.CreatedDate',
        'System.ChangedBy', 'System.ChangedDate'
      ];
      
      const unmappedFields = Object.keys(fields).filter(key => !mappedFields.includes(key));
      if (unmappedFields.length > 0) {
        console.log(`  - Unmapped fields in raw_data: ${unmappedFields.join(', ')}`);
      }
    });
    
    console.log('\nData parsing check complete.');
  } catch (error) {
    console.error('Error in testDataParsing:', error);
  }
}

// Run the test
testDataParsing();

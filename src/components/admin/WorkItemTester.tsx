import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import * as adoApi from '../../lib/api/azureDevOpsProxy';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Helper function to map work item to database format (copied from azureDevOpsWithCacheProxy.ts)
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

interface WorkItemTesterProps {
  organization: string;
  project: string;
  apiKey: string;
}

const WorkItemTester: React.FC<WorkItemTesterProps> = ({ organization, project, apiKey }) => {
  const [workItemId, setWorkItemId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mismatches, setMismatches] = useState<Record<string, { mapped: any; saved: any }>>({});

  const handleTest = async () => {
    if (!workItemId || isNaN(Number(workItemId))) {
      setError('Please enter a valid work item ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setMismatches({});

    try {
      const id = Number(workItemId);
      console.log(`Fetching work item ${id} from Azure DevOps...`);
      
      // Fetch the single work item
      const items = await adoApi.fetchWorkItems(organization, project, apiKey, [id]);
      
      if (!items || items.length === 0) {
        throw new Error(`Work item ${id} not found.`);
      }
      
      const item = items[0];
      console.log(`Successfully fetched work item ${id}.`);
      
      // Map the item to database format
      const mappedItem = mapWorkItemToDb(item);
      
      if (!mappedItem) {
        throw new Error(`Failed to map work item ${id}.`);
      }
      
      console.log(`Successfully mapped work item ${id}.`);
      
      // Save to Supabase
      console.log(`Saving work item ${id} to Supabase...`);
      
      const { data, error: upsertError } = await supabase
        .from('ado_work_items')
        .upsert([mappedItem], { onConflict: 'id' })
        .select();
      
      if (upsertError) {
        throw new Error(`Error saving work item ${id} to Supabase: ${upsertError.message}`);
      }
      
      console.log(`Successfully saved work item ${id} to Supabase.`);
      
      // Verify the saved item
      const { data: verifyData, error: verifyError } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (verifyError) {
        throw new Error(`Error verifying work item ${id} in Supabase: ${verifyError.message}`);
      }
      
      console.log(`Successfully verified work item ${id} in Supabase.`);
      
      // Compare mapped vs saved
      console.log(`Comparing mapped vs saved fields:`);
      const newMismatches: Record<string, { mapped: any; saved: any }> = {};
      const mappedKeys = Object.keys(mappedItem).filter(k => k !== 'raw_data'); // Exclude raw_data for brevity
      
      for (const key of mappedKeys) {
        const mappedValue = mappedItem[key];
        const savedValue = verifyData[key];
        
        if (JSON.stringify(mappedValue) !== JSON.stringify(savedValue)) {
          console.log(`Mismatch for field '${key}':`);
          console.log(`  - Mapped: ${JSON.stringify(mappedValue)}`);
          console.log(`  - Saved:  ${JSON.stringify(savedValue)}`);
          newMismatches[key] = { mapped: mappedValue, saved: savedValue };
        }
      }
      
      setResults({
        item,
        mappedItem,
        savedItem: verifyData
      });
      
      setMismatches(newMismatches);
      
    } catch (err) {
      console.error('Error in test:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Work Item Tester</h2>
      <p className="mb-4">Test fetching, mapping, and saving a single work item to diagnose issues.</p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={workItemId}
          onChange={(e) => setWorkItemId(e.target.value)}
          placeholder="Enter Work Item ID"
          className="px-3 py-2 border rounded"
        />
        <Button onClick={handleTest} disabled={loading}>
          {loading ? 'Testing...' : 'Test Work Item'}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <p>Work Item: {results.mappedItem.id} - {results.mappedItem.title}</p>
          <p>Type: {results.mappedItem.type}</p>
          
          {Object.keys(mismatches).length > 0 ? (
            <div className="mt-2">
              <h4 className="font-semibold text-red-600">Field Mismatches Found:</h4>
              <div className="max-h-60 overflow-y-auto mt-2 border rounded p-2">
                {Object.entries(mismatches).map(([field, { mapped, saved }]) => (
                  <div key={field} className="mb-2 pb-2 border-b">
                    <p className="font-medium">{field}:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Mapped:</p>
                        <pre className="bg-gray-100 p-1 rounded">{JSON.stringify(mapped, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Saved:</p>
                        <pre className="bg-gray-100 p-1 rounded">{JSON.stringify(saved, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                These mismatches indicate fields that were mapped correctly but not saved properly to the database.
                Check the browser console for more detailed logs.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-green-600">All fields were saved correctly! No mismatches found.</p>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Check the browser console (F12) for detailed logs of the test process.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorkItemTester;

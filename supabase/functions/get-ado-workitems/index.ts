import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
};

// Interface for work item
interface ADOWorkItem {
  id: string;
  rev: number;
  fields: Record<string, any>;
  url: string;
  relations?: Array<{
    rel: string;
    url: string;
    attributes: {
      name?: string;
      isLocked?: boolean;
      comment?: string;
    };
  }>;
}

// Interface for request parameters
interface GetWorkItemsParams {
  organization: string;
  project: string;
  api_key: string;
  workItemType?: string;
  updatedSince?: string;
  status?: string;
  limit?: number;
  fields?: string[];
  parentId?: string;
  areaPath?: string;
  wiql?: string;
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    const requestBody = await req.json() as GetWorkItemsParams;
    console.log('Request received with parameters:', {
      ...requestBody,
      api_key: requestBody.api_key ? `${requestBody.api_key.substring(0, 5)}...` : null
    });
    
    const { organization, project, api_key, workItemType, updatedSince, status, limit, fields, parentId, areaPath, wiql } = requestBody;
    
    // Validate required parameters
    if (!organization || !project || !api_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: organization, project, or api_key',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Create Authorization header with token
    const credentials = `:${api_key}`;
    const encodedCredentials = encode(new TextEncoder().encode(credentials));
    const authHeader = `Basic ${encodedCredentials}`;
    
    // Build base URL
    const baseUrl = `https://dev.azure.com/${organization}/${project}/_apis`;
    
    // If a custom WIQL query is provided, use it directly
    if (wiql) {
      return await executeWiqlQuery(baseUrl, authHeader, wiql, fields);
    }
    
    // Otherwise, build a WIQL query based on parameters
    let queryString = "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.CreatedDate], [System.ChangedDate]";
    
    // Add custom fields if specified
    if (fields && fields.length > 0) {
      // Remove default fields that are already included
      const defaultFields = ['System.Id', 'System.WorkItemType', 'System.Title', 'System.State', 'System.CreatedDate', 'System.ChangedDate'];
      const additionalFields = fields.filter(field => !defaultFields.includes(field));
      
      if (additionalFields.length > 0) {
        queryString = `SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.CreatedDate], [System.ChangedDate], ${additionalFields.map(field => `[${field}]`).join(', ')}`;
      }
    }
    
    queryString += " FROM workitems WHERE ";
    
    // Add filters
    const conditions: string[] = [];
    
    if (workItemType) {
      conditions.push(`[System.WorkItemType] = '${workItemType}'`);
    }
    
    if (updatedSince) {
      conditions.push(`[System.ChangedDate] >= '${updatedSince}'`);
    }
    
    if (status) {
      conditions.push(`[System.State] = '${status}'`);
    }
    
    if (areaPath) {
      conditions.push(`[System.AreaPath] UNDER '${areaPath}'`);
    }
    
    if (parentId) {
      // Add a parent relationship condition
      conditions.push(`[System.Id] IN (SELECT [System.Id] FROM workitemLinks WHERE ([Source].[System.Id] = ${parentId} AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'))`);
    }
    
    // If no specific conditions, get all work items
    if (conditions.length === 0) {
      conditions.push("[System.WorkItemType] <> ''");
    }
    
    queryString += conditions.join(' AND ');
    
    // Add order by
    queryString += " ORDER BY [System.ChangedDate] DESC";
    
    console.log('Generated WIQL query:', queryString);
    
    return await executeWiqlQuery(baseUrl, authHeader, queryString, fields, limit);
  } catch (error) {
    // Handle general errors
    console.error('Error in get-ado-workitems function:', error);
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
 * Execute a WIQL query against Azure DevOps
 */
async function executeWiqlQuery(
  baseUrl: string, 
  authHeader: string, 
  query: string, 
  fields?: string[],
  limit?: number
): Promise<Response> {
  try {
    // Execute WIQL query to get work item IDs
    console.log('Executing WIQL query against Azure DevOps');
    const wiqlResponse = await fetch(
      `${baseUrl}/wit/wiql?api-version=7.0`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );
    
    if (!wiqlResponse.ok) {
      const errorText = await wiqlResponse.text();
      console.error('Error executing WIQL query:', errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to execute WIQL query: ${wiqlResponse.status} ${wiqlResponse.statusText}`,
          details: {
            status: wiqlResponse.status,
            response: errorText,
          },
        }),
        {
          status: wiqlResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    const wiqlData = await wiqlResponse.json();
    console.log(`WIQL query returned ${wiqlData.workItems?.length || 0} work items`);
    
    // If no work items found, return an empty array
    if (!wiqlData.workItems || wiqlData.workItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Apply limit if specified
    let workItemIds = wiqlData.workItems.map((item: any) => item.id);
    
    if (limit && limit > 0 && limit < workItemIds.length) {
      workItemIds = workItemIds.slice(0, limit);
      console.log(`Limiting results to ${limit} work items`);
    }
    
    // Get work item details
    console.log('Fetching work item details');
    
    // Build fields query parameter if specified
    let fieldsParam = '';
    if (fields && fields.length > 0) {
      fieldsParam = `&fields=${fields.join(',')}`;
    }
    
    const workItemsUrl = `${baseUrl}/wit/workitems?ids=${workItemIds.join(',')}&$expand=relations${fieldsParam}&api-version=7.0`;
    console.log('Work items URL:', workItemsUrl);
    
    const workItemsResponse = await fetch(
      workItemsUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!workItemsResponse.ok) {
      const errorText = await workItemsResponse.text();
      console.error('Error fetching work item details:', errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch work item details: ${workItemsResponse.status} ${workItemsResponse.statusText}`,
          details: {
            status: workItemsResponse.status,
            response: errorText,
          },
        }),
        {
          status: workItemsResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    const workItemsData = await workItemsResponse.json();
    console.log(`Successfully retrieved ${workItemsData.value?.length || 0} work items`);
    
    // Process work items for better front-end consumption
    const processedWorkItems = workItemsData.value.map((item: ADOWorkItem) => {
      // Add a few computed properties to make front-end usage easier
      return {
        ...item,
        adoType: item.fields['System.WorkItemType'],
        title: item.fields['System.Title'],
        state: item.fields['System.State'],
        createdDate: item.fields['System.CreatedDate'],
        updatedDate: item.fields['System.ChangedDate'],
        // Add parent and child relationship information
        parentId: extractParentId(item),
        childIds: extractChildIds(item),
      };
    });
    
    // Return the work items
    return new Response(
      JSON.stringify({
        success: true,
        data: processedWorkItems,
        count: processedWorkItems.length,
        _debug: {
          query,
          totalFound: wiqlData.workItems.length,
          retrieved: processedWorkItems.length,
          limited: limit && limit < wiqlData.workItems.length,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error executing WIQL query:', error);
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
}

/**
 * Extract the parent ID from a work item
 */
function extractParentId(workItem: ADOWorkItem): string | null {
  if (!workItem.relations) return null;
  
  // Look for parent relationship
  const parentRelation = workItem.relations.find(
    relation => relation.rel === 'System.LinkTypes.Hierarchy-Reverse'
  );
  
  if (!parentRelation) return null;
  
  // Extract ID from URL
  const match = parentRelation.url.match(/workItems\/(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Extract child IDs from a work item
 */
function extractChildIds(workItem: ADOWorkItem): string[] {
  if (!workItem.relations) return [];
  
  // Look for child relationships
  const childRelations = workItem.relations.filter(
    relation => relation.rel === 'System.LinkTypes.Hierarchy-Forward'
  );
  
  if (childRelations.length === 0) return [];
  
  // Extract IDs from URLs
  return childRelations
    .map(relation => {
      const match = relation.url.match(/workItems\/(\d+)$/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];
}

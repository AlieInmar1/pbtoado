import { supabase } from './supabase';

// Azure DevOps API endpoints
const ADO_API_VERSION = '7.0';

/**
 * Utility to generate Azure DevOps API URLs
 * @param organization Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param path API path
 * @returns Full API URL
 */
function getAdoApiUrl(organization: string, project: string, path: string): string {
  return `https://dev.azure.com/${organization}/${project}/_apis/${path}?api-version=${ADO_API_VERSION}`;
}

/**
 * Get authorization header for Azure DevOps API
 * @param apiKey Azure DevOps Personal Access Token
 * @returns Authorization header value
 */
function getAdoAuthHeader(apiKey: string): string {
  const token = Buffer.from(`:${apiKey}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Fetch work items from Azure DevOps
 * @param organization Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param apiKey Azure DevOps Personal Access Token
 * @param ids Optional array of work item IDs to fetch specific items
 * @returns Promise with work items data
 */
export async function fetchWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  ids?: string[]
): Promise<any[]> {
  try {
    let workItems: any[] = [];
    
    if (ids && ids.length > 0) {
      // Fetch specific work items by IDs
      const chunks = chunkArray(ids, 200); // ADO has a limit of 200 items per request
      
      for (const chunk of chunks) {
        const idList = chunk.join(',');
        const url = getAdoApiUrl(organization, project, `wit/workitems?ids=${idList}&$expand=relations`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAdoAuthHeader(apiKey),
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch work items: ${response.statusText}`);
        }
        
        const result = await response.json();
        workItems = [...workItems, ...(result.value || [])];
      }
    } else {
      // Fetch work items using WIQL (Work Item Query Language)
      const wiqlUrl = getAdoApiUrl(organization, project, 'wit/wiql');
      
      const response = await fetch(wiqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAdoAuthHeader(apiKey),
        },
        body: JSON.stringify({
          query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.ChangedDate] DESC"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute WIQL query: ${response.statusText}`);
      }
      
      const wiqlResult = await response.json();
      const workItemIds = wiqlResult.workItems.map((item: any) => item.id);
      
      if (workItemIds.length > 0) {
        // Now fetch the work items with details
        return await fetchWorkItems(organization, project, apiKey, workItemIds);
      }
    }
    
    return workItems;
  } catch (error) {
    console.error('Error fetching Azure DevOps work items:', error);
    throw error;
  }
}

/**
 * Create or update a work item in Azure DevOps
 * @param organization Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param apiKey Azure DevOps Personal Access Token
 * @param workItemType Type of work item (e.g., 'Bug', 'User Story', 'Feature')
 * @param fields Fields to set on the work item
 * @param id Optional ID for updating an existing work item
 * @returns Promise with created/updated work item data
 */
export async function createOrUpdateWorkItem(
  organization: string,
  project: string,
  apiKey: string,
  workItemType: string,
  fields: Record<string, any>,
  id?: string
): Promise<any> {
  try {
    // Prepare document operations for JSON patch
    const operations = Object.entries(fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value: value,
    }));
    
    const isUpdate = !!id;
    const url = isUpdate 
      ? getAdoApiUrl(organization, project, `wit/workitems/${id}`)
      : getAdoApiUrl(organization, project, `wit/workitems/$${workItemType}`);
    
    const method = isUpdate ? 'PATCH' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json-patch+json',
        'Authorization': getAdoAuthHeader(apiKey),
      },
      body: JSON.stringify(operations),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} work item: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error ${id ? 'updating' : 'creating'} Azure DevOps work item:`, error);
    throw error;
  }
}

/**
 * Map ProductBoard feature to Azure DevOps fields
 * @param feature ProductBoard feature
 * @returns Mapped fields for Azure DevOps
 */
export function mapProductBoardToADO(feature: any): Record<string, any> {
  return {
    'System.Title': feature.name,
    'System.Description': feature.description || '',
    'System.State': mapStatusToADOState(feature.status_name),
    'Microsoft.VSTS.Common.Priority': mapPriorityToADO(feature),
    'System.Tags': `ProductBoard; ID:${feature.productboard_id}`,
    // Add additional field mappings as needed
  };
}

/**
 * Map ProductBoard status to Azure DevOps state
 */
function mapStatusToADOState(status?: string | null): string {
  if (!status) return 'New';
  
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'released':
      return 'Closed';
    case 'in progress':
    case 'in development':
      return 'Active';
    case 'backlog':
    case 'planned':
      return 'New';
    default:
      return 'New';
  }
}

/**
 * Map ProductBoard priority to Azure DevOps priority
 */
function mapPriorityToADO(feature: any): number {
  const priority = feature.metadata_priority || 'medium';
  
  switch (priority.toLowerCase()) {
    case 'high':
    case 'critical':
      return 1;
    case 'medium':
      return 2;
    case 'low':
      return 3;
    default:
      return 2;
  }
}

/**
 * Helper function to chunk an array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

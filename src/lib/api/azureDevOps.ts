// API version
const API_VERSION = '7.0';

// Basic authentication helper
function getAuthHeader(apiKey: string): string {
  // Use browser-compatible Base64 encoding
  const token = btoa(`:${apiKey}`);
  return `Basic ${token}`;
}

// Test connection to Azure DevOps
export async function testConnection(
  organization: string,
  project: string, // Keep project for consistency, though not used in this specific URL
  apiKey: string
): Promise<boolean> {
  try {
    // Use the organization-level projects endpoint for connection testing
    const response = await fetch(
      `https://dev.azure.com/${organization}/_apis/projects?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Azure DevOps connection:', error);
    return false;
  }
}

// Fetch work items from Azure DevOps
export async function fetchWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  workItemIds?: number[]
): Promise<any[]> {
  try {
    // If specific work item IDs are provided, fetch those
    if (workItemIds && workItemIds.length > 0) {
      const ids = workItemIds.join(',');
      const response = await fetch(
        `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${ids}&$expand=all&api-version=${API_VERSION}`,
        {
          headers: {
            'Authorization': getAuthHeader(apiKey),
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch work items: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.value || [];
    }
    
    // Otherwise, use WIQL to query for work items
    const wiqlResponse = await fetch(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
        body: JSON.stringify({
          query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.ChangedDate] DESC"
        }),
      }
    );
    
    if (!wiqlResponse.ok) {
      throw new Error(`Failed to execute WIQL query: ${wiqlResponse.statusText}`);
    }
    
    const wiqlData = await wiqlResponse.json();
    const ids = wiqlData.workItems.map((item: any) => item.id);
    
    if (ids.length === 0) {
      return [];
    }
    
    // Fetch the actual work items with details
    return await fetchWorkItems(organization, project, apiKey, ids);
  } catch (error) {
    console.error('Error fetching Azure DevOps work items:', error);
    throw error;
  }
}

// Get work item types available in the project
export async function getWorkItemTypes(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/workitemtypes?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch work item types: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching work item types:', error);
    throw error;
  }
}

// Query work items using WIQL
export async function queryWorkItems(
  organization: string,
  project: string,
  apiKey: string,
  wiqlQuery: string
): Promise<any[]> {
  try {
    // Execute WIQL query to get work item IDs
    const wiqlResponse = await fetch(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
        body: JSON.stringify({
          query: wiqlQuery
        }),
      }
    );
    
    if (!wiqlResponse.ok) {
      throw new Error(`Failed to execute WIQL query: ${wiqlResponse.statusText}`);
    }
    
    const wiqlData = await wiqlResponse.json();
    
    // If no work items found, return empty array
    if (!wiqlData.workItems || wiqlData.workItems.length === 0) {
      return [];
    }
    
    // Extract work item IDs
    const ids = wiqlData.workItems.map((item: any) => item.id);
    
    // Fetch work items with details
    return await getWorkItemDetails(organization, project, apiKey, ids);
  } catch (error) {
    console.error('Error querying work items:', error);
    throw error;
  }
}

// Get work item details with all fields and relations
export async function getWorkItemDetails(
  organization: string,
  project: string,
  apiKey: string,
  ids: number[]
): Promise<any[]> {
  try {
    // Split IDs into batches of 200 (API limit)
    const batchSize = 200;
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    // Process each batch
    const results = [];
    for (const batchIds of batches) {
      const idList = batchIds.join(',');
      const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${idList}&$expand=all&api-version=${API_VERSION}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(apiKey),
        },
      });

      if (!response.ok) {
        // Attempt to parse error response from ADO if possible
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorDetails;
        } catch (e) {
          // Ignore if response is not JSON
        }
        throw new Error(`Failed to fetch work item details (batch starting ${batchIds[0]}): ${response.status} ${errorDetails}`);
      }

      const result = await response.json();
      results.push(...(result.value || []));
    }

    return results;
  } catch (error) {
    console.error('Error fetching work item details:', error);
    throw error;
  }
}

// Get work items by type (Epic, Feature, User Story)
export async function getWorkItemsByType(
  organization: string,
  project: string,
  apiKey: string,
  workItemType: string
): Promise<any[]> {
  const wiqlQuery = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AreaPath] 
                     FROM WorkItems 
                     WHERE [System.TeamProject] = @project 
                       AND [System.WorkItemType] = '${workItemType}'`;
  
  return await queryWorkItems(organization, project, apiKey, wiqlQuery);
}

// Get work items with hierarchy using WIQL
export async function getWorkItemsWithHierarchy(
  organization: string,
  project: string,
  apiKey: string
): Promise<any> {
  try {
    // First, get all Epics
    const epics = await getWorkItemsByType(organization, project, apiKey, 'Epic');
    
    // Then, get all Features
    const features = await getWorkItemsByType(organization, project, apiKey, 'Feature');
    
    // Finally, get all User Stories
    const stories = await getWorkItemsByType(organization, project, apiKey, 'User Story');
    
    // Build the hierarchy
    const hierarchy = buildHierarchy(epics, features, stories);
    
    return hierarchy;
  } catch (error) {
    console.error('Error fetching work items with hierarchy:', error);
    throw error;
  }
}

// Helper function to build the hierarchy
function buildHierarchy(epics: any[], features: any[], stories: any[]): any {
  // Create maps for quick lookup
  const epicsMap: Record<number, any> = {};
  const featuresMap: Record<number, any> = {};
  const featureToEpic: Record<number, number> = {};
  const storyToFeature: Record<number, number> = {};
  
  // Process epics
  epics.forEach(epic => {
    epicsMap[epic.id] = {
      ...epic,
      features: []
    };
  });
  
  // Process features
  features.forEach(feature => {
    featuresMap[feature.id] = {
      ...feature,
      stories: []
    };
    
    // Find parent epic
    if (feature.relations) {
      for (const relation of feature.relations) {
        if (relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
          const epicId = parseInt(relation.url.split('/').pop());
          if (epicsMap[epicId]) {
            featureToEpic[feature.id] = epicId;
            epicsMap[epicId].features.push(feature.id);
          }
        }
      }
    }
  });
  
  // Process stories
  stories.forEach(story => {
    // Find parent feature
    if (story.relations) {
      for (const relation of story.relations) {
        if (relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
          const featureId = parseInt(relation.url.split('/').pop());
          if (featuresMap[featureId]) {
            storyToFeature[story.id] = featureId;
            featuresMap[featureId].stories.push(story.id);
          }
        }
      }
    }
  });
  
  return {
    epics: epicsMap,
    features: featuresMap,
    stories,
    featureToEpic,
    storyToFeature
  };
}

// Get area paths
export async function getAreaPaths(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/classificationnodes/areas?$depth=10&api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch area paths: ${response.statusText}`);
    }
    
    const data = await response.json();
    return flattenAreaPaths(data);
  } catch (error) {
    console.error('Error fetching area paths:', error);
    throw error;
  }
}

// Helper function to flatten area paths
function flattenAreaPaths(node: any, parentPath = ''): any[] {
  const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
  let result = [{ id: node.id, name: node.name, path: currentPath }];
  
  if (node.children) {
    for (const child of node.children) {
      result = [...result, ...flattenAreaPaths(child, currentPath)];
    }
  }
  
  return result;
}

// Get teams
export async function getTeams(
  organization: string,
  project: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://dev.azure.com/${organization}/_apis/projects/${project}/teams?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

// Get team settings (area paths assigned to teams)
export async function getTeamAreaPaths(
  organization: string,
  project: string,
  team: string,
  apiKey: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/teamfieldvalues?api-version=${API_VERSION}`,
      {
        headers: {
          'Authorization': getAuthHeader(apiKey),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team area paths: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching team area paths:', error);
    throw error;
  }
}

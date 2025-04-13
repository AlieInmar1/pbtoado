export interface ADOWorkItemRelation {
  rel: string;
  url: string;
  attributes: {
    name?: string;
    isLocked?: boolean;
    comment?: string;
  };
}

export interface ADOWorkItem {
  id: string;
  rev: number;
  fields: Record<string, any>;
  url: string;
  relations?: ADOWorkItemRelation[];
  
  // Computed properties added by our function
  adoType: string;
  title: string;
  state: string;
  createdDate: string;
  updatedDate: string;
  parentId: string | null;
  childIds: string[];
}

export interface GetWorkItemsParams {
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

export interface GetWorkItemsResponse {
  success: boolean;
  data: ADOWorkItem[];
  count: number;
  _debug?: {
    query: string;
    totalFound: number;
    retrieved: number;
    limited: boolean;
  };
  error?: string;
  details?: any;
}

/**
 * API client for Azure DevOps work items
 * This uses the get-ado-workitems Supabase Edge Function
 */
export const adoWorkItemsApi = {
  /**
   * Get work items from Azure DevOps
   * @param params Parameters for the request
   * @returns Response with work items
   */
  async getWorkItems(params: GetWorkItemsParams): Promise<GetWorkItemsResponse> {
    try {
      // Get Supabase URL and key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or key in environment');
        return {
          success: false,
          data: [],
          count: 0,
          error: 'Configuration error: Missing Supabase URL or key',
        };
      }
      
      // Call the Supabase Edge Function directly
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-ado-workitems`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching ADO work items:', responseData);
        return {
          success: false,
          data: [],
          count: 0,
          error: responseData.error || `Failed with status ${response.status}`,
        };
      }
      
      return responseData as GetWorkItemsResponse;
    } catch (error) {
      console.error('Exception fetching ADO work items:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  },
  
  /**
   * Get work items by type (Epic, Feature, User Story, etc.)
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @param workItemType The type of work item to fetch
   * @param limit Maximum number of items to return
   * @returns Response with work items
   */
  async getWorkItemsByType(
    organization: string,
    project: string,
    apiKey: string,
    workItemType: string,
    limit?: number
  ): Promise<GetWorkItemsResponse> {
    return this.getWorkItems({
      organization,
      project,
      api_key: apiKey,
      workItemType,
      limit,
    });
  },
  
  /**
   * Get work items that have been updated since a specific date
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @param updatedSince Date to check for updates since (ISO format)
   * @param limit Maximum number of items to return
   * @returns Response with work items
   */
  async getWorkItemsUpdatedSince(
    organization: string,
    project: string,
    apiKey: string,
    updatedSince: string,
    limit?: number
  ): Promise<GetWorkItemsResponse> {
    return this.getWorkItems({
      organization,
      project,
      api_key: apiKey,
      updatedSince,
      limit,
    });
  },
  
  /**
   * Get all work items with a specific status
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @param status Status to filter by
   * @param limit Maximum number of items to return
   * @returns Response with work items
   */
  async getWorkItemsByStatus(
    organization: string,
    project: string,
    apiKey: string,
    status: string,
    limit?: number
  ): Promise<GetWorkItemsResponse> {
    return this.getWorkItems({
      organization,
      project,
      api_key: apiKey,
      status,
      limit,
    });
  },
  
  /**
   * Get child work items for a parent
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @param parentId ID of the parent work item
   * @param limit Maximum number of items to return
   * @returns Response with work items
   */
  async getChildWorkItems(
    organization: string,
    project: string,
    apiKey: string,
    parentId: string,
    limit?: number
  ): Promise<GetWorkItemsResponse> {
    return this.getWorkItems({
      organization,
      project,
      api_key: apiKey,
      parentId,
      limit,
    });
  },
  
  /**
   * Get the complete hierarchy of work items starting from the top-level (Epics)
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @returns Work item hierarchy with Epics, Features, and User Stories
   */
  async getWorkItemHierarchy(
    organization: string,
    project: string,
    apiKey: string
  ): Promise<{
    epics: ADOWorkItem[];
    features: Record<string, ADOWorkItem[]>;
    stories: Record<string, ADOWorkItem[]>;
  }> {
    try {
      // Step 1: Get all Epics
      const epicsResponse = await this.getWorkItemsByType(
        organization,
        project,
        apiKey,
        'Epic'
      );
      
      if (!epicsResponse.success) {
        throw new Error(epicsResponse.error || 'Failed to fetch Epics');
      }
      
      const epics = epicsResponse.data;
      
      // Step 2: Get Features for each Epic
      const features: Record<string, ADOWorkItem[]> = {};
      
      for (const epic of epics) {
        const featuresResponse = await this.getChildWorkItems(
          organization,
          project,
          apiKey,
          epic.id
        );
        
        if (featuresResponse.success && featuresResponse.data.length > 0) {
          features[epic.id] = featuresResponse.data;
        } else {
          features[epic.id] = [];
        }
      }
      
      // Step 3: Get User Stories for each Feature
      const stories: Record<string, ADOWorkItem[]> = {};
      
      for (const epicId in features) {
        for (const feature of features[epicId]) {
          const storiesResponse = await this.getChildWorkItems(
            organization,
            project,
            apiKey,
            feature.id
          );
          
          if (storiesResponse.success && storiesResponse.data.length > 0) {
            stories[feature.id] = storiesResponse.data;
          } else {
            stories[feature.id] = [];
          }
        }
      }
      
      return {
        epics,
        features,
        stories,
      };
    } catch (error) {
      console.error('Error fetching work item hierarchy:', error);
      return {
        epics: [],
        features: {},
        stories: {},
      };
    }
  },
  
  /**
   * Execute a custom WIQL query
   * @param organization Azure DevOps organization name
   * @param project Azure DevOps project name
   * @param apiKey Azure DevOps API key (PAT)
   * @param wiql WIQL query to execute
   * @param fields Fields to include in the response
   * @returns Response with work items
   */
  async executeWiqlQuery(
    organization: string,
    project: string,
    apiKey: string,
    wiql: string,
    fields?: string[]
  ): Promise<GetWorkItemsResponse> {
    return this.getWorkItems({
      organization,
      project,
      api_key: apiKey,
      wiql,
      fields,
    });
  },
};

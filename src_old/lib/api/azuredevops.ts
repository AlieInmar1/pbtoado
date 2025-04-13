/**
 * Azure DevOps API Client
 * 
 * This client provides methods for interacting with the Azure DevOps REST API.
 * It handles authentication, request formatting, and response parsing.
 * 
 * Documentation: https://docs.microsoft.com/en-us/rest/api/azure/devops/
 */

import axios, { AxiosInstance } from 'axios';

export interface ADOWorkItem {
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

export interface ADOWorkItemType {
  name: string;
  referenceName: string;
  description: string;
  color: string;
  icon: string;
}

export interface ADOField {
  name: string;
  referenceName: string;
  type: string;
  readOnly: boolean;
  description: string;
}

export interface ADOProject {
  id: string;
  name: string;
  description: string;
  url: string;
  state: string;
  visibility: string;
}

export class AzureDevOpsClient {
  private client: AxiosInstance;
  private organization: string;
  private project: string;

  constructor(organization: string, project: string, personalAccessToken: string) {
    this.organization = organization;
    this.project = project;

    // Create an axios instance with the base URL and authentication
    this.client = axios.create({
      baseURL: `https://dev.azure.com/${organization}/${project}/_apis`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
      },
      params: {
        'api-version': '7.0', // Use the latest API version
      },
    });
  }

  /**
   * Test the connection to Azure DevOps
   * @returns True if the connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/projects');
      return response.status === 200;
    } catch (error) {
      console.error('Error testing connection to Azure DevOps:', error);
      return false;
    }
  }

  /**
   * Get a list of projects in the organization
   * @returns Array of projects
   */
  async getProjects(): Promise<ADOProject[]> {
    try {
      const response = await this.client.get('/projects');
      return response.data.value;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  /**
   * Get a list of work item types in the project
   * @returns Array of work item types
   */
  async getWorkItemTypes(): Promise<ADOWorkItemType[]> {
    try {
      const response = await this.client.get('/wit/workitemtypes');
      return response.data.value;
    } catch (error) {
      console.error('Error getting work item types:', error);
      throw error;
    }
  }

  /**
   * Get a list of fields for a work item type
   * @param workItemType The work item type to get fields for
   * @returns Array of fields
   */
  async getFields(workItemType: string): Promise<ADOField[]> {
    try {
      const response = await this.client.get(`/wit/workitemtypes/${workItemType}/fields`);
      return response.data.value;
    } catch (error) {
      console.error(`Error getting fields for work item type ${workItemType}:`, error);
      throw error;
    }
  }

  /**
   * Get a work item by ID
   * @param id The work item ID
   * @returns The work item
   */
  async getWorkItem(id: string): Promise<ADOWorkItem> {
    try {
      const response = await this.client.get(`/wit/workitems/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting work item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new work item
   * @param workItemType The type of work item to create (e.g., 'Epic', 'Feature', 'User Story')
   * @param fields The fields to set on the work item
   * @returns The created work item
   */
  async createWorkItem(workItemType: string, fields: Record<string, any>): Promise<ADOWorkItem> {
    try {
      // Convert fields to the format expected by the Azure DevOps API
      const operations = Object.entries(fields).map(([key, value]) => ({
        op: 'add',
        path: `/fields/${key}`,
        value,
      }));

      const response = await this.client.post(
        `/wit/workitems/$${workItemType}`,
        operations,
        {
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error creating ${workItemType}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing work item
   * @param id The work item ID
   * @param fields The fields to update on the work item
   * @returns The updated work item
   */
  async updateWorkItem(id: string, fields: Record<string, any>): Promise<ADOWorkItem> {
    try {
      // Convert fields to the format expected by the Azure DevOps API
      const operations = Object.entries(fields).map(([key, value]) => ({
        op: 'replace',
        path: `/fields/${key}`,
        value,
      }));

      const response = await this.client.patch(
        `/wit/workitems/${id}`,
        operations,
        {
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error updating work item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a parent-child relationship between two work items
   * @param parentId The parent work item ID
   * @param childId The child work item ID
   * @returns The updated parent work item
   */
  async createParentChildRelationship(parentId: string, childId: string): Promise<ADOWorkItem> {
    try {
      const operations = [
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: `https://dev.azure.com/${this.organization}/${this.project}/_apis/wit/workItems/${childId}`,
            attributes: {
              comment: 'Added parent-child relationship',
            },
          },
        },
      ];

      const response = await this.client.patch(
        `/wit/workitems/${parentId}`,
        operations,
        {
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error creating parent-child relationship between ${parentId} and ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Query work items using WIQL (Work Item Query Language)
   * @param query The WIQL query
   * @returns Array of work items
   */
  async queryWorkItems(query: string): Promise<ADOWorkItem[]> {
    try {
      // First, get the work item IDs from the query
      const response = await this.client.post(
        '/wit/wiql',
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const workItemIds = response.data.workItems.map((item: any) => item.id);

      if (workItemIds.length === 0) {
        return [];
      }

      // Then, get the work items by ID
      const workItemsResponse = await this.client.get(
        `/wit/workitems?ids=${workItemIds.join(',')}&$expand=relations`
      );

      return workItemsResponse.data.value;
    } catch (error) {
      console.error('Error querying work items:', error);
      throw error;
    }
  }

  /**
   * Get all work items of a specific type
   * @param workItemType The work item type to get (e.g., 'Epic', 'Feature', 'User Story')
   * @returns Array of work items
   */
  async getWorkItemsByType(workItemType: string): Promise<ADOWorkItem[]> {
    const query = `SELECT [System.Id], [System.Title], [System.State], [System.CreatedDate], [System.ChangedDate] FROM workitems WHERE [System.WorkItemType] = '${workItemType}' ORDER BY [System.ChangedDate] DESC`;
    return this.queryWorkItems(query);
  }

  /**
   * Get all work items that have been updated since a specific date
   * @param date The date to check for updates since
   * @returns Array of work items
   */
  async getWorkItemsUpdatedSince(date: Date): Promise<ADOWorkItem[]> {
    const formattedDate = date.toISOString();
    const query = `SELECT [System.Id], [System.Title], [System.State], [System.CreatedDate], [System.ChangedDate] FROM workitems WHERE [System.ChangedDate] >= '${formattedDate}' ORDER BY [System.ChangedDate] DESC`;
    return this.queryWorkItems(query);
  }

  /**
   * Get all child work items of a parent work item
   * @param parentId The parent work item ID
   * @returns Array of child work items
   */
  async getChildWorkItems(parentId: string): Promise<ADOWorkItem[]> {
    try {
      const parent = await this.getWorkItem(parentId);
      
      if (!parent.relations) {
        return [];
      }

      // Filter for child relationships
      const childRelations = parent.relations.filter(
        (relation) => relation.rel === 'System.LinkTypes.Hierarchy-Forward'
      );

      if (childRelations.length === 0) {
        return [];
      }

      // Extract the work item IDs from the URLs
      const childIds = childRelations.map((relation) => {
        const match = relation.url.match(/workItems\/(\d+)$/);
        return match ? match[1] : null;
      }).filter(Boolean);

      if (childIds.length === 0) {
        return [];
      }

      // Get the work items by ID
      const workItemsResponse = await this.client.get(
        `/wit/workitems?ids=${childIds.join(',')}&$expand=relations`
      );

      return workItemsResponse.data.value;
    } catch (error) {
      console.error(`Error getting child work items for ${parentId}:`, error);
      throw error;
    }
  }
}

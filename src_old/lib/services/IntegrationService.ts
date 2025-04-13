import { supabase } from '../supabase';
import { EntityMapping } from '../../types/database';

/**
 * Service for handling integration between ProductBoard and Azure DevOps
 */
export class IntegrationService {
  /**
   * Update an Azure DevOps work item title to include the ProductBoard ID prefix
   * @param adoId The Azure DevOps work item ID
   * @param pbId The ProductBoard feature ID
   * @param currentTitle The current title of the work item
   * @returns Promise<boolean> True if the update was successful
   */
  static async updateADOWorkItemTitle(adoId: string, pbId: string, currentTitle: string): Promise<boolean> {
    try {
      // Check if the title already has the prefix
      const pbIdPrefix = `[PB${pbId}]`;
      if (currentTitle.includes(pbIdPrefix)) {
        console.log(`ADO work item ${adoId} title already includes PB ID prefix`);
        return true;
      }
      
      // Get the ADO API configuration from workspaces table
      const { data: workspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('ado_api_key, ado_organization, ado_project_id')
        .limit(1);
      
      if (workspaceError) {
        console.error('Error fetching ADO configuration from workspaces:', workspaceError);
        
        // Fallback to configurations table
        const { data: configs, error: configError } = await supabase
          .from('configurations')
          .select('ado_api_key, ado_organization, ado_project_id')
          .eq('id', '1')
          .single();
        
        if (configError) {
          console.error('Error fetching ADO configuration from configurations:', configError);
          return false;
        }
        
        if (!configs || !configs.ado_api_key || !configs.ado_organization || !configs.ado_project_id) {
          console.error('Missing ADO configuration in configurations table');
          return false;
        }
        
        // Use configs from configurations table
        var ado_api_key = configs.ado_api_key;
        var ado_organization = configs.ado_organization;
        var ado_project_id = configs.ado_project_id;
      } else if (!workspaces || workspaces.length === 0 || !workspaces[0].ado_api_key || !workspaces[0].ado_organization || !workspaces[0].ado_project_id) {
        console.error('Missing ADO configuration in workspaces table');
        return false;
      } else {
        // Use configs from workspaces table
        var ado_api_key = workspaces[0].ado_api_key;
        var ado_organization = workspaces[0].ado_organization;
        var ado_project_id = workspaces[0].ado_project_id;
      }
      
      // Create the authorization header
      const credentials = `:${ado_api_key}`;
      const encodedCredentials = btoa(credentials);
      const authHeader = `Basic ${encodedCredentials}`;
      
      // Build the API URL
      const apiUrl = `https://dev.azure.com/${ado_organization}/${ado_project_id}/_apis/wit/workitems/${adoId}?api-version=7.0`;
      
      // Create the patch document
      const patchDocument = [
        {
          op: 'replace',
          path: '/fields/System.Title',
          value: `${pbIdPrefix} ${currentTitle}`
        }
      ];
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Authorization': authHeader
        },
        body: JSON.stringify(patchDocument)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating ADO work item title: ${response.status} ${response.statusText}`, errorText);
        return false;
      }
      
      console.log(`Successfully updated ADO work item ${adoId} title to include PB ID ${pbId}`);
      
      // Update the entity mapping to reflect the new title
      const { error: updateError } = await supabase
        .from('entity_mappings')
        .update({
          ado_title: `${pbIdPrefix} ${currentTitle}`,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('ado_id', adoId);
      
      if (updateError) {
        console.error('Error updating entity mapping after title update:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating ADO work item title:', error);
      return false;
    }
  }

  /**
   * Create a parent-child relationship between two ADO work items
   * @param parentId The parent work item ID
   * @param childId The child work item ID
   * @returns Promise<boolean> True if the relationship was created successfully
   */
  static async createADOParentChildRelationship(parentId: string, childId: string): Promise<boolean> {
    try {
      // Get the ADO API configuration from workspaces table
      const { data: workspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('ado_api_key, ado_organization, ado_project_id')
        .limit(1);
      
      if (workspaceError) {
        console.error('Error fetching ADO configuration from workspaces:', workspaceError);
        
        // Fallback to configurations table
        const { data: configs, error: configError } = await supabase
          .from('configurations')
          .select('ado_api_key, ado_organization, ado_project_id')
          .eq('id', '1')
          .single();
        
        if (configError) {
          console.error('Error fetching ADO configuration from configurations:', configError);
          return false;
        }
        
        if (!configs || !configs.ado_api_key || !configs.ado_organization || !configs.ado_project_id) {
          console.error('Missing ADO configuration in configurations table');
          return false;
        }
        
        // Use configs from configurations table
        var ado_api_key = configs.ado_api_key;
        var ado_organization = configs.ado_organization;
        var ado_project_id = configs.ado_project_id;
      } else if (!workspaces || workspaces.length === 0 || !workspaces[0].ado_api_key || !workspaces[0].ado_organization || !workspaces[0].ado_project_id) {
        console.error('Missing ADO configuration in workspaces table');
        return false;
      } else {
        // Use configs from workspaces table
        var ado_api_key = workspaces[0].ado_api_key;
        var ado_organization = workspaces[0].ado_organization;
        var ado_project_id = workspaces[0].ado_project_id;
      }
      
      // Create the authorization header
      const credentials = `:${ado_api_key}`;
      const encodedCredentials = btoa(credentials);
      const authHeader = `Basic ${encodedCredentials}`;
      
      // Build the API URL
      const apiUrl = `https://dev.azure.com/${ado_organization}/${ado_project_id}/_apis/wit/workitems/${childId}?api-version=7.0`;
      
      // Create the patch document to add the parent link
      const patchDocument = [
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: `https://dev.azure.com/${ado_organization}/${ado_project_id}/_apis/wit/workItems/${parentId}`,
            attributes: {
              comment: 'Added parent-child relationship'
            }
          }
        }
      ];
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          'Authorization': authHeader
        },
        body: JSON.stringify(patchDocument)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating parent-child relationship: ${response.status} ${response.statusText}`, errorText);
        return false;
      }
      
      console.log(`Successfully created parent-child relationship between ${parentId} and ${childId}`);
      return true;
    } catch (error) {
      console.error('Error creating parent-child relationship:', error);
      return false;
    }
  }

  /**
   * Find a parent entity mapping for a given ProductBoard feature
   * @param pbId The ProductBoard feature ID
   * @returns Promise<EntityMapping | null> The parent entity mapping, or null if not found
   */
  static async findParentEntityMapping(pbId: string): Promise<EntityMapping | null> {
    try {
      // First, get the feature to find its parent ID
      const { data: pbFeature, error: pbError } = await supabase
        .from('entity_mappings')
        .select('*')
        .eq('productboard_id', pbId)
        .single();
      
      if (pbError || !pbFeature || !pbFeature.productboard_parent_id) {
        return null;
      }
      
      // Now find the parent entity mapping
      const { data: parentMapping, error: parentError } = await supabase
        .from('entity_mappings')
        .select('*')
        .eq('productboard_id', pbFeature.productboard_parent_id)
        .single();
      
      if (parentError || !parentMapping) {
        return null;
      }
      
      return parentMapping as EntityMapping;
    } catch (error) {
      console.error('Error finding parent entity mapping:', error);
      return null;
    }
  }

  /**
   * Update a ProductBoard feature with an Azure DevOps work item ID
   * @param pbId The ProductBoard feature ID
   * @param adoId The Azure DevOps work item ID
   * @returns Promise<boolean> True if the update was successful
   */
  static async updateProductBoardFeatureWithADOId(pbId: string, adoId: string): Promise<boolean> {
    // This is a placeholder for the actual implementation
    // In a real implementation, you would use the ProductBoard API to update the feature
    console.log(`[MOCK] Updating ProductBoard feature ${pbId} with ADO ID ${adoId}`);
    
    // For now, just update our entity mapping
    try {
      const { error } = await supabase
        .from('entity_mappings')
        .update({
          ado_id: adoId,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('productboard_id', pbId);
      
      if (error) {
        console.error('Error updating entity mapping:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating ProductBoard feature:', error);
      return false;
    }
  }

  /**
   * Get the webhook URL for Azure DevOps
   * @returns The webhook URL
   */
  static getADOWebhookUrl(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/handle-ado-webhook`;
  }

  /**
   * Get instructions for setting up the Azure DevOps webhook
   * @returns Instructions for setting up the webhook
   */
  static getADOWebhookInstructions(): string {
    const webhookUrl = this.getADOWebhookUrl();
    
    return `
# Azure DevOps Webhook Setup Instructions

To set up the webhook in Azure DevOps:

1. Go to your Azure DevOps project
2. Navigate to Project Settings > Service Hooks
3. Click on the "+" button to add a new service hook
4. Select "Web Hooks" as the service
5. Choose the following triggers:
   - "Work item created"
   - "Work item updated"
6. Configure the filters:
   - Work item type: Any
   - Area path: [Optional] Specify if you want to limit to certain areas
   - Iteration path: [Optional] Specify if you want to limit to certain iterations
7. Set the webhook URL to:
   \`${webhookUrl}\`
8. Leave the HTTP headers empty
9. Set the "Basic authentication" to "None"
10. Click "Test" to verify the connection
11. Click "Finish" to save the webhook

The webhook is now configured to send events to our integration service.
    `;
  }
}

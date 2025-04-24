import { supabase } from '../supabase';
import { Story, CommitmentStatus } from '../../types/story-creator';
import { ProductBoardFeature, ProductBoardPushOptions, ProductBoardPushResult } from '../../types/productboard';
import { createProductBoardAdapter, updateStoryWithProductBoardId, storeAdoProductBoardMapping } from './adapters/productBoardAdapters';
import { PRODUCTBOARD_API_URL } from '../../config/constants';
import { getSystemConfig } from './systemConfig';

/**
 * API service for interacting with ProductBoard
 * Handles synchronization of stories between the local system and ProductBoard
 */

/**
 * Get the ProductBoard API token from system configuration
 */
async function getProductBoardToken(): Promise<string> {
  try {
    const apiToken = await getSystemConfig('productboard_api_token');
    
    // If token is empty, try to get it from environment variables as fallback
    if (!apiToken) {
      console.warn('ProductBoard API token not found in system config, checking environment variables as fallback');
      const envToken = import.meta.env.VITE_PRODUCTBOARD_API_TOKEN || '';
      
      if (envToken) {
        return envToken;
      }
      
      throw new Error('ProductBoard API token not configured');
    }
    
    return apiToken;
  } catch (error) {
    console.error('Error retrieving ProductBoard token:', error);
    throw new Error(`Failed to get ProductBoard API token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Push an item to ProductBoard as a feature.
 * Works with any source type that can be converted to ProductBoardFeature format.
 * 
 * @param feature The feature data to push to ProductBoard
 * @param options Additional options for pushing to ProductBoard
 * @returns The result of the push operation
 */
export async function pushToProductBoard(
  feature: ProductBoardFeature,
  options: ProductBoardPushOptions = {}
): Promise<ProductBoardPushResult> {
  try {
    const apiToken = await getProductBoardToken();
    
    // Apply option overrides if specified
    if (options.parentId) feature.parent_id = options.parentId;
    if (options.productId) feature.product_id = options.productId;
    if (options.componentId) feature.component_id = options.componentId;
    if (options.statusOverride) feature.status = options.statusOverride;
    
    // Determine if we're creating or updating
    const method = feature.id ? 'PUT' : 'POST';
    const url = feature.id 
      ? `${PRODUCTBOARD_API_URL}/features/${feature.id}`
      : `${PRODUCTBOARD_API_URL}/features`;
    
    // Make the API request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Version': '1',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(feature)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ProductBoard API error (${response.status}): ${errorText}`, {
        statusCode: response.status,
        errorText,
        feature: { ...feature, id: feature.id || 'new feature' }
      });
      
      return {
        success: false,
        message: `ProductBoard API error (${response.status}): ${errorText}`,
        errors: [{ status: response.status, detail: errorText }]
      };
    }
    
    const result = await response.json();
    console.info(`Successfully pushed to ProductBoard: ${result.id}`, {
      featureId: result.id,
      featureType: feature.type,
      featureName: feature.name
    });
    
    // Return success with the ProductBoard ID
    return {
      success: true,
      productboardId: result.id,
      details: result
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error pushing to ProductBoard: ${errorMessage}`, { error });
    
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}

/**
 * Push a Story to ProductBoard
 */
export async function pushStoryToProductBoard(
  story: Story,
  options: ProductBoardPushOptions = {}
): Promise<ProductBoardPushResult> {
  try {
    const adapter = createProductBoardAdapter(story);
    const productBoardFeature = adapter.toProductBoardFeature();
    
    const result = await pushToProductBoard(productBoardFeature, options);
    
    // If successful, update the story with the ProductBoard ID
    if (result.success && result.productboardId) {
      await updateStoryWithProductBoardId(story.id, result.productboardId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in pushStoryToProductBoard', { error, storyId: story.id });
    
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Push an Azure DevOps work item to ProductBoard
 */
export async function pushAdoWorkItemToProductBoard(
  workItem: any, // Using any for now since we don't have a proper type defined
  options: ProductBoardPushOptions = {}
): Promise<ProductBoardPushResult> {
  try {
    const adapter = createProductBoardAdapter(workItem);
    const productBoardFeature = adapter.toProductBoardFeature();
    
    const result = await pushToProductBoard(productBoardFeature, options);
    
    // If successful, store this mapping
    if (result.success && result.productboardId) {
      await storeAdoProductBoardMapping(workItem.id, result.productboardId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in pushAdoWorkItemToProductBoard', { error, workItemId: workItem.id });
    
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get feature data from ProductBoard by ID
 */
export async function getProductBoardFeature(id: string): Promise<ProductBoardFeature | null> {
  try {
    const apiToken = await getProductBoardToken();
    
    const response = await fetch(`${PRODUCTBOARD_API_URL}/features/${id}`, {
      method: 'GET',
      headers: {
        'X-Version': '1',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting ProductBoard feature: ${errorText}`, {
        statusCode: response.status,
        errorText,
        featureId: id
      });
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting ProductBoard feature: ${error}`, { featureId: id });
    return null;
  }
}

/**
 * Pull stories from ProductBoard into the local system.
 * 
 * @param options Optional configuration for the pull operation
 * @returns Array of created/updated story IDs
 */
export async function pullStoriesFromProductBoard(options: {
  since?: string;
  limit?: number;
} = {}): Promise<string[]> {
  try {
    const apiToken = await getProductBoardToken();
    
    // Build the query parameters
    const queryParams = new URLSearchParams();
    
    if (options.since) {
      queryParams.append('updatedSince', options.since);
    }
    
    if (options.limit) {
      queryParams.append('limit', options.limit.toString());
    }
    
    // Fetch features from ProductBoard
    const url = `${PRODUCTBOARD_API_URL}/features?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Version': '1',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ProductBoard API error (${response.status}): ${errorText}`);
    }
    
    const features = await response.json();
    const updatedStoryIds: string[] = [];
    
    // Process each feature
    for (const feature of features.data) {
      // Check if we already have this feature in our system
      const { data: existingStory } = await supabase
        .from('stories')
        .select('id')
        .eq('productboard_id', feature.id)
        .maybeSingle();
      
      const story = transformProductBoardFeatureToStory(feature);
      
      if (existingStory?.id) {
        // Update existing story
        const { data, error } = await supabase
          .from('stories')
          .update({
            ...story,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStory.id)
          .select()
          .single();
          
        if (error) throw error;
        if (data) updatedStoryIds.push(data.id);
      } else {
        // Create new story
        const { data, error } = await supabase
          .from('stories')
          .insert({
            ...story,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        if (data) updatedStoryIds.push(data.id);
      }
    }
    
    return updatedStoryIds;
  } catch (error) {
    console.error('Error pulling stories from ProductBoard:', error);
    throw error;
  }
}

/**
 * Transform a ProductBoard feature to the local story format
 */
const transformProductBoardFeatureToStory = (feature: any): Partial<Story> => {
  const customFields = feature.custom_fields || {};
  
  return {
    title: feature.name,
    description: feature.description || '',
    productboard_id: feature.id,
    commitment_status: mapProductBoardToStatus(feature.status),
    
    // Map ProductBoard custom fields to story fields
    acceptance_criteria: extractNoteContent(feature.notes, 'acceptance_criteria'),
    customer_need_description: extractNoteContent(feature.notes, 'customer_need'),
    release_notes: customFields.release_notes || '',
    engineering_assigned_story_points: customFields.effort || null,
    board_level_stack_rank: customFields.stack_rank || null,
    timeframe: customFields.timeframe || null,
    owner_name: customFields.owner || '',
    tags: customFields.tags ? customFields.tags.split(',').map((t: string) => t.trim()) : [],
    commercialization_needed: customFields.commercialization_needed || false,
    growth_driver: customFields.growth_driver || false,
    tentpole: customFields.tentpole || false,
    t_shirt_sizing: customFields.t_shirt_size || null,
    investment_category: customFields.investment_category || null,
    
    // RICE score components - defaults if not available
    reach_score: customFields.reach || 1,
    impact_score: customFields.impact || 1,
    confidence_score: customFields.confidence || 5,
    effort_score: customFields.effort_score || 5,
    rice_score: customFields.rice_score || null,
    
    // Sync metadata
    last_synced_at: new Date().toISOString()
  };
};

/**
 * Extract note content from ProductBoard notes array
 */
function extractNoteContent(notes: any[] = [], type: string): string {
  if (!notes || !Array.isArray(notes)) return '';
  
  const note = notes.find(n => n.type === type);
  return note ? note.content : '';
}

/**
 * Map ProductBoard status to local status
 */
const mapProductBoardToStatus = (status: string): CommitmentStatus | undefined => {
  const statusMap: Record<string, CommitmentStatus> = {
    'backlog': 'not_committed' as CommitmentStatus,
    'discovery': 'exploring' as CommitmentStatus,
    'in-progress': 'planning' as CommitmentStatus,
    'done': 'committed' as CommitmentStatus,
    'released': 'committed' as CommitmentStatus
  };
  
  return statusMap[status];
};

/**
 * Get list of available ProductBoard projects
 */
export async function getProductBoardProjects(): Promise<any[]> {
  try {
    const apiToken = await getProductBoardToken();
    
    // Fetch projects from ProductBoard
    const response = await fetch(`${PRODUCTBOARD_API_URL}/products`, {
      method: 'GET',
      headers: {
        'X-Version': '1',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ProductBoard API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching ProductBoard projects:', error);
    throw error;
  }
}

/**
 * Get a list of available ProductBoard users
 */
export async function getProductBoardUsers(): Promise<any[]> {
  try {
    const apiToken = await getProductBoardToken();
    
    // Fetch users from ProductBoard
    const response = await fetch(`${PRODUCTBOARD_API_URL}/users`, {
      method: 'GET',
      headers: {
        'X-Version': '1',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ProductBoard API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching ProductBoard users:', error);
    throw error;
  }
}

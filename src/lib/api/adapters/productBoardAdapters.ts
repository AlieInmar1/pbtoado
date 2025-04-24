import { supabase } from '../../supabase';
import { Story } from '../../../types/story-creator';
import { ProductBoardFeature } from '../../../types/productboard';

/**
 * Base interface for anything that can be converted to ProductBoard format
 */
export interface ProductBoardPushable {
  toProductBoardFeature(): ProductBoardFeature;
}

/**
 * Adapter for Story Creator stories
 */
export class StoryAdapter implements ProductBoardPushable {
  private story: Story;
  
  constructor(story: Story) {
    this.story = story;
  }
  
  toProductBoardFeature(): ProductBoardFeature {
    // Calculate RICE score if not already set
    const riceScore = this.story.rice_score || this.calculateRICEScore();
    
    // Build notes array
    const notes = [];
    
    if (this.story.acceptance_criteria) {
      notes.push({
        content: this.story.acceptance_criteria,
        type: 'acceptance_criteria' as const
      });
    }
    
    if (this.story.customer_need_description) {
      notes.push({
        content: this.story.customer_need_description,
        type: 'customer_need' as const
      });
    }
    
    // Map story fields to ProductBoard feature
    return {
      id: this.story.productboard_id,
      name: this.story.title,
      description: this.story.description || '',
      type: this.determineFeatureType(),
      status: this.mapStatusToProductBoard(),
      notes,
      custom_fields: {
        rice_score: riceScore,
        reach: this.story.reach_score,
        impact: this.story.impact_score,
        confidence: this.story.confidence_score,
        effort: this.story.effort_score,
        release_notes: this.story.release_notes || '',
        effort_story_points: this.story.engineering_assigned_story_points || 0,
        stack_rank: this.story.board_level_stack_rank || 999,
        timeframe: this.story.timeframe || null,
        owner: this.story.owner_name || '',
        tags: this.story.tags?.join(', ') || '',
        commercialization_needed: this.story.commercialization_needed || false,
        growth_driver: this.story.growth_driver || false,
        tentpole: this.story.tentpole || false,
        t_shirt_size: this.story.t_shirt_sizing || null,
        investment_category: this.story.investment_category || null,
        // Include source system info
        source_system: 'story_creator',
        source_id: this.story.id
      }
    };
  }
  
  private calculateRICEScore(): number {
    if (!this.story.reach_score || 
        !this.story.impact_score || 
        !this.story.confidence_score || 
        !this.story.effort_score) {
      return 0;
    }
    
    return Math.round(
      (this.story.reach_score * this.story.impact_score * this.story.confidence_score) / 
      this.story.effort_score
    );
  }
  
  private determineFeatureType(): 'feature' | 'task' | 'epic' | 'initiative' {
    // Logic to determine type based on story properties
    if (this.story.tentpole) return 'initiative';
    
    // You could use other properties to determine type
    // For now, default to 'feature'
    return 'feature';
  }
  
  private mapStatusToProductBoard(): string {
    if (!this.story.commitment_status) return 'backlog';
    
    const statusMap: Record<string, string> = {
      'not_committed': 'backlog',
      'exploring': 'discovery',
      'planning': 'in-progress',
      'committed': 'in-progress'
    };
    
    return statusMap[this.story.commitment_status] || 'backlog';
  }
}

/**
 * Adapter for Azure DevOps work items
 */
export class AdoWorkItemAdapter implements ProductBoardPushable {
  private workItem: any; // Using any for now since we don't have a proper type defined
  
  constructor(workItem: any) {
    this.workItem = workItem;
  }
  
  toProductBoardFeature(): ProductBoardFeature {
    // Implementation of Azure DevOps to ProductBoard mapping
    return {
      name: this.workItem.fields['System.Title'],
      description: this.workItem.fields['System.Description'] || '',
      type: this.mapAdoTypeToProductBoard(),
      status: this.mapAdoStateToProductBoard(),
      notes: this.extractNotesFromAdo(),
      custom_fields: {
        // Map relevant ADO fields to ProductBoard custom fields
        effort: this.workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'],
        source_system: 'azure_devops',
        source_id: this.workItem.id.toString()
        // Add more fields as needed
      }
    };
  }
  
  private mapAdoTypeToProductBoard(): 'feature' | 'task' | 'epic' | 'initiative' {
    const workItemType = this.workItem.fields['System.WorkItemType'];
    
    // Map ADO work item types to ProductBoard types
    switch (workItemType) {
      case 'Epic':
        return 'epic';
      case 'Feature':
        return 'feature';
      case 'User Story':
        return 'feature';
      case 'Task':
        return 'task';
      default:
        return 'feature';
    }
  }
  
  private mapAdoStateToProductBoard(): string {
    const state = this.workItem.fields['System.State'];
    
    // Map ADO states to ProductBoard statuses
    switch (state) {
      case 'New':
        return 'backlog';
      case 'Active':
        return 'in-progress';
      case 'Resolved':
        return 'in-progress';
      case 'Closed':
        return 'done';
      default:
        return 'backlog';
    }
  }
  
  private extractNotesFromAdo(): { content: string; type: 'acceptance_criteria' | 'customer_need' | 'technical_notes' | 'general' }[] {
    const notes = [];
    
    // Extract acceptance criteria
    if (this.workItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria']) {
      notes.push({
        content: this.workItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'],
        type: 'acceptance_criteria' as const
      });
    }
    
    // Extract business value/customer need
    if (this.workItem.fields['Microsoft.VSTS.Common.BusinessValue']) {
      notes.push({
        content: this.workItem.fields['Microsoft.VSTS.Common.BusinessValue'],
        type: 'customer_need' as const
      });
    }
    
    return notes;
  }
}

/**
 * Factory function to create the appropriate adapter
 */
export function createProductBoardAdapter(item: any): ProductBoardPushable {
  // Determine the type of item and return the appropriate adapter
  if (item.hasOwnProperty('fields') && item.hasOwnProperty('_links')) {
    // Looks like an ADO work item
    return new AdoWorkItemAdapter(item);
  } else if (
    item.hasOwnProperty('title') && 
    (item.hasOwnProperty('commitment_status') || item.hasOwnProperty('description'))
  ) {
    // Looks like a Story Creator story
    return new StoryAdapter(item as Story);
  }
  
  throw new Error('Unknown item type for ProductBoard adapter');
}

/**
 * Update a story with its ProductBoard ID
 */
export async function updateStoryWithProductBoardId(storyId: string, productboardId: string): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({
      productboard_id: productboardId,
      sync_with_productboard: true,
      last_synced_at: new Date().toISOString()
    })
    .eq('id', storyId);
    
  if (error) {
    throw new Error(`Failed to update story with ProductBoard ID: ${error.message}`);
  }
}

/**
 * Store mapping between ADO work item and ProductBoard feature
 */
export async function storeAdoProductBoardMapping(workItemId: number, productboardId: string): Promise<void> {
  const { error } = await supabase
    .from('ado_productboard_mappings')
    .upsert({
      ado_work_item_id: workItemId,
      productboard_id: productboardId,
      last_synced_at: new Date().toISOString()
    });
    
  if (error) {
    throw new Error(`Failed to store ADO-ProductBoard mapping: ${error.message}`);
  }
}

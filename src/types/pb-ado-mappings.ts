/**
 * Typescript type definitions for the ProductBoard-ADO integration
 */

export interface PBAdoMappingBase {
  id: string;
  pb_feature_id: string;
  ado_work_item_id?: number;
  status: 'pending' | 'synced' | 'error' | 'syncing';
  sync_eligible: boolean;
  sync_triggered_at?: Date;
  item_created_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowTrackingFields {
  product_groomed: boolean;
  tech_groomed: boolean;
  in_sprint: boolean;
  sprint_rank?: number;
  product_groomed_at?: Date;
  tech_groomed_at?: Date;
  added_to_sprint_at?: Date;
}

export interface RankTrackingFields {
  pb_feature_rank?: number;
  pb_story_within_feature_rank?: number;
  ado_backlog_rank?: number;
  pb_board_section?: string;
}

export interface RelationshipFields {
  origin_system: 'productboard' | 'ado' | 'internal';
  item_type: 'story' | 'feature' | 'bug' | 'task';
  parent_id?: string;
  is_split: boolean;
  parent_story_id?: string;
  split_status?: 'active' | 'deprecated' | 'replaced';
  original_estimate?: number;
  remaining_estimate?: number;
}

export interface FlexibleFields {
  metadata: Record<string, any>;
  tags: string[];
}

/**
 * Complete representation of a ProductBoard-ADO mapping entry
 * with all enhanced fields for tracking workflow, rank, relationships, etc.
 */
export interface PBAdoEnhancedMapping extends 
  PBAdoMappingBase, 
  WorkflowTrackingFields, 
  RankTrackingFields,
  RelationshipFields,
  FlexibleFields {}

/**
 * Type for sync log entries between ProductBoard and ADO
 */
export interface PBAdoSyncLog {
  id: string;
  mapping_id: string;
  operation_type: 'create' | 'update' | 'link' | 'status_change' | 'rank_update' | 'split' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'skipped';
  error_message?: string;
  request_payload?: Record<string, any>;
  response_payload?: Record<string, any>;
  source_system: 'productboard' | 'ado';
  target_system: 'productboard' | 'ado';
  user_id?: string;
  created_at: Date;
}

/**
 * Type for story splitting operations
 */
export interface StorySplitOperation {
  original_story_id: string;
  new_stories: Array<{
    title: string;
    description: string;
    estimate?: number;
    tags?: string[];
  }>;
  remaining_points?: number;
  mark_original_as?: 'deprecated' | 'completed' | 'unchanged';
}

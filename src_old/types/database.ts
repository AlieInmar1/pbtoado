export interface Workspace {
  id: string;
  name: string;
  pb_api_key: string;
  ado_api_key: string;
  pb_board_id: string;
  ado_project_id: string;
  ado_organization: string;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  created_at?: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  workspace_id: string;
  pb_id: string;
  pb_title: string;
  description?: string;
  level: 'epic' | 'feature' | 'story';
  status: 'open' | 'in_progress' | 'done' | 'blocked';
  product_line?: string;
  parent_id?: string;
  sync_status?: 'not_synced' | 'synced' | 'conflict';
  completion_percentage?: number;
  rice_score?: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    total: number;
  };
  needs_split: boolean;
  version: number;
  is_draft: boolean;
  dependencies?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductBoardFeature {
  id: string;
  workspace_id: string;
  productboard_id: string;
  name: string;
  description?: string;
  status: string;
  parent_productboard_id?: string;
  parent_name?: string;
  type: 'initiative' | 'feature' | 'component' | 'product';
  updated_at_timestamp: number;
  created_at?: string;
  updated_at?: string;
  sync_status?: 'not_synced' | 'synced' | 'conflict';
}

export interface SyncRecord {
  id: string;
  workspace_id: string;
  sync_type: 'pb_to_ado' | 'ado_to_pb' | 'full' | 'partial' | 'manual';
  sync_source: 'productboard' | 'azure_devops' | 'user';
  sync_target: 'productboard' | 'azure_devops' | 'database';
  status: 'success' | 'failed' | 'in_progress';
  start_time: string;
  end_time?: string;
  duration_ms: number;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductBoardTrackedBoard {
  id: string;
  workspace_id: string;
  board_id: string;
  board_name: string;
  board_type: 'features' | 'objectives' | 'sprints';
  is_active: boolean;
  last_synced_at?: string;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  created_at?: string;
  updated_at?: string;
}

export interface ProductBoardItemRanking {
  id: string;
  workspace_id: string;
  board_id: string;
  story_id: string;
  story_name?: string;
  current_rank: number;
  previous_rank?: number;
  matching_id?: string;
  is_synced_to_ado: boolean;
  sync_history_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroomingSession {
  id: string;
  workspace_id: string;
  name: string;
  session_date: string;
  duration_minutes: number;
  session_type: 'product' | 'technical' | 'refinement';
  status: 'planned' | 'in_progress' | 'completed';
  action_items: any[];
  created_at?: string;
  updated_at?: string;
}

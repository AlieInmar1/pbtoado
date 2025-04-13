export interface Workspace {
  id: string;
  name: string;
  pb_board_id: string;
  ado_project_id: string;
  pb_api_key: string;
  ado_api_key: string;
  ado_organization: string;
  sync_frequency: string;
  last_sync_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  workspace_id: string;
  pb_id: string;
  pb_title: string;
  ado_id: string | null;
  ado_title: string | null;
  description: string | null;
  status: string;
  story_points: number | null;
  completion_percentage: number;
  sync_status: string;
  needs_split: boolean;
  rice_score: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    total: number;
  } | null;
  sprintable: boolean | null;
  completeness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Added fields from migrations
  level?: 'epic' | 'feature' | 'story';
  parent_id?: string;
  product_line?: string;
  growth_driver?: string;
  investment_category?: string;
  tentpole?: string;
  product_leader_approval?: string;
  tshirt_size?: string;
  engineering_points?: number;
  acceptance_criteria?: any[];
  ai_suggestions?: Record<string, any>;
  version?: number;
  is_draft?: boolean;
  
  // Ranking fields
  current_rank?: number;
  previous_rank?: number;
  rank_changed_at?: string;
}

export interface StoryTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  level: 'epic' | 'feature' | 'story';
  template_data: {
    title_template?: string;
    description_template?: string;
    acceptance_criteria_template?: string[];
    product_line?: string;
    growth_driver?: string;
    investment_category?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  workspace_id: string;
  action: string;
  story_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface SyncRecord {
  id: string;
  created_at: string;
  sync_type: string;
  status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  sync_source: string;
  sync_target: string;
  duration_ms: number;
  workspace_id: string;
}

export interface Configuration {
  id: string;
  workspace_id: string;
  openai_api_key: string | null;
  slack_api_key: string | null;
  slack_channel_id: string | null;
  google_spaces_webhook_url: string | null;
  productboard_api_key: string | null;
  ado_api_key: string | null;
  ado_organization: string | null;
  ado_project_id: string | null;
  field_propagation_enabled: boolean;
  epic_to_feature_rules: Record<string, any>;
  feature_to_story_rules: Record<string, any>;
  risk_threshold_days: number;
  created_at: string;
  updated_at: string;
}

export interface GroomingSession {
  id: string;
  workspace_id: string;
  name: string;
  session_date: string;
  duration_minutes: number | null;
  status: 'planned' | 'in_progress' | 'completed';
  session_type: 'product' | 'technical' | 'refinement';
  facilitator_id: string | null;
  transcript: string | null;
  summary: string | null;
  action_items: Array<{
    description: string;
    assignee: string;
    due_date: string;
    status: 'pending' | 'completed';
  }>;
  recording_url: string | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductBoardTrackedBoard {
  id: string;
  workspace_id: string;
  board_id: string;
  board_name: string;
  board_url: string;
  last_synced_at: string | null;
  sync_enabled: boolean;
  use_shared_tokens: boolean;
  auto_sync_rankings?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductBoardSyncHistory {
  id: string;
  workspace_id: string;
  board_id: string;
  status: 'success' | 'failed' | 'in_progress';
  stories_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  rankings_stored?: boolean;
  created_at: string;
}

export interface ProductBoardItemRanking {
  id: string;
  workspace_id: string;
  board_id: string;
  sync_history_id: string;
  story_id: string;
  story_name: string;
  current_rank: number;
  previous_rank?: number;
  indent_level?: number;
  matching_id?: string;
  is_synced_to_ado: boolean;
  synced_to_ado_at?: string;
  created_at: string;
  updated_at: string;
}

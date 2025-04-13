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

export interface AIPrompt {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  id: string;
  workspace_id: string;
  pb_field: string;
  ado_field: string;
  mapping_type: 'direct' | 'transform' | 'lookup' | 'epic_business_unit' | 'feature_product_code' | 'story_team';
  mapping_rules: Record<string, any>;
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
  
  // Enhanced fields
  preparation_notes?: string | null;
  outcome_summary?: string | null;
  metrics?: Record<string, any>;
  start_time?: string | null;
  end_time?: string | null;
  stories_discussed?: number;
  stories_completed?: number;
  stories_deferred?: number;
  stories_split?: number;
}

export interface GroomingSessionStory {
  id: string;
  session_id: string;
  story_id: string;
  initial_state: Partial<Story>;
  final_state: Partial<Story> | null;
  discussion_points: string[];
  decisions: string[];
  status: 'pending' | 'discussed' | 'deferred' | 'split' | 'rejected';
  review_comments: string | null;
  technical_notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Enhanced fields
  discussion_order?: number | null;
  discussion_duration_minutes?: number | null;
  questions?: string[];
  action_required?: boolean;
  action_owner?: string | null;
  action_due_date?: string | null;
  complexity_rating?: number | null;
  risk_rating?: number | null;
  risk_notes?: string | null;
}

export interface GroomingSessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  email?: string | null;
  role: 'facilitator' | 'product_owner' | 'tech_lead' | 'developer' | 'designer' | 'qa' | 'observer';
  attendance_status: 'invited' | 'confirmed' | 'declined' | 'attended' | 'no_show';
  joined_at?: string | null;
  left_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface GroomingSessionTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  session_type: 'product' | 'technical' | 'refinement';
  agenda_template: string | null;
  checklist: Array<{
    title: string;
    description?: string;
    required: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EntityMapping {
  id: string;
  
  // ADO side
  ado_id: string;
  ado_type: string;
  ado_title: string;
  ado_description?: string;
  ado_state?: string;
  ado_url?: string;
  ado_team?: string;
  ado_product_code?: string;
  ado_business_unit?: string;
  ado_parent_id?: string;
  ado_rank?: number;
  ado_last_synced_at?: string;
  
  // ProductBoard side
  productboard_id: string;
  productboard_type: string;
  productboard_name: string;
  productboard_description?: string;
  productboard_status?: string;
  productboard_url?: string;
  productboard_parent_id?: string;
  productboard_rank?: number;
  productboard_last_synced_at?: string;
  
  // Sync metadata
  sync_status: 'synced' | 'pending' | 'conflict';
  sync_direction: 'ado_to_pb' | 'pb_to_ado' | 'bidirectional';
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RankingHistory {
  id: string;
  product_id: string;
  context_type: 'feature' | 'story' | 'mixed';
  ranking_data: {
    items: Array<{
      id: string;
      ado_id: string;
      productboard_id: string;
      type: string;
      name: string;
      position: number;
    }>
  };
  created_by?: string;
  created_at: string;
}

export interface EntitySyncLog {
  id: string;
  entity_mapping_id: string;
  operation: 'link' | 'update' | 'create' | 'delete' | 'rank';
  status: 'success' | 'failure';
  details?: {
    changes?: Array<{
      field: string;
      old_value: any;
      new_value: any;
    }>;
    error?: string;
  };
  created_at: string;
}

export interface ProductBoardUICredentials {
  id: string;
  workspace_id: string;
  username: string;
  password: string;
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

// New table for storing detailed ProductBoard ranking data
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

// View for tracking rank changes
export interface ProductBoardRankChange {
  id: string;
  workspace_id: string;
  board_id: string;
  story_id: string;
  story_name: string;
  current_rank: number;
  previous_rank: number;
  rank_change: number;
  change_direction: 'up' | 'down' | 'unchanged';
  indent_level?: number;
  matching_id?: string;
  is_synced_to_ado: boolean;
  synced_to_ado_at?: string;
  updated_at: string;
  board_name: string;
  has_changed: boolean;
}

export interface ProductBoardFeature {
  id: string;
  productboard_id: string;
  name: string;
  description: string;
  parent_type: string | null;
  parent_productboard_id: string | null;
  feature_type: string | null;
  status_id: string | null;
  status_name: string | null;
  timeframe_start_date: string | null;
  timeframe_end_date: string | null;
  timeframe_granularity: string | null;
  owner_email: string | null;
  is_archived: boolean;
  created_at_timestamp: string | null;
  updated_at_timestamp: string | null;
  last_health_update: string | null;
  metadata: any;
  workspace_id?: string;
  
  // Extracted metadata fields
  metadata_primary_product?: string | null;
  metadata_category?: string | null;
  metadata_priority?: string | null;
  metadata_effort_estimate?: number | null;
  metadata_impact_score?: number | null;
  metadata_target_release?: string | null;
  metadata_last_updated?: string | null;
  metadata_created_by?: string | null;
  metadata_assigned_to?: string | null;
  
  // Compatibility fields for the existing UI
  level?: string;
  pb_title?: string;
  status?: string;
  product_line?: string;
  parent_id?: string | null;
  story_points?: number | null;
  completeness_score?: number | null;
  sync_status?: string | null;
  rice_score?: any;
  current_rank?: number | null;
  previous_rank?: number | null;
}

export interface StoryWithChildren extends ProductBoardFeature {
  children?: StoryWithChildren[];
  expanded?: boolean;
}

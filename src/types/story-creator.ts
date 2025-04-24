/**
 * Type definitions for the Story Creator feature
 */

// The standardized RICE scoring values in 20-point increments
export type ScoreValue = 0 | 20 | 40 | 60 | 80 | 100;

/**
 * Enum types for various story fields
 */
export enum HealthStatus {
  OnTrack = 'on_track',
  AtRisk = 'at_risk',
  OffTrack = 'off_track',
  OnHold = 'on_hold',
  Completed = 'completed',
  // Additional values used in the codebase
  Healthy = 'healthy',
  Blocked = 'blocked'
}

export enum InvestmentCategory {
  CoreProduct = 'core_product',
  ProductEnhancement = 'product_enhancement',
  CustomerRequest = 'customer_request',
  TechnicalDebt = 'technical_debt',
  Infrastructure = 'infrastructure',
  ResearchAndDevelopment = 'research_and_development',
  ImplementationStory = 'implementation_story'
}

export enum ApprovalStatus {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Approved = 'approved',
  Rejected = 'rejected',
  Pending = 'pending'
}

export enum TShirtSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl'
}

export enum CommitmentStatus {
  Committed = 'committed',
  Likely = 'likely',
  Stretch = 'stretch',
  NotCommitted = 'not_committed',
  // Additional values used in the codebase
  Exploring = 'exploring',
  Planning = 'planning'
}

/**
 * Story reference structure for dropdowns and selection
 */
export interface StoryReference {
  id: string;
  title: string;
  type?: 'feature' | 'sub-feature' | 'story';
}

/**
 * Core Story interface representing a feature or user story
 * with all ProductBoard compatible fields
 */
export interface Story {
  id: string;
  productboard_id?: string;  // ID in ProductBoard if synced
  parent_feature_id?: string;  // Parent feature in ProductBoard
  parent_feature_name?: string; // Display name of parent feature
  
  // Core fields
  title: string;
  description: string;
  type: 'feature' | 'sub-feature' | 'story';
  investment_category?: string;
  status?: string;
  
  // Context & teams
  component_id?: string;
  component_name?: string;
  teams?: string[];
  owner_id?: string;
  owner_name?: string;
  
  // Classification fields
  tags?: string[];
  product_line?: string[];
  products?: string[];
  
  // Planning fields
  timeframe?: string;
  dependencies?: string[];
  effort_score: number;  // Person-months (0.5 or whole numbers)
  
  // RICE+ scoring fields
  reach_score: ScoreValue;
  impact_score: ScoreValue;
  confidence_score: ScoreValue;
  os_compatibility: ScoreValue;
  
  // Detailed content
  acceptance_criteria?: string;
  customer_need_description?: string;
  business_impact?: string;
  solution_approach?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  sync_with_productboard?: boolean;
  created_by?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Additional fields found in the codebase
  health?: HealthStatus;
  rice_score?: number; // Calculated RICE score
  commitment_status?: CommitmentStatus;
  product_leader_approval?: ApprovalStatus;
  tentpole?: boolean;
  growth_driver?: boolean;
  commercialization_needed?: boolean;
  board_level_stack_rank?: number;
  release_notes?: string;
  t_shirt_sizing?: TShirtSize;
  engineering_assigned_story_points?: number;
  loe_requested?: boolean;
  matching_id?: string;
  azure_workitem_id?: string;
  customer_importance_score?: ScoreValue;
}

/**
 * User reference structure for dropdowns and selection
 */
export interface UserReference {
  id: string;
  name: string;
}

/**
 * Team reference structure for dropdowns and selection
 */
export interface TeamReference {
  id: string;
  name: string;
}

/**
 * ProductBoard component reference 
 */
export interface ProductReference {
  id: string;
  name: string;
}

/**
 * Template structure for story creation
 */
export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'sub-feature' | 'story';
  template_content: Partial<Story>;
  created_at: string;
  created_by?: string;
}

/**
 * Relation type for visualizing relationships
 */
export interface StoryRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: 'parent' | 'child' | 'dependency' | 'related';
  strength: number; // 1-5 scale for visualization
}

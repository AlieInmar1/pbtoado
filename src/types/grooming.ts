// Types for the grooming system

// Session related types
export interface GroomingSession {
  id: string;
  name: string;
  session_date: string;
  duration_minutes: number;
  session_type: 'product' | 'technical' | 'refinement';
  status: 'planned' | 'in_progress' | 'completed';
  workspace_id: string;
  facilitator_id?: string;
  transcript?: string;
  created_at: string;
  updated_at: string;
  action_items?: ActionItem[];
  participants?: Participant[];
}

export interface ActionItem {
  description: string;
  assignee: string;
  due_date: string;
  status: 'pending' | 'completed';
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'facilitator' | 'participant' | 'observer';
}

export interface SessionStory {
  id: string;
  session_id: string;
  story_id: string;
  status: 'pending' | 'discussed' | 'skipped';
  complexity_rating?: number;
  risk_rating?: number;
  discussion_duration_minutes?: number;
  discussion_notes?: string;
  discussion_points?: string[];
  decisions?: string[];
  questions?: string[];
  created_at: string;
  updated_at: string;
}

export interface GroomingStory {
  id: string;
  session_id: string;
  story_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'discussed' | 'skipped';
  complexity_rating?: number;
  risk_rating?: number;
  discussion_duration_minutes?: number;
  discussion_notes?: string;
  action_items?: ActionItem[];
  acceptance_criteria?: AcceptanceCriterion[];
  story_points?: number;
  complexity?: number; // 1=low, 2=medium, 3=high
  pb_feature_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  status: 'pending' | 'met' | 'not_met';
}

export interface StoryRelationship {
  id: string;
  parent_story_id: string;
  child_story_id: string;
  relationship_type: 'split' | 'dependency' | 'related';
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: 'facilitator' | 'participant' | 'observer';
  created_at: string;
}

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity_points: number;
  team_id: string;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SessionSprint {
  id: string;
  session_id: string;
  sprint_id: string;
  created_at: string;
}

export interface SprintStory {
  id: string;
  sprint_id: string;
  story_id: string;
  priority: number;
  story_points: number;
  story?: GroomingStory;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  id: string;
  session_id?: string;
  story_id?: string;
  analysis_type: 'transcript' | 'story';
  key_points?: string[];
  decisions?: string[];
  action_items?: ActionItem[];
  complexity_assessment?: string;
  risk_areas?: string[];
  suggested_improvements?: string[];
  created_at: string;
}

// Request types
export interface CreateSessionRequest {
  name: string;
  session_date: string;
  duration_minutes: number;
  session_type: 'product' | 'technical' | 'refinement';
  workspace_id: string;
  facilitator_id?: string;
}

export interface UpdateSessionRequest {
  id: string; // Added id property
  name?: string;
  session_date?: string;
  duration_minutes?: number;
  session_type?: 'product' | 'technical' | 'refinement';
  status?: 'planned' | 'in_progress' | 'completed';
  facilitator_id?: string;
}

export interface CreateStoryRequest {
  title: string;
  description?: string;
  acceptance_criteria?: string[] | { id: string; completed: boolean; text: string; }[];
  story_points?: number;
  complexity?: number; // 1=low, 2=medium, 3=high
  pb_feature_id?: string;
  workspace_id: string; // Required by the database
}

export interface UpdateStoryRequest {
  id: string; // Added id property
  title?: string;
  description?: string;
  status?: 'pending' | 'discussed' | 'skipped';
  complexity_rating?: number;
  risk_rating?: number;
  discussion_notes?: string;
  acceptance_criteria?: AcceptanceCriterion[];
  story_points?: number;
  complexity?: number; // 1=low, 2=medium, 3=high
}

export interface AddStoryToSessionRequest {
  session_id: string;
  story_id: string;
}

export interface UpdateSessionStoryRequest {
  status?: 'pending' | 'discussed' | 'skipped';
  complexity_rating?: number;
  risk_rating?: number;
  discussion_duration_minutes?: number;
  discussion_notes?: string;
  discussion_points?: string[];
  decisions?: string[];
  questions?: string[];
}

export interface CreateSprintRequest {
  name: string;
  start_date: string;
  end_date: string;
  capacity_points: number;
  team_id: string;
}

export interface UpdateSprintRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  capacity_points?: number;
  status?: 'planning' | 'active' | 'completed';
}

export interface AddStoryToSprintRequest {
  sprint_id: string;
  story_id: string;
  priority: number;
  story_points: number;
}

export interface UpdateSprintStoryRequest {
  priority?: number;
  story_points?: number;
}

export interface CreateStoryRelationshipRequest {
  parent_story_id: string;
  child_story_id: string;
  relationship_type: 'split' | 'dependency' | 'related';
}

export interface AddParticipantRequest {
  session_id: string;
  user_id: string;
  role: 'facilitator' | 'participant' | 'observer';
}

export interface SplitStoryRequest {
  original_story_id: string;
  new_stories: CreateStoryRequest[];
  split_rationale?: string; // Added for split rationale
}

export interface AnalyzeTranscriptRequest {
  sessionId: string;
  transcript: string;
}

export interface AnalyzeStoryRequest {
  storyId: string;
  content: string;
}

export interface AssociateSessionWithSprintRequest {
  session_id: string;
  sprint_id: string;
}

// Filter types
export interface SessionFilter {
  workspace_id?: string;
  status?: 'planned' | 'in_progress' | 'completed';
  session_type?: 'product' | 'technical' | 'refinement';
  from_date?: string;
  to_date?: string;
  facilitator_id?: string;
  search?: string; // Added for search functionality
}

export interface StoryFilter {
  session_id?: string;
  workspace_id?: string; // Added for workspace filtering
  status?: 'pending' | 'discussed' | 'skipped' | 'new' | 'groomed' | 'ready' | 'in_sprint' | 'done';
  complexity?: number; // 1=low, 2=medium, 3=high
  level?: string; // Added for level filtering
  parent_story_id?: string; // Added for parent story filtering
  pb_feature_id?: string;
  ado_work_item_id?: string | number; // Added for ADO work item filtering, can be string or number
  search?: string; // Added for search functionality
}

export interface SprintFilter {
  team_id?: string;
  workspace_id?: string; // Added for workspace filtering
  status?: 'planning' | 'active' | 'completed';
  from_date?: string;
  to_date?: string;
  search?: string; // Added for search functionality
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

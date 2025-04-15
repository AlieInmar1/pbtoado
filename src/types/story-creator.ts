// Types for the AI Story/Feature Creator system

// Template related types
export interface StoryTemplate {
  id: string;
  name: string;
  type: 'feature' | 'sub-feature' | 'bug' | 'enhancement' | 'task';
  description?: string;
  default_content: StoryContent;
  required_fields: string[];
  suggested_acceptance_criteria: string[];
  created_at: string;
  updated_at: string;
  workspace_id: string;
}

export interface StoryContent {
  title: string;
  description: string;
  acceptance_criteria: string[];
  hierarchy_level?: 'epic' | 'feature' | 'story' | 'task';
  [key: string]: any; // Additional fields based on template type
}

// AI Suggestion related types
export interface AISuggestion {
  id: string;
  story_id: string;
  field_name: string;
  suggestion: string;
  confidence: number;
  accepted: boolean;
  created_at: string;
  workspace_id: string;
}

export interface AIRecommendation {
  field: string;
  value: string | string[];
  confidence: number;
  explanation?: string;
}

export interface AIAnalysisResult {
  title_suggestions?: string[];
  description_suggestions?: string[];
  acceptance_criteria?: string[];
  complexity_estimate?: number;
  effort_estimate?: number;
  team_suggestions?: string[];
  component_suggestions?: string[];
  risk_assessment?: RiskAssessment[];
  duplicate_check?: DuplicateCheckResult;
}

export interface RiskAssessment {
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation_suggestion?: string;
}

export interface DuplicateCheckResult {
  has_duplicates: boolean;
  potential_duplicates?: {
    story_id: string;
    title: string;
    similarity_score: number;
  }[];
}

// Story Pattern related types
export interface StoryPattern {
  id: string;
  pattern_type: string;
  pattern_data: any;
  frequency: number;
  team_id?: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
}

// Context related types
export interface StoryContext {
  parent?: {
    id: string;
    title: string;
    description?: string;
    type: string;
  };
  siblings?: {
    id: string;
    title: string;
    description?: string;
    type: string;
  }[];
  children?: {
    id: string;
    title: string;
    description?: string;
    type: string;
  }[];
}

// Request/Response types
export interface CreateStoryTemplateRequest {
  name: string;
  type: string;
  description?: string;
  default_content: StoryContent;
  required_fields: string[];
  suggested_acceptance_criteria: string[];
  workspace_id: string;
}

export interface UpdateStoryTemplateRequest {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  default_content?: StoryContent;
  required_fields?: string[];
  suggested_acceptance_criteria?: string[];
}

export interface AnalyzeStoryRequest {
  title?: string;
  description?: string;
  acceptance_criteria?: string[];
  parent_id?: string;
  workspace_id: string;
  [key: string]: any; // Additional fields
}

export interface CreateStoryWithAIRequest {
  template_id: string;
  content: Partial<StoryContent>;
  parent_id?: string;
  workspace_id: string;
}

export interface StoryCreationResult {
  story_id: string;
  pb_feature_id?: string;
  title: string;
  success: boolean;
  error?: string;
}

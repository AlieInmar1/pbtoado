import type { Story } from '../types/database';

export interface AnalyzeStoryParams {
  workspaceId: string;
  storyData: {
    level?: 'feature' | 'story';
    title?: string;
    description: string;
    acceptanceCriteria?: string[];
  };
}

export interface AnalyzeStoryResponse {
  isSprintable?: boolean;
  reasons?: string[];
  suggestions?: string[];
  improvements?: {
    title?: string | null;
    description?: string | null;
    acceptanceCriteria?: string[] | null;
  };
}

export interface BreakdownStoryParams {
  workspaceId: string;
  storyData: {
    title: string;
    description: string;
    level: 'feature' | 'story';
  };
}

export interface BreakdownStoryResponse {
  title: string;
  description: string;
  storyPoints: number;
  acceptanceCriteria: string[];
  technicalNotes: string;
  dependencies: string[];
  risks: string[];
}

export interface GenerateStoryParams {
  type: 'user_need' | 'feature_idea' | 'pain_point' | 'business_objective';
  prompt: string;
  workspaceId: string;
}

export interface GenerateStoryResponse {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  riceScore: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
    total: number;
  };
  sprintable: boolean;
  completenessScore: number;
}

export interface AnalyzeTranscriptParams {
  sessionId: string;
  transcript: string;
}

export interface AnalyzeTranscriptResponse {
  summary: string;
  story_updates: Array<{
    id: string;
    title?: string;
    description?: string;
    acceptance_criteria?: string[];
    technical_notes?: string;
    discussion_points: string[];
    decisions: string[];
  }>;
  action_items: Array<{
    description: string;
    assignee?: string;
    due_date?: string;
  }>;
  next_steps: string[];
}

export interface FunctionProvider {
  analyzeStory: (params: AnalyzeStoryParams) => Promise<AnalyzeStoryResponse>;
  breakdownStory: (params: BreakdownStoryParams) => Promise<BreakdownStoryResponse>;
  generateStory: (params: GenerateStoryParams) => Promise<GenerateStoryResponse>;
  analyzeTranscript: (params: AnalyzeTranscriptParams) => Promise<AnalyzeTranscriptResponse>;
}
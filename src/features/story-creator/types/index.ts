/**
 * Core Types for the AI Story/Feature Creator System
 * 
 * This file contains the fundamental types and interfaces used throughout the
 * story creation system, including data structures for analysis, context,
 * patterns, and relationships.
 */

import { StoryContent, StoryTemplate } from "../../../types/story-creator";

/**
 * Entity types supported by the analysis system
 */
export type EntityType = 'feature' | 'story' | 'component' | 'template';

/**
 * Relationship types between entities
 */
export type RelationshipType = 
  | 'parent-child'   // Hierarchical relationship
  | 'sibling'        // Related at the same level
  | 'related'        // General relationship
  | 'depends-on'     // Dependency relationship
  | 'similar-to'     // Similar in content or purpose
  | 'part-of';       // Component relationship

/**
 * Context parameters for intelligent suggestions
 */
export interface ContextParams {
  entityId?: string;
  entityType?: EntityType;
  parentId?: string;
  componentId?: string;
  hierarchyLevel?: 'epic' | 'feature' | 'story' | 'task';
  workspace_id: string;
  includeRelated?: boolean;
  includePatterns?: boolean;
}

/**
 * Represents a relationship between two entities
 */
export interface Relationship {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationshipType: RelationshipType;
  strength: number; // 0-1 representing relationship strength
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Context intelligence result containing relevant insights
 */
export interface ContextIntelligenceResult {
  parentContext?: {
    id: string;
    title: string;
    description?: string;
    type: string;
    metadata?: Record<string, any>;
  };
  siblingContext?: Array<{
    id: string;
    title: string;
    type: string;
    similarity?: number;
  }>;
  componentContext?: {
    id: string;
    name: string;
    statistics?: {
      storyCount: number;
      averageComplexity?: number;
      commonPatterns?: PatternSummary[];
    };
  };
  suggestedPatterns?: PatternSummary[];
  suggestedFields?: {
    [fieldName: string]: any;
  };
}

/**
 * A detected pattern in story content
 */
export interface DetectedPattern {
  patternType: string;
  patternName: string;
  confidence: number;
  matches: string[];
  suggestedCompletion?: string;
}

/**
 * Summary of a story pattern
 */
export interface PatternSummary {
  id: string;
  name: string;
  type: string;
  frequency: number;
  successRate: number;
}

/**
 * Detailed pattern data
 */
export interface StoryPattern {
  id: string;
  name: string;
  type: string;
  data: any;
  examples: string[];
  frequency: number;
  successRate: number;
  createdAt: string;
}

/**
 * Feedback data collected for learning system
 */
export interface FeedbackData {
  id: string;
  targetId: string;
  targetType: string;
  feedbackType: 'positive' | 'negative' | 'neutral';
  feedbackDetails?: string;
  createdAt: string;
  userId?: string;
}

/**
 * Parameters for generating a dynamic template
 */
export interface TemplateParams {
  templateType: string;
  hierarchyLevel: 'epic' | 'feature' | 'story' | 'task';
  parentId?: string;
  componentId?: string;
  context?: ContextIntelligenceResult;
}

/**
 * Result of dynamic template generation
 */
export interface DynamicTemplateResult {
  template: StoryTemplate;
  suggestedContent: StoryContent;
  alternatives?: StoryTemplate[];
  explanation?: string;
}

/**
 * Props for the ContextFetcher component
 */
export interface ContextFetcherProps<T> {
  entityId: string;
  entityType: EntityType;
  onFetch: (data: T) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

/**
 * Props for the RelationshipGraph component
 */
export interface RelationshipGraphProps<T> {
  nodes: Array<{
    id: string;
    type: EntityType;
    data: T;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: RelationshipType;
    strength?: number;
  }>;
  config?: {
    width: number;
    height: number;
    nodeSize?: number;
    directed?: boolean;
    highlightNodeId?: string;
  };
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (sourceId: string, targetId: string) => void;
}

/**
 * Configuration for building AI prompts
 */
export interface PromptContext {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  hierarchyLevel?: 'epic' | 'feature' | 'story' | 'task';
  componentName?: string;
  parentDetails?: {
    title: string;
    description?: string;
  };
  siblings?: Array<{
    title: string;
    description?: string;
  }>;
  patterns?: DetectedPattern[];
  [key: string]: any;
}

/**
 * Options for AI prompt generation
 */
export interface PromptOptions {
  includePatterns?: boolean;
  includeContext?: boolean;
  includeExamples?: boolean;
  maxSiblings?: number;
  maxExamples?: number;
  format?: 'json' | 'markdown' | 'text';
}

/**
 * Props for the SuggestionPanel component
 */
export interface SuggestionPanelProps<T> {
  suggestions: T[];
  title?: string;
  description?: string;
  onAccept: (suggestion: T) => void;
  onReject: (suggestion: T) => void;
  onSelectAll?: () => void;
  onRejectAll?: () => void;
  loading?: boolean;
  error?: Error | null;
}

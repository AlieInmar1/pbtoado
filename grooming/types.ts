/**
 * Shared type definitions for grooming components
 */

// Sprint Planning Types
export interface SprintPlanningStory {
  id: string;
  title: string;
  description?: string;
  storyPoints?: number;
  complexity?: number;
  riskRating?: number;
  status: string;
  featureId?: string;
}

export interface SprintPlanningData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  stories: SprintPlanningStory[];
}

// Analytics Types
export interface MetricData {
  label: string;
  value: number;
  change?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TeamMetric {
  teamName: string;
  completionRate: number;
  averageDiscussionTime: number;
  velocity: number;
}

// AI Insights Types
export interface AIInsight {
  id: string;
  text: string;
  confidence: number;
  category: string;
  source?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed';
}

export interface Risk {
  id: string;
  text: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface Suggestion {
  id: string;
  text: string;
  category: 'improvement' | 'clarification' | 'alternative' | 'warning';
  confidence: number;
}

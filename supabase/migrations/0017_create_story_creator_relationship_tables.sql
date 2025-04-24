-- Migration for AI Story Creator System: Relationships and Patterns
-- Create tables to support relationship tracking and pattern detection

-- Table for tracking relationships between entities
CREATE TABLE IF NOT EXISTS story_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  strength FLOAT NOT NULL DEFAULT 0.5,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for quick relationship lookups
CREATE INDEX IF NOT EXISTS idx_story_relationships_source ON story_relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_story_relationships_target ON story_relationships(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_story_relationships_type ON story_relationships(relationship_type);

-- Table for storing detected patterns
CREATE TABLE IF NOT EXISTS story_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  examples TEXT[] NOT NULL DEFAULT '{}',
  frequency INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for workplace_id to filter patterns by workspace
CREATE INDEX IF NOT EXISTS idx_story_patterns_workspace ON story_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_story_patterns_type ON story_patterns(pattern_type);

-- Table for tracking pattern usage and feedback
CREATE TABLE IF NOT EXISTS pattern_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES story_patterns(id) ON DELETE CASCADE,
  story_id UUID NOT NULL,
  success BOOLEAN,
  feedback TEXT,
  user_id UUID,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pattern_usage_pattern ON pattern_usage(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_usage_story ON pattern_usage(story_id);
CREATE INDEX IF NOT EXISTS idx_pattern_usage_workspace ON pattern_usage(workspace_id);

-- Table for dynamic templates
CREATE TABLE IF NOT EXISTS dynamic_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  context_rules JSONB,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dynamic_templates_workspace ON dynamic_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_templates_type ON dynamic_templates(template_type);

-- Table for tracking AI suggestions and their acceptance
CREATE TABLE IF NOT EXISTS ai_suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  accepted BOOLEAN,
  confidence FLOAT,
  user_id UUID,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_target ON ai_suggestion_feedback(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_workspace ON ai_suggestion_feedback(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_field ON ai_suggestion_feedback(field_name);

-- Enable Row Level Security
ALTER TABLE story_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace-based access
CREATE POLICY story_relationships_workspace_access ON story_relationships 
  USING (source_id IN (
    SELECT id FROM grooming_stories WHERE workspace_id = auth.uid()
    UNION 
    SELECT id FROM grooming_sessions WHERE workspace_id = auth.uid()
  ) OR target_id IN (
    SELECT id FROM grooming_stories WHERE workspace_id = auth.uid()
    UNION 
    SELECT id FROM grooming_sessions WHERE workspace_id = auth.uid()
  ));

CREATE POLICY story_patterns_workspace_access ON story_patterns 
  USING (workspace_id = auth.uid());

CREATE POLICY pattern_usage_workspace_access ON pattern_usage 
  USING (workspace_id = auth.uid());

CREATE POLICY dynamic_templates_workspace_access ON dynamic_templates 
  USING (workspace_id = auth.uid());

CREATE POLICY ai_suggestion_feedback_workspace_access ON ai_suggestion_feedback 
  USING (workspace_id = auth.uid());

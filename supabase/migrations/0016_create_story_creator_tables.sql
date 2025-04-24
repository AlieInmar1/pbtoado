-- Migration for AI Story/Feature Creator System

-- Story Templates Table
CREATE TABLE IF NOT EXISTS story_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'feature', 'sub-feature', 'bug', etc.
  description TEXT,
  default_content JSONB,
  required_fields JSONB,
  suggested_acceptance_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE
);

-- AI Suggestion History Table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES grooming_stories(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  confidence FLOAT,
  accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Story Creation Patterns Table
CREATE TABLE IF NOT EXISTS story_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  frequency INTEGER DEFAULT 1,
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies for story_templates
CREATE POLICY "Users can view story templates in their workspace"
  ON story_templates FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create story templates in their workspace"
  ON story_templates FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update story templates in their workspace"
  ON story_templates FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete story templates in their workspace"
  ON story_templates FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

-- Create policies for ai_suggestions
CREATE POLICY "Users can view AI suggestions in their workspace"
  ON ai_suggestions FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create AI suggestions in their workspace"
  ON ai_suggestions FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update AI suggestions in their workspace"
  ON ai_suggestions FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

-- Create policies for story_patterns
CREATE POLICY "Users can view story patterns in their workspace"
  ON story_patterns FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create story patterns in their workspace"
  ON story_patterns FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update story patterns in their workspace"
  ON story_patterns FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users
    WHERE user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS story_templates_workspace_id_idx ON story_templates(workspace_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_story_id_idx ON ai_suggestions(story_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_workspace_id_idx ON ai_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS story_patterns_workspace_id_idx ON story_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS story_patterns_team_id_idx ON story_patterns(team_id);

-- Insert default templates
INSERT INTO story_templates (name, type, description, default_content, required_fields, suggested_acceptance_criteria, workspace_id)
VALUES 
(
  'Basic Feature', 
  'feature',
  'A standard feature template with basic fields',
  jsonb_build_object(
    'title', '',
    'description', 'As a [user type], I want to [action] so that [benefit].',
    'acceptance_criteria', jsonb_build_array(
      'Given [context], when [action], then [result].'
    )
  ),
  jsonb_build_array('title', 'description', 'acceptance_criteria'),
  jsonb_build_array(
    'Given I am logged in, when I perform the action, then I should see the result.',
    'Given I have permission, when I access the feature, then I should be able to use it.',
    'Given I am using the feature, when I complete my task, then my changes should be saved.'
  ),
  (SELECT id FROM workspaces LIMIT 1)
),
(
  'Sub-Feature', 
  'sub-feature',
  'A template for sub-features that are part of a larger feature',
  jsonb_build_object(
    'title', '',
    'description', 'As part of [parent feature], this sub-feature will [action] to enable [benefit].',
    'acceptance_criteria', jsonb_build_array(
      'Given [context], when [action], then [result].'
    ),
    'parent_feature_id', null
  ),
  jsonb_build_array('title', 'description', 'acceptance_criteria', 'parent_feature_id'),
  jsonb_build_array(
    'Given the parent feature is implemented, when I use this sub-feature, then it should work correctly.',
    'Given I am using the sub-feature, when I perform a specific action, then I should see the expected result.'
  ),
  (SELECT id FROM workspaces LIMIT 1)
),
(
  'Bug Fix', 
  'bug',
  'A template for bug fixes',
  jsonb_build_object(
    'title', '',
    'description', 'There is an issue where [problem description]. This should be fixed by [proposed solution].',
    'steps_to_reproduce', jsonb_build_array(
      '1. [First step]',
      '2. [Second step]',
      '3. [Third step]'
    ),
    'expected_behavior', '',
    'actual_behavior', '',
    'acceptance_criteria', jsonb_build_array(
      'Given [context], when [action], then [result].'
    )
  ),
  jsonb_build_array('title', 'description', 'steps_to_reproduce', 'expected_behavior', 'actual_behavior', 'acceptance_criteria'),
  jsonb_build_array(
    'Given I follow the steps to reproduce, when I apply the fix, then the issue should no longer occur.',
    'Given the fix is implemented, when I use the feature, then it should work as originally intended.'
  ),
  (SELECT id FROM workspaces LIMIT 1)
);

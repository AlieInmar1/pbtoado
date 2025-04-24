-- Migration file: supabase/migrations/0010_create_grooming_system_tables.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grooming sessions
CREATE TABLE grooming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('product', 'technical', 'refinement')),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  facilitator_id UUID REFERENCES auth.users(id),
  transcript TEXT,
  transcript_uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories (extends productboard_features with grooming-specific data)
CREATE TABLE grooming_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pb_feature_id TEXT REFERENCES productboard_features(id),
  ado_work_item_id INTEGER REFERENCES ado_work_items(id),
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria JSONB DEFAULT '[]'::JSONB,
  level TEXT CHECK (level IN ('epic', 'feature', 'story')),
  status TEXT NOT NULL DEFAULT 'new',
  story_points INTEGER,
  complexity INTEGER,
  business_value INTEGER,
  parent_story_id UUID REFERENCES grooming_stories(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session stories (join table between sessions and stories)
CREATE TABLE session_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'deferred', 'split', 'rejected')),
  discussion_order INTEGER,
  discussion_points JSONB DEFAULT '[]'::JSONB,
  complexity_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, story_id)
);

-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  capacity INTEGER,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  retrospective_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprint stories (join table between sprints and stories)
CREATE TABLE sprint_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  priority INTEGER,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done')),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, story_id)
);

-- Story relationships (for tracking splits, dependencies, etc.)
CREATE TABLE story_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  target_story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent_child', 'split', 'depends_on', 'related_to')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(source_story_id, target_story_id, relationship_type)
);

-- Story history (for tracking changes to stories)
CREATE TABLE story_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES grooming_stories(id) ON DELETE CASCADE,
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('facilitator', 'participant', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- AI analysis results
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  story_id UUID REFERENCES grooming_stories(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::JSONB,
  action_items JSONB DEFAULT '[]'::JSONB,
  decisions JSONB DEFAULT '[]'::JSONB,
  risks JSONB DEFAULT '[]'::JSONB,
  suggestions JSONB DEFAULT '[]'::JSONB,
  sentiment_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB DEFAULT '{}'::JSONB
);

-- Session sprint association
CREATE TABLE session_sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES grooming_sessions(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, sprint_id)
);

-- Create indexes for performance
CREATE INDEX idx_grooming_stories_pb_feature_id ON grooming_stories(pb_feature_id);
CREATE INDEX idx_grooming_stories_ado_work_item_id ON grooming_stories(ado_work_item_id);
CREATE INDEX idx_grooming_stories_parent_id ON grooming_stories(parent_story_id);
CREATE INDEX idx_grooming_stories_workspace_id ON grooming_stories(workspace_id);
CREATE INDEX idx_grooming_stories_level ON grooming_stories(level);
CREATE INDEX idx_grooming_stories_status ON grooming_stories(status);

CREATE INDEX idx_grooming_sessions_workspace_id ON grooming_sessions(workspace_id);
CREATE INDEX idx_grooming_sessions_status ON grooming_sessions(status);
CREATE INDEX idx_grooming_sessions_session_type ON grooming_sessions(session_type);
CREATE INDEX idx_grooming_sessions_date ON grooming_sessions(session_date);

CREATE INDEX idx_session_stories_session_id ON session_stories(session_id);
CREATE INDEX idx_session_stories_story_id ON session_stories(story_id);
CREATE INDEX idx_session_stories_status ON session_stories(status);

CREATE INDEX idx_sprints_workspace_id ON sprints(workspace_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_dates ON sprints(start_date, end_date);

CREATE INDEX idx_sprint_stories_sprint_id ON sprint_stories(sprint_id);
CREATE INDEX idx_sprint_stories_story_id ON sprint_stories(story_id);
CREATE INDEX idx_sprint_stories_priority ON sprint_stories(priority);
CREATE INDEX idx_sprint_stories_status ON sprint_stories(status);

CREATE INDEX idx_story_relationships_source_id ON story_relationships(source_story_id);
CREATE INDEX idx_story_relationships_target_id ON story_relationships(target_story_id);
CREATE INDEX idx_story_relationships_type ON story_relationships(relationship_type);

CREATE INDEX idx_story_history_story_id ON story_history(story_id);
CREATE INDEX idx_story_history_session_id ON story_history(session_id);
CREATE INDEX idx_story_history_changed_at ON story_history(changed_at);

CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);

CREATE INDEX idx_ai_analyses_session_id ON ai_analyses(session_id);
CREATE INDEX idx_ai_analyses_story_id ON ai_analyses(story_id);
CREATE INDEX idx_ai_analyses_sprint_id ON ai_analyses(sprint_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);

CREATE INDEX idx_session_sprints_session_id ON session_sprints(session_id);
CREATE INDEX idx_session_sprints_sprint_id ON session_sprints(sprint_id);

-- Add RLS policies
ALTER TABLE grooming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sprints ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace-based access
CREATE POLICY "Users can view grooming sessions in their workspace" 
  ON grooming_sessions FOR SELECT 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view grooming stories in their workspace" 
  ON grooming_stories FOR SELECT 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view sprints in their workspace" 
  ON sprints FOR SELECT 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

-- Create policies for related tables
CREATE POLICY "Users can view session stories for sessions they can access" 
  ON session_stories FOR SELECT 
  USING (session_id IN (
    SELECT id FROM grooming_sessions 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view sprint stories for sprints they can access" 
  ON sprint_stories FOR SELECT 
  USING (sprint_id IN (
    SELECT id FROM sprints 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view story relationships for stories they can access" 
  ON story_relationships FOR SELECT 
  USING (source_story_id IN (
    SELECT id FROM grooming_stories 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ) OR target_story_id IN (
    SELECT id FROM grooming_stories 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view story history for stories they can access" 
  ON story_history FOR SELECT 
  USING (story_id IN (
    SELECT id FROM grooming_stories 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view session participants for sessions they can access" 
  ON session_participants FOR SELECT 
  USING (session_id IN (
    SELECT id FROM grooming_sessions 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view AI analyses for sessions they can access" 
  ON ai_analyses FOR SELECT 
  USING (
    (session_id IS NULL OR session_id IN (
      SELECT id FROM grooming_sessions 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    )) AND
    (story_id IS NULL OR story_id IN (
      SELECT id FROM grooming_stories 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    )) AND
    (sprint_id IS NULL OR sprint_id IN (
      SELECT id FROM sprints 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_users 
        WHERE user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can view session sprints for sessions they can access" 
  ON session_sprints FOR SELECT 
  USING (session_id IN (
    SELECT id FROM grooming_sessions 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

-- Create insert policies
CREATE POLICY "Users can insert grooming sessions in their workspace" 
  ON grooming_sessions FOR INSERT 
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert grooming stories in their workspace" 
  ON grooming_stories FOR INSERT 
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sprints in their workspace" 
  ON sprints FOR INSERT 
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

-- Create update policies
CREATE POLICY "Users can update grooming sessions in their workspace" 
  ON grooming_sessions FOR UPDATE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update grooming stories in their workspace" 
  ON grooming_stories FOR UPDATE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update sprints in their workspace" 
  ON sprints FOR UPDATE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

-- Create delete policies
CREATE POLICY "Users can delete grooming sessions in their workspace" 
  ON grooming_sessions FOR DELETE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete grooming stories in their workspace" 
  ON grooming_stories FOR DELETE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sprints in their workspace" 
  ON sprints FOR DELETE 
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_users 
    WHERE user_id = auth.uid()
  ));

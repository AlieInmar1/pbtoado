-- Migration file: supabase/migrations/0013_fix_session_stories_relationship.sql
-- Description: Fixes the relationship between session_stories and grooming_stories tables

-- First, check if the foreign key constraint exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'session_stories_story_id_fkey' 
    AND table_name = 'session_stories'
  ) THEN
    ALTER TABLE session_stories DROP CONSTRAINT session_stories_story_id_fkey;
  END IF;
END $$;

-- Now add the correct foreign key constraint
ALTER TABLE session_stories
ADD CONSTRAINT session_stories_story_id_fkey
FOREIGN KEY (story_id) REFERENCES grooming_stories(id)
ON DELETE CASCADE;

-- Add a comment explaining the relationship
COMMENT ON CONSTRAINT session_stories_story_id_fkey ON session_stories IS 
'Foreign key constraint linking session_stories.story_id to grooming_stories.id';

-- Update the RLS policy to ensure proper access
ALTER TABLE session_stories ENABLE ROW LEVEL SECURITY;

-- Recreate the policy for session_stories
DROP POLICY IF EXISTS "Users can view session stories for sessions they can access" ON session_stories;
CREATE POLICY "Users can view session stories for sessions they can access" 
  ON session_stories FOR SELECT 
  USING (session_id IN (
    SELECT id FROM grooming_sessions 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  ));

-- Refresh the schema cache to ensure the relationship is recognized
NOTIFY pgrst, 'reload schema';

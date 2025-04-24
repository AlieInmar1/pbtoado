-- Migration file: supabase/migrations/0011_fix_grooming_stories_foreign_key.sql
-- Description: Fixes the data type mismatch in the foreign key constraint between grooming_stories.pb_feature_id and productboard_features.id

-- Drop the foreign key constraint
ALTER TABLE grooming_stories
DROP CONSTRAINT IF EXISTS grooming_stories_pb_feature_id_fkey;

-- Add a comment explaining the change
COMMENT ON COLUMN grooming_stories.pb_feature_id IS 'ProductBoard feature ID (text format). Foreign key constraint removed due to type mismatch with productboard_features.id';

-- Migration file: supabase/migrations/0012_update_complexity_field_type.sql
-- Description: Updates the complexity field in grooming_stories table to be an integer instead of a string

-- First, convert existing string values to integers
UPDATE grooming_stories
SET complexity = 
  CASE 
    WHEN complexity::text = 'low' THEN 1
    WHEN complexity::text = 'medium' THEN 2
    WHEN complexity::text = 'high' THEN 3
    ELSE NULL
  END;

-- Add a comment explaining the complexity values
COMMENT ON COLUMN grooming_stories.complexity IS 'Story complexity rating (1=low, 2=medium, 3=high)';

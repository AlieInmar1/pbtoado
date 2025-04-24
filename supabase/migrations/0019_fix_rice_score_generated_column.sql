-- Fix the rice_score column to properly be a generated column
-- This addresses the error: "cannot insert a non-DEFAULT value into column rice_score"

-- First, check if the column exists and drop it
ALTER TABLE IF EXISTS stories
DROP COLUMN IF EXISTS rice_score;

-- Add rice_score as a properly generated column
-- This formula calculates RICE score as (Reach * Impact * Confidence) / Effort
-- NULLIF prevents division by zero
ALTER TABLE IF EXISTS stories
ADD COLUMN rice_score NUMERIC GENERATED ALWAYS AS 
  ((reach_score * impact_score * confidence_score) / NULLIF(effort_score, 0)) 
STORED;

-- Add comment to explain this column is auto-calculated
COMMENT ON COLUMN stories.rice_score IS 'Auto-calculated RICE score: (Reach * Impact * Confidence) / Effort';

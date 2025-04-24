-- Migration: 0027_add_rank_tracking_fields.sql
-- Adds board position and rank tracking fields to the pb_ado_enhanced_mappings table

-- Add rank tracking columns
ALTER TABLE pb_ado_enhanced_mappings 
ADD COLUMN IF NOT EXISTS pb_feature_rank INTEGER,
ADD COLUMN IF NOT EXISTS pb_story_within_feature_rank INTEGER,
ADD COLUMN IF NOT EXISTS ado_backlog_rank INTEGER,
ADD COLUMN IF NOT EXISTS pb_board_section VARCHAR(100);

-- Add indexes for faster sorting and filtering by rank
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_feature_rank ON pb_ado_enhanced_mappings(pb_feature_rank);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_story_rank ON pb_ado_enhanced_mappings(pb_story_within_feature_rank);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_board_section ON pb_ado_enhanced_mappings(pb_board_section);

-- Add comments describing how ranks work
COMMENT ON COLUMN pb_ado_enhanced_mappings.pb_feature_rank IS 'Position of feature in the ProductBoard features list (lower numbers = higher priority)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.pb_story_within_feature_rank IS 'Position of story within its parent feature (lower numbers = higher in list)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.ado_backlog_rank IS 'Position in the ADO backlog (used for ordering work items)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.pb_board_section IS 'Board section/column where the item is placed in ProductBoard';

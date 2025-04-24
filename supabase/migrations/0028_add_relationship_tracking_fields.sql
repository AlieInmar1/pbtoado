-- Migration: 0028_add_relationship_tracking_fields.sql
-- Adds relationship tracking and story splitting fields to the pb_ado_enhanced_mappings table

-- Add relationship tracking columns
ALTER TABLE pb_ado_enhanced_mappings 
ADD COLUMN IF NOT EXISTS origin_system VARCHAR(50) DEFAULT 'productboard',
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'story',
ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_story_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS split_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS original_estimate FLOAT,
ADD COLUMN IF NOT EXISTS remaining_estimate FLOAT;

-- Add indexes for faster relationship lookups
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_parent_id ON pb_ado_enhanced_mappings(parent_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_parent_story_id ON pb_ado_enhanced_mappings(parent_story_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_is_split ON pb_ado_enhanced_mappings(is_split);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_item_type ON pb_ado_enhanced_mappings(item_type);

-- Add comments explaining relationship fields
COMMENT ON COLUMN pb_ado_enhanced_mappings.origin_system IS 'Source system where the item originated from (productboard, ado, internal)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.item_type IS 'Type of item (story, feature, bug, task, etc.)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.parent_id IS 'ID of the parent item in the hierarchy';
COMMENT ON COLUMN pb_ado_enhanced_mappings.is_split IS 'Whether this item was created by splitting a larger story';
COMMENT ON COLUMN pb_ado_enhanced_mappings.parent_story_id IS 'ID of the original story if this was created via splitting';
COMMENT ON COLUMN pb_ado_enhanced_mappings.split_status IS 'Status of split items (active, deprecated, replaced)';
COMMENT ON COLUMN pb_ado_enhanced_mappings.original_estimate IS 'Original story point estimate';
COMMENT ON COLUMN pb_ado_enhanced_mappings.remaining_estimate IS 'Remaining story points after splitting';

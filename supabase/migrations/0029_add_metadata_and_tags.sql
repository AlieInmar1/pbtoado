-- Migration: 0029_add_metadata_and_tags.sql
-- Adds flexible metadata and tags fields to the pb_ado_enhanced_mappings table

-- Add JSONB fields for metadata and tags
ALTER TABLE pb_ado_enhanced_mappings 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Add GIN indexes for efficient JSON field querying
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_metadata_gin ON pb_ado_enhanced_mappings USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_tags_gin ON pb_ado_enhanced_mappings USING gin(tags);

-- Add comments to explain the flexible fields
COMMENT ON COLUMN pb_ado_enhanced_mappings.metadata IS 'Flexible JSON field for storing additional metadata that varies by item type';
COMMENT ON COLUMN pb_ado_enhanced_mappings.tags IS 'JSON array of tags associated with the item across both systems';

-- Example queries for metadata and tags (commented out)
/*
-- Query items with a specific tag
SELECT * FROM pb_ado_enhanced_mappings WHERE tags @> '["urgent"]';

-- Query items with specific metadata 
SELECT * FROM pb_ado_enhanced_mappings WHERE metadata @> '{"complexity": "high"}';

-- Update tags for an item
UPDATE pb_ado_enhanced_mappings SET tags = tags || '["high-priority"]'::jsonb WHERE id = 'some-id';
*/

-- Migration: 0026_add_workflow_tracking_fields.sql
-- Adds workflow tracking fields to the pb_ado_enhanced_mappings table

-- Add workflow tracking columns
ALTER TABLE pb_ado_enhanced_mappings 
ADD COLUMN IF NOT EXISTS product_groomed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tech_groomed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS in_sprint BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sprint_rank INTEGER,
ADD COLUMN IF NOT EXISTS product_groomed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tech_groomed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS added_to_sprint_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster filtering of in-sprint items
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_in_sprint ON pb_ado_enhanced_mappings(in_sprint);

-- Add comments to explain the columns
COMMENT ON COLUMN pb_ado_enhanced_mappings.product_groomed IS 'Flag indicating if the item has been groomed by product team';
COMMENT ON COLUMN pb_ado_enhanced_mappings.tech_groomed IS 'Flag indicating if the item has been groomed by technical team';
COMMENT ON COLUMN pb_ado_enhanced_mappings.in_sprint IS 'Flag indicating if the item is currently in a sprint';

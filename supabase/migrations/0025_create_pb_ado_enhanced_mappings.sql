-- Migration: 0025_create_pb_ado_enhanced_mappings.sql
-- Creates the core table for enhanced PB-ADO mappings

-- Main mappings table
CREATE TABLE IF NOT EXISTS pb_ado_enhanced_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core identifiers (basic mapping)
    pb_feature_id VARCHAR(100) NOT NULL,
    ado_work_item_id INTEGER,
    
    -- Status tracking (basic sync state)
    status VARCHAR(50) DEFAULT 'pending',
    sync_eligible BOOLEAN DEFAULT FALSE,
    sync_triggered_at TIMESTAMP WITH TIME ZONE,
    item_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint on PB feature ID
    CONSTRAINT unique_pb_feature_id UNIQUE (pb_feature_id)
);

-- Add initial indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_pb_id ON pb_ado_enhanced_mappings(pb_feature_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_ado_id ON pb_ado_enhanced_mappings(ado_work_item_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_enhanced_mappings_status ON pb_ado_enhanced_mappings(status);

-- Add a comment explaining the table
COMMENT ON TABLE pb_ado_enhanced_mappings IS 'Enhanced mappings between ProductBoard features and Azure DevOps work items with advanced tracking capabilities';

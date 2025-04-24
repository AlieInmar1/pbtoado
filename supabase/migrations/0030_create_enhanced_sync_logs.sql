-- Migration: 0030_create_enhanced_sync_logs.sql
-- Creates a detailed log table for tracking sync operations between ProductBoard and ADO

-- Create sync logs table
CREATE TABLE IF NOT EXISTS pb_ado_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapping_id UUID REFERENCES pb_ado_enhanced_mappings(id),
    operation_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    source_system VARCHAR(50) NOT NULL DEFAULT 'productboard',
    target_system VARCHAR(50) NOT NULL DEFAULT 'ado',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for efficient querying of logs
CREATE INDEX IF NOT EXISTS idx_pb_ado_sync_logs_mapping_id ON pb_ado_sync_logs(mapping_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_sync_logs_status ON pb_ado_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_pb_ado_sync_logs_created_at ON pb_ado_sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pb_ado_sync_logs_operation_type ON pb_ado_sync_logs(operation_type);

-- Create an enumerated type for operation types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_operation_type') THEN
        CREATE TYPE sync_operation_type AS ENUM (
            'create', 
            'update', 
            'link', 
            'status_change', 
            'rank_update', 
            'split', 
            'delete'
        );
    END IF;
END$$;

-- Create an enumerated type for sync status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
        CREATE TYPE sync_status AS ENUM (
            'pending', 
            'in_progress', 
            'completed', 
            'failed', 
            'retrying', 
            'skipped'
        );
    END IF;
END$$;

-- Add comments for documentation
COMMENT ON TABLE pb_ado_sync_logs IS 'Detailed logs of all sync operations between ProductBoard and Azure DevOps';
COMMENT ON COLUMN pb_ado_sync_logs.operation_type IS 'Type of operation (create, update, link, etc.)';
COMMENT ON COLUMN pb_ado_sync_logs.status IS 'Status of the sync operation (pending, completed, failed, etc.)';
COMMENT ON COLUMN pb_ado_sync_logs.request_payload IS 'The request data sent to the target system API';
COMMENT ON COLUMN pb_ado_sync_logs.response_payload IS 'The response received from the target system API';
COMMENT ON COLUMN pb_ado_sync_logs.source_system IS 'System where the change originated';
COMMENT ON COLUMN pb_ado_sync_logs.target_system IS 'System where the change was applied';

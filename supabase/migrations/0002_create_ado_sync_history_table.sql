-- Create a table to track Azure DevOps sync history
CREATE TABLE IF NOT EXISTS ado_sync_history (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    last_sync_time TIMESTAMP WITH TIME ZONE NOT NULL,
    items_synced INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ado_sync_history_entity_type ON ado_sync_history(entity_type);
CREATE INDEX IF NOT EXISTS idx_ado_sync_history_last_sync_time ON ado_sync_history(last_sync_time);

-- Insert initial records for each entity type with a very old timestamp
-- This ensures we have a record to update for each entity type
INSERT INTO ado_sync_history (entity_type, last_sync_time, items_synced, status)
VALUES 
    ('work_items', '2000-01-01T00:00:00Z', 0, 'pending'),
    ('work_item_types', '2000-01-01T00:00:00Z', 0, 'pending'),
    ('area_paths', '2000-01-01T00:00:00Z', 0, 'pending'),
    ('teams', '2000-01-01T00:00:00Z', 0, 'pending')
ON CONFLICT (id) DO NOTHING;

-- Add a comment to the table
COMMENT ON TABLE ado_sync_history IS 'Tracks the last successful sync time for each Azure DevOps entity type';

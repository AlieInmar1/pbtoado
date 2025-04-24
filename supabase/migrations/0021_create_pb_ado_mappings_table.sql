-- Create table to store mappings between ProductBoard features and Azure DevOps work items
CREATE TABLE IF NOT EXISTS pb_ado_mappings (
  id BIGSERIAL PRIMARY KEY,
  productboard_id TEXT NOT NULL UNIQUE,
  ado_work_item_id INTEGER NOT NULL,
  ado_work_item_url TEXT NOT NULL,
  bidirectional_sync BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ NOT NULL,
  sync_status TEXT DEFAULT 'success',
  sync_error TEXT
);

-- Create index on productboard_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_pb_ado_mappings_productboard_id ON pb_ado_mappings(productboard_id);

-- Create index on ado_work_item_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_pb_ado_mappings_ado_work_item_id ON pb_ado_mappings(ado_work_item_id);

-- Add comment to explain table purpose
COMMENT ON TABLE pb_ado_mappings IS 'Stores mappings between ProductBoard features and Azure DevOps work items to track relationships and sync status';

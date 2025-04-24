-- Create table to store logs of automation attempts (both sync and link updates)
CREATE TABLE IF NOT EXISTS pb_ado_automation_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Columns for pb-ado-sync (webhook receiver)
  event_type TEXT,
  pb_item_id TEXT,       -- Changed from INTEGER to TEXT to accommodate different ID formats (feature vs hierarchy)
  pb_item_type TEXT,
  status TEXT,           -- e.g., 'received', 'processing', 'success', 'error', 'ignored'
  details TEXT,          -- General details or error messages from sync
  payload JSONB,         -- Raw payload received

  -- Columns for pb-link-updater (UI automation) - Keep existing ones nullable
  feature_url TEXT,
  ado_work_item_id INTEGER,
  success BOOLEAN,
  message TEXT,          -- Specific success/error message from link update
  execution_time_ms INTEGER,
  browser_version TEXT,
  error_details JSONB    -- Specific error details from link update
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pb_ado_automation_logs_event_type ON pb_ado_automation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_pb_ado_automation_logs_pb_item_id ON pb_ado_automation_logs(pb_item_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_automation_logs_status ON pb_ado_automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_pb_ado_automation_logs_work_item_id ON pb_ado_automation_logs(ado_work_item_id);
CREATE INDEX IF NOT EXISTS idx_pb_ado_automation_logs_success ON pb_ado_automation_logs(success);

-- Add comment to explain table purpose
COMMENT ON TABLE pb_ado_automation_logs IS 'Stores logs for ProductBoard <-> ADO automation, including webhook syncs and UI link updates.';

-- Note: If this table already exists from a previous version of this migration,
-- you might need to manually run ALTER TABLE commands to add the new columns
-- if the CREATE TABLE IF NOT EXISTS doesn't implicitly update it.
-- Example:
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS event_type TEXT;
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS pb_item_id TEXT;
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS pb_item_type TEXT;
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS status TEXT;
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS details TEXT;
-- ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS payload JSONB;
-- ALTER TABLE pb_ado_automation_logs ALTER COLUMN feature_url DROP NOT NULL; -- Make old columns nullable if needed
-- ALTER TABLE pb_ado_automation_logs ALTER COLUMN ado_work_item_id DROP NOT NULL;
-- ALTER TABLE pb_ado_automation_logs ALTER COLUMN success DROP NOT NULL;
-- ALTER TABLE pb_ado_automation_logs ALTER COLUMN success DROP DEFAULT;

-- Migration to add ado_payload column to pb_ado_automation_logs table
-- This column will store the ADO API payload for dry runs and debugging

-- Add ado_payload column to pb_ado_automation_logs table
ALTER TABLE pb_ado_automation_logs ADD COLUMN IF NOT EXISTS ado_payload JSONB;

-- Add dry_run to the valid status values
COMMENT ON COLUMN pb_ado_automation_logs.status IS 'Status of the automation: received, ignored, fetched, fetch_error, mapping_fetch_error, processing_required, skipped_status_check, skipped_no_status, ado_config_error, ado_error, mapping_update_error, ado_created, ado_updated, dry_run';

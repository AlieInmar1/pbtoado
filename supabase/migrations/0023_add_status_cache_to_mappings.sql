-- Add a column to store the last known ProductBoard status for change detection
ALTER TABLE pb_ado_mappings
ADD COLUMN IF NOT EXISTS last_known_pb_status TEXT;

COMMENT ON COLUMN pb_ado_mappings.last_known_pb_status IS 'Stores the name of the ProductBoard status the last time this mapping was processed by the webhook, used for detecting status changes.';

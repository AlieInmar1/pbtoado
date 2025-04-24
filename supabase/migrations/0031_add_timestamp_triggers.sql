-- Migration: 0031_add_timestamp_triggers.sql
-- Creates automatic timestamp update triggers for the pb_ado_enhanced_mappings table

-- Create or replace function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to the pb_ado_enhanced_mappings table
DROP TRIGGER IF EXISTS update_pb_ado_enhanced_mappings_timestamp ON pb_ado_enhanced_mappings;

CREATE TRIGGER update_pb_ado_enhanced_mappings_timestamp
BEFORE UPDATE ON pb_ado_enhanced_mappings
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Add a comment to explain what this trigger does
COMMENT ON FUNCTION update_timestamp() IS 'Function to automatically update the updated_at timestamp on record updates';

-- Create a function to log mapping changes
CREATE OR REPLACE FUNCTION log_mapping_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if meaningful changes were made (excluding updated_at changes)
    IF OLD.status != NEW.status OR 
       OLD.pb_feature_rank != NEW.pb_feature_rank OR 
       OLD.pb_story_within_feature_rank != NEW.pb_story_within_feature_rank OR
       OLD.pb_board_section != NEW.pb_board_section OR
       OLD.ado_work_item_id != NEW.ado_work_item_id OR
       OLD.sync_eligible != NEW.sync_eligible OR
       OLD.is_split != NEW.is_split THEN
       
        INSERT INTO pb_ado_sync_logs (
            mapping_id, 
            operation_type, 
            status, 
            request_payload
        ) VALUES (
            NEW.id, 
            'update',
            'completed',
            jsonb_build_object(
                'previous_state', to_jsonb(OLD),
                'current_state', to_jsonb(NEW),
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE to_jsonb(NEW) ->> key != to_jsonb(OLD) ->> key
                        AND key != 'updated_at'
                )
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic logging
DROP TRIGGER IF EXISTS log_mapping_changes ON pb_ado_enhanced_mappings;

CREATE TRIGGER log_mapping_changes
AFTER UPDATE ON pb_ado_enhanced_mappings
FOR EACH ROW
EXECUTE PROCEDURE log_mapping_change();

-- Add a comment to explain what this trigger does
COMMENT ON FUNCTION log_mapping_change() IS 'Function to automatically log changes to mappings in the sync logs table';

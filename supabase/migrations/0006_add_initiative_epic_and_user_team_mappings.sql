-- Add new columns to hierarchy_mappings table
ALTER TABLE hierarchy_mappings 
ADD COLUMN IF NOT EXISTS initiative_epic_mappings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_team_mappings JSONB DEFAULT '[]'::jsonb;

-- Update existing records to include the new fields with empty arrays
UPDATE hierarchy_mappings
SET 
  initiative_epic_mappings = '[]'::jsonb,
  user_team_mappings = '[]'::jsonb
WHERE 
  initiative_epic_mappings IS NULL OR
  user_team_mappings IS NULL;

-- Add comment to explain the purpose of this migration
COMMENT ON TABLE hierarchy_mappings IS 'Stores mapping configurations for ProductBoard to Azure DevOps hierarchy, including initiative-epic mappings and user-team assignments';

-- Migration: Add mapping_type to area_path_mappings in hierarchy_mappings table
ALTER TABLE hierarchy_mappings 
ADD COLUMN IF NOT EXISTS area_path_mappings_with_type JSONB;

-- Copy existing data with default mapping_type 'epic'
UPDATE hierarchy_mappings
SET area_path_mappings_with_type = (
  SELECT jsonb_agg(
    jsonb_set(
      mapping, 
      '{mapping_type}', 
      '"epic"'
    )
  )
  FROM jsonb_array_elements(area_path_mappings) AS mapping
)
WHERE area_path_mappings IS NOT NULL;

-- Replace old column with new one
ALTER TABLE hierarchy_mappings
DROP COLUMN area_path_mappings;

ALTER TABLE hierarchy_mappings
RENAME COLUMN area_path_mappings_with_type TO area_path_mappings;

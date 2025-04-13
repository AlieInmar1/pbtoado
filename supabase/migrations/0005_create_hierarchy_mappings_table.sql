-- Create hierarchy_mappings table
CREATE TABLE IF NOT EXISTS hierarchy_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  pb_to_ado_mappings JSONB NOT NULL,
  area_path_mappings JSONB NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE hierarchy_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for selecting hierarchy_mappings
CREATE POLICY "Users can view hierarchy_mappings" 
  ON hierarchy_mappings 
  FOR SELECT 
  USING (true);

-- Policy for inserting hierarchy_mappings
CREATE POLICY "Users can insert hierarchy_mappings" 
  ON hierarchy_mappings 
  FOR INSERT 
  WITH CHECK (true);

-- Policy for updating hierarchy_mappings
CREATE POLICY "Users can update hierarchy_mappings" 
  ON hierarchy_mappings 
  FOR UPDATE 
  USING (true);

-- Policy for deleting hierarchy_mappings
CREATE POLICY "Users can delete hierarchy_mappings" 
  ON hierarchy_mappings 
  FOR DELETE 
  USING (true);

-- Insert default mapping
INSERT INTO hierarchy_mappings (
  name, 
  description, 
  pb_to_ado_mappings, 
  area_path_mappings
) VALUES (
  'Default Mapping',
  'Default mapping configuration for ProductBoard to Azure DevOps',
  '[
    {
      "pb_level": "initiative",
      "ado_type": "Epic",
      "description": "Map ProductBoard Initiatives to Azure DevOps Epics"
    },
    {
      "pb_level": "feature",
      "ado_type": "Feature",
      "description": "Map ProductBoard Features to Azure DevOps Features"
    },
    {
      "pb_level": "subfeature",
      "ado_type": "User Story",
      "description": "Map ProductBoard Sub-features (Stories) to Azure DevOps User Stories"
    }
  ]',
  '[
    {
      "business_unit": "Healthcare",
      "product_code": "Platform",
      "team": "Skunkworks",
      "area_path": "Healthcare\\Teams\\Skunkworks",
      "description": "Map Healthcare Platform Skunkworks team items"
    }
  ]'
);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_hierarchy_mappings_updated_at
BEFORE UPDATE ON hierarchy_mappings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

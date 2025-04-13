-- Migration: 0007_create_productboard_components_table.sql
-- Description: Creates a table for ProductBoard components and updates hierarchy_mappings table

-- Create the productboard_components table
CREATE TABLE IF NOT EXISTS productboard_components (
  id SERIAL PRIMARY KEY,
  productboard_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  business_unit TEXT,
  product_code TEXT,
  workspace_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON TABLE public.productboard_components IS 'Stores ProductBoard components for mapping to ADO products';
COMMENT ON COLUMN public.productboard_components.productboard_id IS 'ProductBoard ID of the component';
COMMENT ON COLUMN public.productboard_components.parent_id IS 'ProductBoard ID of the parent component (if any)';
COMMENT ON COLUMN public.productboard_components.business_unit IS 'Business unit associated with the component';
COMMENT ON COLUMN public.productboard_components.product_code IS 'Product code associated with the component';
COMMENT ON COLUMN public.productboard_components.metadata IS 'Full JSON response from ProductBoard API for this component';

-- Add recommended indexes
CREATE INDEX IF NOT EXISTS idx_productboard_components_productboard_id ON public.productboard_components(productboard_id);
CREATE INDEX IF NOT EXISTS idx_productboard_components_parent_id ON public.productboard_components(parent_id);
CREATE INDEX IF NOT EXISTS idx_productboard_components_business_unit ON public.productboard_components(business_unit);
CREATE INDEX IF NOT EXISTS idx_productboard_components_product_code ON public.productboard_components(product_code);

-- Enable RLS for productboard_components
ALTER TABLE public.productboard_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.productboard_components FOR SELECT TO authenticated USING (true);

-- Add component_product_mappings field to hierarchy_mappings table
ALTER TABLE public.hierarchy_mappings 
ADD COLUMN IF NOT EXISTS component_product_mappings JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.hierarchy_mappings.component_product_mappings IS 'Mappings between ProductBoard components and ADO products';

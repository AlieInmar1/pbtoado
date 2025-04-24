-- Migration: Add ProductBoard fields to stories table
-- This migration adds all fields necessary for ProductBoard integration

-- Check if the stories table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stories') THEN
    CREATE TABLE stories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add RICE scoring fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reach_score INT DEFAULT 1;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS impact_score INT DEFAULT 1;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS confidence_score INT DEFAULT 5;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS effort_score INT DEFAULT 5;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS os_compatibility INT DEFAULT 2;

-- Add calculated RICE score field
-- Note: Using a GENERATED ALWAYS AS expression to automatically calculate the RICE score
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'rice_score') THEN
    ALTER TABLE stories ADD COLUMN rice_score FLOAT GENERATED ALWAYS AS (
      (reach_score * impact_score * confidence_score * (0.8 + ((os_compatibility - 1) * 0.2))) / GREATEST(effort_score, 1)
    ) STORED;
  END IF;
END $$;

-- Add additional scoring and metadata fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS customer_importance_score INT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS timeframe DATE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS health VARCHAR(50);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS teams JSONB DEFAULT '[]'::jsonb;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add checkbox and selection fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS commercialization_needed BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS commitment_status VARCHAR(50);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS growth_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS investment_category VARCHAR(100);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS product_leader_approval VARCHAR(50);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tentpole BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS t_shirt_sizing VARCHAR(10);

-- Add multi-select fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS product_line JSONB DEFAULT '[]'::jsonb;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;

-- Add number fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS board_level_stack_rank INT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS engineering_assigned_story_points INT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS matching_id VARCHAR(100);

-- Add text fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS customer_need_description TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS release_notes TEXT;

-- Add ProductBoard specific fields
ALTER TABLE stories ADD COLUMN IF NOT EXISTS productboard_id VARCHAR(100);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create index on ProductBoard ID for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stories_productboard_id ON stories(productboard_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stories_updated_at ON stories;
CREATE TRIGGER trigger_stories_updated_at
BEFORE UPDATE ON stories
FOR EACH ROW
EXECUTE FUNCTION update_stories_updated_at();

-- Add comment to document the table purpose
COMMENT ON TABLE stories IS 'Stories with ProductBoard field integration';

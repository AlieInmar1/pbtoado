-- Migration file: Add decisions and questions columns to session_stories table

-- Add decisions and questions columns to session_stories table
ALTER TABLE session_stories ADD COLUMN decisions JSONB DEFAULT '[]'::JSONB;
ALTER TABLE session_stories ADD COLUMN questions JSONB DEFAULT '[]'::JSONB;

-- Add comments to explain the purpose of the columns
COMMENT ON COLUMN session_stories.decisions IS 'Decisions made during the grooming session for this story';
COMMENT ON COLUMN session_stories.questions IS 'Questions raised during the grooming session for this story';

-- Refresh the schema cache to ensure the new columns are recognized
SELECT pg_catalog.pg_namespace.nspname as schema, pg_catalog.pg_class.relname as table
FROM pg_catalog.pg_class
JOIN pg_catalog.pg_namespace ON pg_catalog.pg_class.relnamespace = pg_catalog.pg_namespace.oid
WHERE pg_catalog.pg_namespace.nspname = 'public'
AND pg_catalog.pg_class.relname = 'session_stories';

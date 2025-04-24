-- Migration file: supabase/migrations/0014_add_discussion_notes_to_session_stories.sql

-- Add discussion_notes column to session_stories table
ALTER TABLE session_stories ADD COLUMN discussion_notes TEXT;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN session_stories.discussion_notes IS 'Notes about the discussion, including order information';

-- Refresh the schema cache to ensure the new column is recognized
SELECT pg_catalog.pg_namespace.nspname as schema, pg_catalog.pg_class.relname as table
FROM pg_catalog.pg_class
JOIN pg_catalog.pg_namespace ON pg_catalog.pg_class.relnamespace = pg_catalog.pg_namespace.oid
WHERE pg_catalog.pg_namespace.nspname = 'public'
AND pg_catalog.pg_class.relname = 'session_stories';

-- Migration: 0001_create_ado_cache_tables.sql
-- Description: Creates tables to cache Azure DevOps data.

-- Enable Row Level Security (RLS) by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public, anon, authenticated;

-- ado_work_items Table: Stores individual work items
CREATE TABLE public.ado_work_items (
    id bigint NOT NULL PRIMARY KEY,
    url text,
    rev integer,
    type text NOT NULL,
    title text NOT NULL,
    state text NOT NULL,
    reason text,
    area_path text,
    iteration_path text,
    priority integer,
    value_area text,
    tags text, -- Consider text[] if using array functions frequently
    description text,
    assigned_to_name text,
    assigned_to_email text,
    created_by_name text,
    created_by_email text,
    created_date timestamp with time zone,
    changed_by_name text,
    changed_by_email text,
    changed_date timestamp with time zone,
    parent_id bigint REFERENCES public.ado_work_items(id) ON DELETE SET NULL, -- Foreign key to self for parent relationship
    raw_data jsonb,
    last_synced_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.ado_work_items IS 'Stores cached Azure DevOps work items (Epics, Features, User Stories, etc.).';
COMMENT ON COLUMN public.ado_work_items.id IS 'Azure DevOps Work Item ID (Primary Key).';
COMMENT ON COLUMN public.ado_work_items.rev IS 'Revision number from ADO, used for sync comparison.';
COMMENT ON COLUMN public.ado_work_items.type IS 'Work Item Type (e.g., User Story, Feature, Epic).';
COMMENT ON COLUMN public.ado_work_items.tags IS 'Semicolon-separated tags from ADO.';
COMMENT ON COLUMN public.ado_work_items.parent_id IS 'ADO Parent Work Item ID, references this table.';
COMMENT ON COLUMN public.ado_work_items.raw_data IS 'Full JSON response from ADO API for this item.';
COMMENT ON COLUMN public.ado_work_items.last_synced_at IS 'Timestamp of the last successful sync for this record.';

-- Add recommended indexes
CREATE INDEX idx_ado_work_items_type ON public.ado_work_items(type);
CREATE INDEX idx_ado_work_items_area_path ON public.ado_work_items(area_path);
CREATE INDEX idx_ado_work_items_state ON public.ado_work_items(state);
CREATE INDEX idx_ado_work_items_parent_id ON public.ado_work_items(parent_id);
CREATE INDEX idx_ado_work_items_changed_date ON public.ado_work_items(changed_date);

-- Enable RLS for ado_work_items
ALTER TABLE public.ado_work_items ENABLE ROW LEVEL SECURITY;
-- Define RLS policies (Example: Allow authenticated users to read)
CREATE POLICY "Allow authenticated read access" ON public.ado_work_items FOR SELECT TO authenticated USING (true);
-- Add policies for insert/update/delete as needed, likely restricted to service_role for sync function


-- ado_work_item_relations Table: Stores relationships between work items
CREATE TABLE public.ado_work_item_relations (
    source_work_item_id bigint NOT NULL REFERENCES public.ado_work_items(id) ON DELETE CASCADE,
    target_work_item_id bigint, -- Target might not be in ado_work_items if it's outside the synced scope
    target_url text NOT NULL,
    rel_type text NOT NULL,
    attributes jsonb,
    PRIMARY KEY (source_work_item_id, target_url, rel_type) -- Composite primary key
);

-- Add comments
COMMENT ON TABLE public.ado_work_item_relations IS 'Stores relationships between Azure DevOps work items.';
COMMENT ON COLUMN public.ado_work_item_relations.source_work_item_id IS 'Source Work Item ID (Foreign Key to ado_work_items).';
COMMENT ON COLUMN public.ado_work_item_relations.target_work_item_id IS 'Target Work Item ID (extracted from URL, may not exist in ado_work_items).';
COMMENT ON COLUMN public.ado_work_item_relations.target_url IS 'Full URL of the target work item or resource.';
COMMENT ON COLUMN public.ado_work_item_relations.rel_type IS 'Type of relationship (e.g., System.LinkTypes.Hierarchy-Reverse).';
COMMENT ON COLUMN public.ado_work_item_relations.attributes IS 'Attributes of the relationship (e.g., name, comment).';

-- Add recommended indexes
CREATE INDEX idx_ado_relations_target_id ON public.ado_work_item_relations(target_work_item_id);
CREATE INDEX idx_ado_relations_rel_type ON public.ado_work_item_relations(rel_type);

-- Enable RLS for ado_work_item_relations
ALTER TABLE public.ado_work_item_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.ado_work_item_relations FOR SELECT TO authenticated USING (true);


-- ado_area_paths Table: Stores ADO Area Paths
CREATE TABLE public.ado_area_paths (
    id bigint NOT NULL PRIMARY KEY,
    name text NOT NULL,
    path text NOT NULL UNIQUE, -- Path should be unique
    structure_type text DEFAULT 'area'::text NOT NULL,
    has_children boolean DEFAULT false,
    raw_data jsonb,
    last_synced_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.ado_area_paths IS 'Stores cached Azure DevOps Area Paths (Classification Nodes).';
COMMENT ON COLUMN public.ado_area_paths.id IS 'ADO Classification Node ID (Primary Key).';
COMMENT ON COLUMN public.ado_area_paths.path IS 'Full area path string (e.g., Project\\Area\\SubArea).';

-- Add recommended indexes
CREATE INDEX idx_ado_area_paths_path ON public.ado_area_paths(path);

-- Enable RLS for ado_area_paths
ALTER TABLE public.ado_area_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.ado_area_paths FOR SELECT TO authenticated USING (true);


-- ado_teams Table: Stores ADO Teams
CREATE TABLE public.ado_teams (
    id uuid NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    url text,
    identity_url text,
    project_name text,
    project_id uuid,
    raw_data jsonb,
    last_synced_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.ado_teams IS 'Stores cached Azure DevOps Teams.';
COMMENT ON COLUMN public.ado_teams.id IS 'ADO Team ID (Primary Key).';

-- Add recommended indexes
CREATE INDEX idx_ado_teams_name ON public.ado_teams(name);

-- Enable RLS for ado_teams
ALTER TABLE public.ado_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.ado_teams FOR SELECT TO authenticated USING (true);


-- ado_work_item_types Table: Stores ADO Work Item Types
CREATE TABLE public.ado_work_item_types (
    name text NOT NULL PRIMARY KEY,
    description text,
    reference_name text,
    url text,
    color text,
    icon_url text,
    is_disabled boolean DEFAULT false,
    raw_data jsonb,
    last_synced_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.ado_work_item_types IS 'Stores cached Azure DevOps Work Item Types.';
COMMENT ON COLUMN public.ado_work_item_types.name IS 'Work Item Type Name (Primary Key).';

-- Enable RLS for ado_work_item_types
ALTER TABLE public.ado_work_item_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.ado_work_item_types FOR SELECT TO authenticated USING (true);

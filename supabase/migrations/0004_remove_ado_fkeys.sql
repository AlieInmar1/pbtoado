-- Migration: 0004_remove_ado_fkeys.sql
-- Description: Temporarily removes foreign key constraints from ADO tables to allow sync completion.
-- TODO: Reinstate these constraints after fixing the sync order-of-operations logic.

-- Remove foreign key constraint for parent_id in ado_work_items
ALTER TABLE public.ado_work_items
DROP CONSTRAINT IF EXISTS ado_work_items_parent_id_fkey;

-- Remove foreign key constraints for source_work_item_id in ado_work_item_relations
ALTER TABLE public.ado_work_item_relations
DROP CONSTRAINT IF EXISTS ado_work_item_relations_source_work_item_id_fkey;

-- Remove foreign key constraints for target_work_item_id in ado_work_item_relations
ALTER TABLE public.ado_work_item_relations
DROP CONSTRAINT IF EXISTS ado_work_item_relations_target_work_item_id_fkey;

COMMENT ON TABLE public.ado_work_items IS 'Foreign key constraint on parent_id temporarily removed (See migration 0004).';
COMMENT ON TABLE public.ado_work_item_relations IS 'Foreign key constraints on source_work_item_id and target_work_item_id temporarily removed (See migration 0004).';

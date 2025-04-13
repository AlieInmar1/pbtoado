-- Migration: 0003_enhance_ado_cache_tables.sql
-- Description: Adds additional columns to ADO cache tables for more comprehensive data storage

-- Add new columns to ado_work_items table
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS history text;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS acceptance_criteria text;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS board_column text;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS board_column_done boolean;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS comment_count integer;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS productboard_id text;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS area_id bigint;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS iteration_id bigint;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS watermark bigint;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS stack_rank double precision;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS effort double precision;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS story_points double precision;
ALTER TABLE public.ado_work_items ADD COLUMN IF NOT EXISTS business_value integer;

-- Add comments for clarity
COMMENT ON COLUMN public.ado_work_items.history IS 'System.History field from ADO, contains change history in HTML format';
COMMENT ON COLUMN public.ado_work_items.acceptance_criteria IS 'Microsoft.VSTS.Common.AcceptanceCriteria field from ADO';
COMMENT ON COLUMN public.ado_work_items.board_column IS 'System.BoardColumn field from ADO';
COMMENT ON COLUMN public.ado_work_items.board_column_done IS 'System.BoardColumnDone field from ADO';
COMMENT ON COLUMN public.ado_work_items.comment_count IS 'System.CommentCount field from ADO';
COMMENT ON COLUMN public.ado_work_items.productboard_id IS 'Extracted Productboard ID from Hyperlink relations';
COMMENT ON COLUMN public.ado_work_items.area_id IS 'System.AreaId field from ADO';
COMMENT ON COLUMN public.ado_work_items.iteration_id IS 'System.IterationId field from ADO';
COMMENT ON COLUMN public.ado_work_items.watermark IS 'System.Watermark field from ADO';
COMMENT ON COLUMN public.ado_work_items.stack_rank IS 'Microsoft.VSTS.Common.StackRank field from ADO';
COMMENT ON COLUMN public.ado_work_items.effort IS 'Microsoft.VSTS.Scheduling.Effort field from ADO';
COMMENT ON COLUMN public.ado_work_items.story_points IS 'Microsoft.VSTS.Scheduling.StoryPoints field from ADO';
COMMENT ON COLUMN public.ado_work_items.business_value IS 'Microsoft.VSTS.Common.BusinessValue field from ADO';

-- Add recommended indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ado_work_items_area_id ON public.ado_work_items(area_id);
CREATE INDEX IF NOT EXISTS idx_ado_work_items_iteration_id ON public.ado_work_items(iteration_id);
CREATE INDEX IF NOT EXISTS idx_ado_work_items_productboard_id ON public.ado_work_items(productboard_id);

-- Enhance the ado_work_item_relations table
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS is_parent boolean;
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS is_child boolean;
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS is_related boolean;
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS is_hyperlink boolean;
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS is_productboard_link boolean;
ALTER TABLE public.ado_work_item_relations ADD COLUMN IF NOT EXISTS productboard_id text;

-- Add comments for clarity
COMMENT ON COLUMN public.ado_work_item_relations.is_parent IS 'True if this is a parent relationship (System.LinkTypes.Hierarchy-Reverse)';
COMMENT ON COLUMN public.ado_work_item_relations.is_child IS 'True if this is a child relationship (System.LinkTypes.Hierarchy-Forward)';
COMMENT ON COLUMN public.ado_work_item_relations.is_related IS 'True if this is a related relationship (System.LinkTypes.Related)';
COMMENT ON COLUMN public.ado_work_item_relations.is_hyperlink IS 'True if this is a hyperlink relationship';
COMMENT ON COLUMN public.ado_work_item_relations.is_productboard_link IS 'True if this is a hyperlink to Productboard';
COMMENT ON COLUMN public.ado_work_item_relations.productboard_id IS 'Extracted Productboard ID from the URL';

-- Add recommended indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ado_relations_is_parent ON public.ado_work_item_relations(is_parent) WHERE is_parent = true;
CREATE INDEX IF NOT EXISTS idx_ado_relations_is_productboard_link ON public.ado_work_item_relations(is_productboard_link) WHERE is_productboard_link = true;
CREATE INDEX IF NOT EXISTS idx_ado_relations_productboard_id ON public.ado_work_item_relations(productboard_id) WHERE productboard_id IS NOT NULL;

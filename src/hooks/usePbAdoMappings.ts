import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  PBAdoEnhancedMapping,
  PBAdoSyncLog, 
  StorySplitOperation 
} from '../types/pb-ado-mappings';

/**
 * Custom hook for working with ProductBoard-ADO mappings
 */
export function usePbAdoMappings() {
  const queryClient = useQueryClient();

  // Fetch all mappings
  const getMappings = async (): Promise<PBAdoEnhancedMapping[]> => {
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .select('*');
    
    if (error) throw new Error(`Error fetching mappings: ${error.message}`);
    return data || [];
  };

  // Fetch a single mapping by ID
  const getMappingById = async (id: string): Promise<PBAdoEnhancedMapping | null> => {
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Error fetching mapping: ${error.message}`);
    }
    return data;
  };

  // Fetch mapping by ProductBoard feature ID
  const getMappingByPbId = async (pbFeatureId: string): Promise<PBAdoEnhancedMapping | null> => {
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .select('*')
      .eq('pb_feature_id', pbFeatureId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching mapping by PB ID: ${error.message}`);
    }
    return data;
  };

  // Fetch mapping by ADO work item ID
  const getMappingByAdoId = async (adoWorkItemId: number): Promise<PBAdoEnhancedMapping | null> => {
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .select('*')
      .eq('ado_work_item_id', adoWorkItemId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching mapping by ADO ID: ${error.message}`);
    }
    return data;
  };

  // Create or update a mapping
  const upsertMapping = async (mapping: Partial<PBAdoEnhancedMapping>): Promise<PBAdoEnhancedMapping> => {
    // If ID exists, update; otherwise insert
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .upsert(mapping)
      .select()
      .single();
    
    if (error) throw new Error(`Error saving mapping: ${error.message}`);
    return data;
  };

  // Delete a mapping
  const deleteMapping = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Error deleting mapping: ${error.message}`);
  };

  // Update mapping status
  const updateMappingStatus = async ({ 
    id, 
    status, 
    errorMessage = null 
  }: { 
    id: string; 
    status: 'pending' | 'synced' | 'error' | 'syncing'; 
    errorMessage?: string | null;
  }): Promise<PBAdoEnhancedMapping> => {
    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .update({ 
        status,
        ...(errorMessage && { metadata: { error: errorMessage } })
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Error updating mapping status: ${error.message}`);
    return data;
  };

  // Update mapping ranks
  const updateMappingRank = async ({
    id,
    featureRank,
    storyRank,
    boardSection
  }: {
    id: string;
    featureRank?: number;
    storyRank?: number;
    boardSection?: string;
  }): Promise<PBAdoEnhancedMapping> => {
    // Build update object with only provided values
    const updateData: Partial<PBAdoEnhancedMapping> = {};
    if (featureRank !== undefined) updateData.pb_feature_rank = featureRank;
    if (storyRank !== undefined) updateData.pb_story_within_feature_rank = storyRank;
    if (boardSection !== undefined) updateData.pb_board_section = boardSection;

    const { data, error } = await supabase
      .from('pb_ado_enhanced_mappings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Error updating mapping ranks: ${error.message}`);
    return data;
  };

  // Get sync logs for a mapping
  const getSyncLogs = async (mappingId: string): Promise<PBAdoSyncLog[]> => {
    const { data, error } = await supabase
      .from('pb_ado_sync_logs')
      .select('*')
      .eq('mapping_id', mappingId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Error fetching sync logs: ${error.message}`);
    return data || [];
  };

  // Split story operation - handles complex split operation logic
  const splitStory = async (operation: StorySplitOperation): Promise<PBAdoEnhancedMapping[]> => {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would:
    // 1. Get the original story mapping
    // 2. Create new mappings for each new story
    // 3. Update the original story status if needed
    // 4. Log the split operation in the sync logs
    
    // For now, we'll simulate this with a direct call to a stored procedure
    const { data, error } = await supabase.rpc(
      'split_story',
      { 
        original_story_id: operation.original_story_id,
        new_stories: JSON.stringify(operation.new_stories),
        remaining_points: operation.remaining_points,
        mark_original_as: operation.mark_original_as || 'unchanged'
      }
    );
    
    if (error) throw new Error(`Error splitting story: ${error.message}`);
    return data || [];
  };

  // React Query hooks

  const useAllMappings = () => 
    useQuery(['pb-ado-mappings'], () => getMappings());

  const useMappingById = (id: string) => 
    useQuery(['pb-ado-mapping', id], () => getMappingById(id), {
      enabled: !!id // Only run query if id is provided
    });

  const useMappingByPbId = (pbFeatureId: string) => 
    useQuery(['pb-ado-mapping-pb', pbFeatureId], () => getMappingByPbId(pbFeatureId), {
      enabled: !!pbFeatureId
    });

  const useMappingByAdoId = (adoWorkItemId: number) => 
    useQuery(['pb-ado-mapping-ado', adoWorkItemId], () => getMappingByAdoId(adoWorkItemId), {
      enabled: !!adoWorkItemId
    });

  const useSyncLogs = (mappingId: string) => 
    useQuery(['pb-ado-sync-logs', mappingId], () => getSyncLogs(mappingId), {
      enabled: !!mappingId
    });

  // Mutations

  const useUpsertMapping = () => 
    useMutation(upsertMapping, {
      onSuccess: () => {
        queryClient.invalidateQueries(['pb-ado-mappings']);
      }
    });

  const useDeleteMapping = () => 
    useMutation(deleteMapping, {
      onSuccess: () => {
        queryClient.invalidateQueries(['pb-ado-mappings']);
      }
    });

  const useUpdateMappingStatus = () => 
    useMutation(updateMappingStatus, {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['pb-ado-mappings']);
        queryClient.invalidateQueries(['pb-ado-mapping', data.id]);
        queryClient.invalidateQueries(['pb-ado-mapping-pb', data.pb_feature_id]);
        if (data.ado_work_item_id) {
          queryClient.invalidateQueries(['pb-ado-mapping-ado', data.ado_work_item_id]);
        }
      }
    });

  const useUpdateMappingRank = () => 
    useMutation(updateMappingRank, {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['pb-ado-mappings']);
        queryClient.invalidateQueries(['pb-ado-mapping', data.id]);
      }
    });

  const useSplitStory = () => 
    useMutation(splitStory, {
      onSuccess: () => {
        queryClient.invalidateQueries(['pb-ado-mappings']);
      }
    });

  return {
    // Direct data access functions
    getMappings,
    getMappingById,
    getMappingByPbId,
    getMappingByAdoId,
    upsertMapping,
    deleteMapping,
    updateMappingStatus,
    updateMappingRank,
    getSyncLogs,
    splitStory,
    
    // React Query hooks
    useAllMappings,
    useMappingById,
    useMappingByPbId,
    useMappingByAdoId,
    useSyncLogs,
    
    // Mutation hooks
    useUpsertMapping,
    useDeleteMapping,
    useUpdateMappingStatus,
    useUpdateMappingRank,
    useSplitStory
  };
}

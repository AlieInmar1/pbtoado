import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchHierarchyMappings, 
  saveHierarchyMapping, 
  HierarchyMappingConfig, 
  DEFAULT_HIERARCHY_MAPPING 
} from '../lib/api/hierarchyMapping';

/**
 * Custom hook for fetching and managing hierarchy mappings
 * @returns Object with hierarchy mappings data and mutation functions
 */
export function useHierarchyMappings() {
  const queryClient = useQueryClient();
  
  // Query to fetch hierarchy mappings
  const mappingsQuery = useQuery<HierarchyMappingConfig[]>({
    queryKey: ['hierarchy-mappings'],
    queryFn: fetchHierarchyMappings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: [DEFAULT_HIERARCHY_MAPPING], // Use default mapping as initial data
  });
  
  // Mutation to save a hierarchy mapping
  const saveMappingMutation = useMutation({
    mutationFn: saveHierarchyMapping,
    onSuccess: () => {
      // Invalidate and refetch mappings query when save is successful
      queryClient.invalidateQueries({ queryKey: ['hierarchy-mappings'] });
    },
  });
  
  return {
    mappings: mappingsQuery.data || [DEFAULT_HIERARCHY_MAPPING],
    isLoading: mappingsQuery.isLoading,
    isError: mappingsQuery.isError,
    error: mappingsQuery.error,
    refetch: mappingsQuery.refetch,
    saveMapping: saveMappingMutation.mutate,
    isSaving: saveMappingMutation.isPending,
    saveError: saveMappingMutation.error,
  };
}

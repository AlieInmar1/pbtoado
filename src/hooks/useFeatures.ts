import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchFeatures, syncProductBoardData, Feature } from '../lib/api/features';

/**
 * Custom hook for fetching and managing ProductBoard features
 * @returns Object with features data and mutation functions
 */
export function useFeatures() {
  // Query to fetch features
  const featuresQuery = useQuery<Feature[]>({
    queryKey: ['features'],
    queryFn: fetchFeatures,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation to trigger sync
  const syncMutation = useMutation({
    mutationFn: syncProductBoardData,
    onSuccess: () => {
      // Invalidate and refetch features query when sync is successful
      featuresQuery.refetch();
    },
  });
  
  return {
    features: featuresQuery.data || [],
    isLoading: featuresQuery.isLoading,
    isError: featuresQuery.isError,
    error: featuresQuery.error,
    refetch: featuresQuery.refetch,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
}

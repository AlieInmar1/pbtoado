import { useQuery } from '@tanstack/react-query';
import { fetchWorkItems, testConnection, getWorkItemTypes } from '../lib/api/azureDevOpsWithCacheProxy';

// Default values (we'll replace these with environment variables or settings from Supabase)
const DEFAULT_ORG = 'inmar';
const DEFAULT_PROJECT = 'Healthcare'; // Corrected casing
const DEFAULT_API_KEY = 'Aq2nR947X8QPHE5vCMT8RtdsGUudZtm41CLvITcJsb7dY3isf8loJQQJ99BDACAAAAAQLZitAAASAZDO1Jt4';

// Accept workItemId as an optional parameter, default to 227432 for now
export function useAzureDevOps(workItemId: number = 227432) { 
  // Query to test connection
  const connectionQuery = useQuery({
    queryKey: ['ado-connection'],
    queryFn: () => testConnection(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch the specified work item
  const workItemsQuery = useQuery({
    queryKey: ['ado-work-item', workItemId], // Include workItemId in the queryKey
    queryFn: () => fetchWorkItems(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY, [workItemId]), // Pass ID array
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: connectionQuery.data === true && !!workItemId, // Only run if connected and ID is provided
  });
  
  // Query to fetch work item types
  const workItemTypesQuery = useQuery({
    queryKey: ['ado-work-item-types'],
    queryFn: () => getWorkItemTypes(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: connectionQuery.data === true, // Only run if connection test passes
  });
  
  return {
    isConnected: connectionQuery.data === true,
    isConnectionLoading: connectionQuery.isLoading,
    connectionError: connectionQuery.error,
    
    workItems: workItemsQuery.data || [],
    isWorkItemsLoading: workItemsQuery.isLoading,
    workItemsError: workItemsQuery.error,
    
    workItemTypes: workItemTypesQuery.data || [],
    isWorkItemTypesLoading: workItemTypesQuery.isLoading,
    workItemTypesError: workItemTypesQuery.error,
    
    refetchWorkItems: workItemsQuery.refetch,
  };
}

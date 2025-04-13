import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getWorkItemsWithHierarchy, 
  getAreaPaths, 
  getTeams, 
  getTeamAreaPaths,
  getWorkItemTypes,
  syncAllData
} from '../lib/api/azureDevOpsWithCacheProxy';

// Default values (we'll replace these with environment variables or settings from Supabase)
const DEFAULT_ORG = 'inmar';
const DEFAULT_PROJECT = 'Healthcare'; // Corrected casing
const DEFAULT_API_KEY = 'Aq2nR947X8QPHE5vCMT8RtdsGUudZtm41CLvITcJsb7dY3isf8loJQQJ99BDACAAAAAQLZitAAASAZDO1Jt4';

export function useAzureDevOpsHierarchy() {
  // State for storing team area paths mapping
  const [teamAreaPathsMap, setTeamAreaPathsMap] = useState<Record<string, string[]>>({});
  
  // Query to fetch work items with hierarchy
  const hierarchyQuery = useQuery({
    queryKey: ['ado-hierarchy'],
    queryFn: () => getWorkItemsWithHierarchy(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch area paths
  const areaPathsQuery = useQuery({
    queryKey: ['ado-area-paths'],
    queryFn: () => getAreaPaths(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch teams
  const teamsQuery = useQuery({
    queryKey: ['ado-teams'],
    queryFn: () => getTeams(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Query to fetch work item types
  const workItemTypesQuery = useQuery({
    queryKey: ['ado-work-item-types'],
    queryFn: () => getWorkItemTypes(DEFAULT_ORG, DEFAULT_PROJECT, DEFAULT_API_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch team area paths when teams are loaded
  useQuery({
    queryKey: ['ado-team-area-paths', teamsQuery.data],
    queryFn: async () => {
      if (!teamsQuery.data) return null;
      
      const teamAreaPaths: Record<string, string[]> = {};
      
      for (const team of teamsQuery.data) {
        try {
          const areaPaths = await getTeamAreaPaths(DEFAULT_ORG, DEFAULT_PROJECT, team.name, DEFAULT_API_KEY);
          teamAreaPaths[team.name] = areaPaths;
        } catch (error) {
          console.error(`Error fetching area paths for team ${team.name}:`, error);
        }
      }
      
      setTeamAreaPathsMap(teamAreaPaths);
      return teamAreaPaths;
    },
    enabled: !!teamsQuery.data && teamsQuery.data.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Determine if all data is loading
  const isLoading = 
    hierarchyQuery.isLoading || 
    areaPathsQuery.isLoading || 
    teamsQuery.isLoading ||
    workItemTypesQuery.isLoading;
  
  // Determine if there's an error
  const error = 
    hierarchyQuery.error || 
    areaPathsQuery.error || 
    teamsQuery.error ||
    workItemTypesQuery.error;
  
  return {
    hierarchy: hierarchyQuery.data,
    areaPaths: areaPathsQuery.data || [],
    teams: teamsQuery.data || [],
    teamAreaPaths: teamAreaPathsMap,
    workItemTypes: workItemTypesQuery.data || [],
    isLoading,
    error,
    refetch: () => {
      hierarchyQuery.refetch();
      areaPathsQuery.refetch();
      teamsQuery.refetch();
      workItemTypesQuery.refetch();
    }
  };
}

/**
 * Hook for managing grooming stories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory, 
  splitStory,
  getStoryRelationships,
  createStoryRelationship,
  deleteStoryRelationship,
  getStoryAnalyses,
  analyzeStory
} from '../lib/api/grooming';
import { 
  GroomingStory, 
  StoryFilter, 
  CreateStoryRequest, 
  UpdateStoryRequest,
  SplitStoryRequest,
  CreateStoryRelationshipRequest,
  AnalyzeStoryRequest
} from '../types/grooming';

export function useGroomingStories(filter?: StoryFilter, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['grooming-stories', filter, page, pageSize],
    queryFn: () => getStories(filter, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroomingStory(id: string | undefined) {
  return useQuery({
    queryKey: ['grooming-story', id],
    queryFn: () => id ? getStoryById(id) : Promise.reject('No story ID provided'),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (story: CreateStoryRequest) => createStory(story),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grooming-stories'] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (story: UpdateStoryRequest) => updateStory(story),
    onSuccess: (updatedStory: GroomingStory) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-stories'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-story', updatedStory.id] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteStory(id),
    onSuccess: (_: void, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-stories'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-story', id] });
    },
  });
}

export function useSplitStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: SplitStoryRequest) => splitStory(request),
    onSuccess: (newStories: GroomingStory[], variables) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-stories'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-story', variables.original_story_id] });
      
      // Invalidate queries for the new stories
      newStories.forEach(story => {
        queryClient.invalidateQueries({ queryKey: ['grooming-story', story.id] });
      });
      
      // Invalidate story relationships
      queryClient.invalidateQueries({ queryKey: ['story-relationships', variables.original_story_id] });
    },
  });
}

export function useStoryRelationships(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-relationships', storyId],
    queryFn: () => storyId ? getStoryRelationships(storyId) : Promise.reject('No story ID provided'),
    enabled: !!storyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateStoryRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (relationship: CreateStoryRelationshipRequest) => createStoryRelationship(relationship),
    onSuccess: (relationship) => {
      queryClient.invalidateQueries({ queryKey: ['story-relationships', relationship.parent_story_id] });
      queryClient.invalidateQueries({ queryKey: ['story-relationships', relationship.child_story_id] });
    },
  });
}

export function useDeleteStoryRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteStoryRelationship(id),
    onSuccess: () => {
      // Since we don't know which stories were related, we invalidate all story relationships
      queryClient.invalidateQueries({ queryKey: ['story-relationships'] });
    },
  });
}

export function useStoryAnalyses(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-analyses', storyId],
    queryFn: () => storyId ? getStoryAnalyses(storyId) : Promise.reject('No story ID provided'),
    enabled: !!storyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalyzeStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: AnalyzeStoryRequest) => analyzeStory(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-analyses', variables.storyId] });
    },
  });
}

export function useStoriesByLevel(workspaceId: string | undefined, level: 'epic' | 'feature' | 'story') {
  const filter: StoryFilter = {
    workspace_id: workspaceId,
    level,
  };
  
  return useQuery({
    queryKey: ['stories-by-level', workspaceId, level],
    queryFn: () => workspaceId ? getStories(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChildStories(parentStoryId: string | undefined) {
  const filter: StoryFilter = {
    parent_story_id: parentStoryId,
  };
  
  return useQuery({
    queryKey: ['child-stories', parentStoryId],
    queryFn: () => parentStoryId ? getStories(filter) : Promise.reject('No parent story ID provided'),
    enabled: !!parentStoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStoriesByStatus(workspaceId: string | undefined, status: 'new' | 'groomed' | 'ready' | 'in_sprint' | 'done') {
  const filter: StoryFilter = {
    workspace_id: workspaceId,
    status,
  };
  
  return useQuery({
    queryKey: ['stories-by-status', workspaceId, status],
    queryFn: () => workspaceId ? getStories(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductBoardStories(pbFeatureId: string | undefined) {
  const filter: StoryFilter = {
    pb_feature_id: pbFeatureId,
  };
  
  return useQuery({
    queryKey: ['pb-stories', pbFeatureId],
    queryFn: () => pbFeatureId ? getStories(filter) : Promise.reject('No ProductBoard feature ID provided'),
    enabled: !!pbFeatureId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAzureDevOpsStories(adoWorkItemId: number | undefined) {
  const filter: StoryFilter = {
    ado_work_item_id: adoWorkItemId,
  };
  
  return useQuery({
    queryKey: ['ado-stories', adoWorkItemId],
    queryFn: () => adoWorkItemId ? getStories(filter) : Promise.reject('No Azure DevOps work item ID provided'),
    enabled: !!adoWorkItemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearchStories(searchTerm: string | undefined, workspaceId: string | undefined) {
  const filter: StoryFilter = {
    workspace_id: workspaceId,
    search: searchTerm,
  };
  
  return useQuery({
    queryKey: ['search-stories', searchTerm, workspaceId],
    queryFn: () => searchTerm ? getStories(filter) : Promise.reject('No search term provided'),
    enabled: !!searchTerm && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

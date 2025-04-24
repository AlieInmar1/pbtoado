/**
 * Hook for managing session stories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  getSessionStories, 
  addStoryToSession, 
  updateSessionStory, 
  removeStoryFromSession,
  createStory
} from '../lib/api/grooming';
import { 
  SessionStory, 
  AddStoryToSessionRequest, 
  UpdateSessionStoryRequest,
  CreateStoryRequest
} from '../types/grooming';
import { Feature } from '../lib/api/features';

export function useSessionStories(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-stories', sessionId],
    queryFn: () => sessionId ? getSessionStories(sessionId) : Promise.reject('No session ID provided'),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddStoryToSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: AddStoryToSessionRequest) => addStoryToSession(request),
    onSuccess: (sessionStory) => {
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionStory.session_id] });
    },
  });
}

export function useUpdateSessionStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: UpdateSessionStoryRequest & { id: string }) => updateSessionStory(request),
    onSuccess: (sessionStory) => {
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionStory.session_id] });
    },
  });
}

export function useUpdateDiscussionPoints() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, points }: { id: string; points: string[] }) => 
      updateSessionStory({ id, discussion_points: points }),
    onSuccess: (sessionStory) => {
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionStory.session_id] });
    },
  });
}

export function useUpdateDecisions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, decisions }: { id: string; decisions: string[] }) => 
      updateSessionStory({ id, decisions }),
    onSuccess: (sessionStory) => {
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionStory.session_id] });
    },
  });
}

export function useUpdateQuestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, questions }: { id: string; questions: string[] }) => 
      updateSessionStory({ id, questions }),
    onSuccess: (sessionStory) => {
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionStory.session_id] });
    },
  });
}

export function useRemoveStoryFromSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => removeStoryFromSession(id),
    onSuccess: (_, id) => {
      // Since we don't know the session ID from the response, we invalidate all session-stories queries
      queryClient.invalidateQueries({ queryKey: ['session-stories'] });
    },
  });
}

export function useAddProductBoardFeatureToSession(sessionId: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const createStoryMutation = useMutation({
    mutationFn: (storyRequest: CreateStoryRequest) => createStory(storyRequest),
  });
  
  const addToSessionMutation = useMutation({
    mutationFn: (request: AddStoryToSessionRequest) => addStoryToSession(request),
  });
  
  const addFeatureToSession = async (feature: Feature) => {
    try {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      
      // 1. Create a grooming story from the ProductBoard feature
      // Convert string complexity to integer (low=1, medium=2, high=3)
      const storyRequest: CreateStoryRequest = {
        title: feature.name,
        description: feature.description || '',
        pb_feature_id: feature.productboard_id,
        complexity: 2, // Default complexity (medium = 2)
        workspace_id: currentWorkspace.id, // Add the workspace_id
      };
      
      const story = await createStoryMutation.mutateAsync(storyRequest);
      
      // 2. Add the story to the session
      const sessionStoryRequest: AddStoryToSessionRequest = {
        session_id: sessionId,
        story_id: story.id,
      };
      
      const sessionStory = await addToSessionMutation.mutateAsync(sessionStoryRequest);
      
      // 3. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['session-stories', sessionId] });
      
      return sessionStory;
    } catch (error) {
      console.error('Error adding feature to session:', error);
      throw error;
    }
  };
  
  return {
    addFeatureToSession,
    isLoading: createStoryMutation.isPending || addToSessionMutation.isPending,
    error: createStoryMutation.error || addToSessionMutation.error,
  };
}

/**
 * Hook for managing sprints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSprints, 
  getSprintById, 
  createSprint, 
  updateSprint, 
  deleteSprint,
  getSprintStories,
  addStoryToSprint,
  updateSprintStory,
  removeStoryFromSprint,
  getSprintSessions,
  associateSessionWithSprint,
  removeSessionFromSprint
} from '../lib/api/grooming';
import { 
  Sprint, 
  SprintFilter, 
  CreateSprintRequest, 
  UpdateSprintRequest,
  AddStoryToSprintRequest,
  UpdateSprintStoryRequest,
  AssociateSessionWithSprintRequest
} from '../types/grooming';

export function useSprints(filter?: SprintFilter, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['sprints', filter, page, pageSize],
    queryFn: () => getSprints(filter, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSprint(id: string | undefined) {
  return useQuery({
    queryKey: ['sprint', id],
    queryFn: () => id ? getSprintById(id) : Promise.reject('No sprint ID provided'),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sprint: CreateSprintRequest) => createSprint(sprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sprint: UpdateSprintRequest & { id: string }) => updateSprint(sprint),
    onSuccess: (updatedSprint: Sprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', updatedSprint.id] });
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSprint(id),
    onSuccess: (_: void, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
    },
  });
}

export function useSprintStories(sprintId: string | undefined) {
  return useQuery({
    queryKey: ['sprint-stories', sprintId],
    queryFn: () => sprintId ? getSprintStories(sprintId) : Promise.reject('No sprint ID provided'),
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddStoryToSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: AddStoryToSprintRequest) => addStoryToSprint(request),
    onSuccess: (sprintStory) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-stories', sprintStory.sprint_id] });
      queryClient.invalidateQueries({ queryKey: ['grooming-story', sprintStory.story_id] });
    },
  });
}

export function useUpdateSprintStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: UpdateSprintStoryRequest & { id: string }) => updateSprintStory(request),
    onSuccess: (sprintStory) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-stories', sprintStory.sprint_id] });
      queryClient.invalidateQueries({ queryKey: ['grooming-story', sprintStory.story_id] });
    },
  });
}

export function useRemoveStoryFromSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => removeStoryFromSprint(id),
    onSuccess: () => {
      // Since we don't know which sprint or story was affected, we invalidate all sprint stories
      queryClient.invalidateQueries({ queryKey: ['sprint-stories'] });
      // We also invalidate all stories since their status might have changed
      queryClient.invalidateQueries({ queryKey: ['grooming-stories'] });
    },
  });
}

export function useSprintSessions(sprintId: string | undefined) {
  return useQuery({
    queryKey: ['sprint-sessions', sprintId],
    queryFn: () => sprintId ? getSprintSessions(sprintId) : Promise.reject('No sprint ID provided'),
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAssociateSessionWithSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: AssociateSessionWithSprintRequest) => associateSessionWithSprint(request),
    onSuccess: (sessionSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-sessions', sessionSprint.sprint_id] });
      queryClient.invalidateQueries({ queryKey: ['grooming-session', sessionSprint.session_id] });
    },
  });
}

export function useRemoveSessionFromSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => removeSessionFromSprint(id),
    onSuccess: () => {
      // Since we don't know which sprint or session was affected, we invalidate all sprint sessions
      queryClient.invalidateQueries({ queryKey: ['sprint-sessions'] });
    },
  });
}

export function useChangeSprintStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sprintId, status }: { sprintId: string, status: 'planning' | 'active' | 'completed' }) => 
      updateSprint({ id: sprintId, status }),
    onSuccess: (updatedSprint: Sprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', updatedSprint.id] });
    },
  });
}

export function useActiveSprint(workspaceId: string | undefined) {
  const filter: SprintFilter = {
    workspace_id: workspaceId,
    status: 'active',
  };
  
  return useQuery({
    queryKey: ['active-sprint', workspaceId],
    queryFn: () => workspaceId ? getSprints(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data.length > 0 ? data.data[0] : null,
  });
}

export function useUpcomingSprints(workspaceId: string | undefined) {
  const today = new Date();
  const filter: SprintFilter = {
    workspace_id: workspaceId,
    from_date: today.toISOString(),
    status: 'planning',
  };
  
  return useQuery({
    queryKey: ['upcoming-sprints', workspaceId],
    queryFn: () => workspaceId ? getSprints(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompletedSprints(workspaceId: string | undefined) {
  const filter: SprintFilter = {
    workspace_id: workspaceId,
    status: 'completed',
  };
  
  return useQuery({
    queryKey: ['completed-sprints', workspaceId],
    queryFn: () => workspaceId ? getSprints(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentSprints(workspaceId: string | undefined) {
  const filter: SprintFilter = {
    workspace_id: workspaceId,
  };
  
  return useQuery({
    queryKey: ['recent-sprints', workspaceId],
    queryFn: () => workspaceId ? getSprints(filter, 1, 5) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

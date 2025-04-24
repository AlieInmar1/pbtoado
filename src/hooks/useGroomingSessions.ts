/**
 * Hook for managing grooming sessions
 */

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { 
  getSessions, 
  getSessionById, 
  createSession, 
  updateSession, 
  deleteSession, 
  uploadTranscript,
  getSessionStories,
  getSessionParticipants,
  getSessionAnalyses
} from '../lib/api/grooming';
import { 
  GroomingSession, 
  SessionFilter, 
  CreateSessionRequest, 
  UpdateSessionRequest 
} from '../types/grooming';

export function useGroomingSessions(filter?: SessionFilter, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['grooming-sessions', filter, page, pageSize],
    queryFn: () => getSessions(filter, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroomingSession(id: string | undefined) {
  return useQuery({
    queryKey: ['grooming-session', id],
    queryFn: () => id ? getSessionById(id) : Promise.reject('No session ID provided'),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSessionStories(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-stories', sessionId],
    queryFn: () => sessionId ? getSessionStories(sessionId) : Promise.reject('No session ID provided'),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSessionParticipants(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-participants', sessionId],
    queryFn: () => sessionId ? getSessionParticipants(sessionId) : Promise.reject('No session ID provided'),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSessionAnalyses(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-analyses', sessionId],
    queryFn: () => sessionId ? getSessionAnalyses(sessionId) : Promise.reject('No session ID provided'),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (session: CreateSessionRequest) => createSession(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grooming-sessions'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (session: UpdateSessionRequest) => updateSession(session),
    onSuccess: (updatedSession: GroomingSession) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-session', updatedSession.id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_: void, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-session', id] });
    },
  });
}

export function useUploadTranscript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, transcript }: { sessionId: string, transcript: string }) => 
      uploadTranscript(sessionId, transcript),
    onSuccess: (updatedSession: GroomingSession) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-session', updatedSession.id] });
    },
  });
}

export function useChangeSessionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string, status: 'planned' | 'in_progress' | 'completed' }) => 
      updateSession({ id: sessionId, status }),
    onSuccess: (updatedSession: GroomingSession) => {
      queryClient.invalidateQueries({ queryKey: ['grooming-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['grooming-session', updatedSession.id] });
    },
  });
}

export function useSessionsByStatus(workspaceId: string | undefined, status: 'planned' | 'in_progress' | 'completed') {
  return useQuery({
    queryKey: ['grooming-sessions-by-status', workspaceId, status],
    queryFn: () => getSessions({ workspace_id: workspaceId, status }),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpcomingSessions(workspaceId: string | undefined) {
  const today = new Date();
  const filter: SessionFilter = {
    workspace_id: workspaceId,
    from_date: today.toISOString(),
    status: 'planned',
  };
  
  return useQuery({
    queryKey: ['upcoming-sessions', workspaceId],
    queryFn: () => workspaceId ? getSessions(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentSessions(workspaceId: string | undefined) {
  const filter: SessionFilter = {
    workspace_id: workspaceId,
    status: 'completed',
  };
  
  return useQuery({
    queryKey: ['recent-sessions', workspaceId],
    queryFn: () => workspaceId ? getSessions(filter, 1, 5) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSessionsByType(workspaceId: string | undefined, type: 'product' | 'technical' | 'refinement') {
  const filter: SessionFilter = {
    workspace_id: workspaceId,
    session_type: type,
  };
  
  return useQuery({
    queryKey: ['sessions-by-type', workspaceId, type],
    queryFn: () => workspaceId ? getSessions(filter) : Promise.reject('No workspace ID provided'),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

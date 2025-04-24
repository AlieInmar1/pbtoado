import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Database {
  groomingSessions: {
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    get: (id: string) => Promise<any>;
    list: (filters?: any) => Promise<any>;
    updateTranscript: (id: string, transcript: string) => Promise<any>;
  };
  groomingStories: {
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    get: (id: string) => Promise<any>;
    list: (filters?: any) => Promise<any>;
  };
  sprints: {
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    get: (id: string) => Promise<any>;
    list: (filters?: any) => Promise<any>;
  };
  sprintStories: {
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    list: (filters?: any) => Promise<any>;
  };
  aiAnalyses: {
    create: (data: any) => Promise<any>;
    get: (id: string) => Promise<any>;
    list: (filters?: any) => Promise<any>;
  };
}

interface DatabaseContextType {
  db: Database | null;
  isLoading: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  // Mock implementation of the database
  const mockDb: Database = {
    groomingSessions: {
      create: async (data) => {
        console.log('Creating grooming session:', data);
        // In a real implementation, this would call the Supabase API
        // For now, just return a mock response
        return {
          id: 'mock-session-id',
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      update: async (id, data) => {
        console.log(`Updating grooming session ${id}:`, data);
        return {
          id,
          ...data,
          updated_at: new Date().toISOString(),
        };
      },
      delete: async (id) => {
        console.log(`Deleting grooming session ${id}`);
        return { success: true };
      },
      get: async (id) => {
        console.log(`Getting grooming session ${id}`);
        return {
          id,
          name: 'Mock Session',
          session_date: new Date().toISOString(),
          duration_minutes: 60,
          session_type: 'product',
          status: 'planned',
          workspace_id: '00000000-0000-0000-0000-000000000000', // Using a valid UUID for the default workspace
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      list: async (filters) => {
        console.log('Listing grooming sessions with filters:', filters);
        return {
          data: [
            {
              id: 'mock-session-1',
              name: 'Mock Session 1',
              session_date: new Date().toISOString(),
              duration_minutes: 60,
              session_type: 'product',
              status: 'planned',
              workspace_id: '00000000-0000-0000-0000-000000000000', // Using a valid UUID for the default workspace
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'mock-session-2',
              name: 'Mock Session 2',
              session_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              duration_minutes: 90,
              session_type: 'technical',
              status: 'planned',
              workspace_id: '00000000-0000-0000-0000-000000000000', // Using a valid UUID for the default workspace
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 2,
        };
      },
      updateTranscript: async (id, transcript) => {
        console.log(`Updating transcript for session ${id}`);
        return {
          id,
          transcript,
          updated_at: new Date().toISOString(),
        };
      },
    },
    groomingStories: {
      create: async (data) => {
        console.log('Creating grooming story:', data);
        return {
          id: 'mock-story-id',
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      update: async (id, data) => {
        console.log(`Updating grooming story ${id}:`, data);
        return {
          id,
          ...data,
          updated_at: new Date().toISOString(),
        };
      },
      delete: async (id) => {
        console.log(`Deleting grooming story ${id}`);
        return { success: true };
      },
      get: async (id) => {
        console.log(`Getting grooming story ${id}`);
        return {
          id,
          title: 'Mock Story',
          description: 'This is a mock story for testing',
          status: 'pending',
          complexity: 'medium',
          story_points: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      list: async (filters) => {
        console.log('Listing grooming stories with filters:', filters);
        return {
          data: [
            {
              id: 'mock-story-1',
              title: 'Mock Story 1',
              description: 'This is the first mock story',
              status: 'pending',
              complexity: 'low',
              story_points: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'mock-story-2',
              title: 'Mock Story 2',
              description: 'This is the second mock story',
              status: 'discussed',
              complexity: 'high',
              story_points: 8,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 2,
        };
      },
    },
    sprints: {
      create: async (data) => {
        console.log('Creating sprint:', data);
        return {
          id: 'mock-sprint-id',
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      update: async (id, data) => {
        console.log(`Updating sprint ${id}:`, data);
        return {
          id,
          ...data,
          updated_at: new Date().toISOString(),
        };
      },
      delete: async (id) => {
        console.log(`Deleting sprint ${id}`);
        return { success: true };
      },
      get: async (id) => {
        console.log(`Getting sprint ${id}`);
        return {
          id,
          name: 'Mock Sprint',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 86400000).toISOString(), // 2 weeks from now
          capacity_points: 30,
          team_id: 'default-team',
          status: 'planning',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      list: async (filters) => {
        console.log('Listing sprints with filters:', filters);
        return {
          data: [
            {
              id: 'mock-sprint-1',
              name: 'Sprint 1',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 14 * 86400000).toISOString(),
              capacity_points: 30,
              team_id: 'default-team',
              status: 'planning',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'mock-sprint-2',
              name: 'Sprint 2',
              start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
              end_date: new Date(Date.now() + 28 * 86400000).toISOString(),
              capacity_points: 30,
              team_id: 'default-team',
              status: 'planning',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 2,
        };
      },
    },
    sprintStories: {
      create: async (data) => {
        console.log('Adding story to sprint:', data);
        return {
          id: 'mock-sprint-story-id',
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      },
      update: async (id, data) => {
        console.log(`Updating sprint story ${id}:`, data);
        return {
          id,
          ...data,
          updated_at: new Date().toISOString(),
        };
      },
      delete: async (id) => {
        console.log(`Removing story from sprint ${id}`);
        return { success: true };
      },
      list: async (filters) => {
        console.log('Listing sprint stories with filters:', filters);
        return {
          data: [
            {
              id: 'mock-sprint-story-1',
              sprint_id: filters?.sprint_id || 'mock-sprint-1',
              story_id: 'mock-story-1',
              priority: 1,
              story_points: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              story: {
                id: 'mock-story-1',
                title: 'Mock Story 1',
                description: 'This is the first mock story',
                status: 'pending',
                complexity: 'low',
                story_points: 3,
              },
            },
            {
              id: 'mock-sprint-story-2',
              sprint_id: filters?.sprint_id || 'mock-sprint-1',
              story_id: 'mock-story-2',
              priority: 2,
              story_points: 8,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              story: {
                id: 'mock-story-2',
                title: 'Mock Story 2',
                description: 'This is the second mock story',
                status: 'discussed',
                complexity: 'high',
                story_points: 8,
              },
            },
          ],
          count: 2,
        };
      },
    },
    aiAnalyses: {
      create: async (data) => {
        console.log('Creating AI analysis:', data);
        return {
          id: 'mock-analysis-id',
          ...data,
          created_at: new Date().toISOString(),
        };
      },
      get: async (id) => {
        console.log(`Getting AI analysis ${id}`);
        return {
          id,
          analysis_type: 'transcript',
          key_points: ['Mock key point 1', 'Mock key point 2'],
          decisions: ['Mock decision 1', 'Mock decision 2'],
          action_items: [
            { description: 'Mock action item 1', assignee: 'user1', due_date: new Date().toISOString(), status: 'pending' },
            { description: 'Mock action item 2', assignee: 'user2', due_date: new Date().toISOString(), status: 'pending' },
          ],
          created_at: new Date().toISOString(),
        };
      },
      list: async (filters) => {
        console.log('Listing AI analyses with filters:', filters);
        return {
          data: [
            {
              id: 'mock-analysis-1',
              session_id: filters?.session_id,
              story_id: filters?.story_id,
              analysis_type: 'transcript',
              key_points: ['Mock key point 1', 'Mock key point 2'],
              decisions: ['Mock decision 1', 'Mock decision 2'],
              action_items: [
                { description: 'Mock action item 1', assignee: 'user1', due_date: new Date().toISOString(), status: 'pending' },
                { description: 'Mock action item 2', assignee: 'user2', due_date: new Date().toISOString(), status: 'pending' },
              ],
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        };
      },
    },
  };

  const value = {
    db: mockDb,
    isLoading: false,
    error: null,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

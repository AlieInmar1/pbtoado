import { mockWorkspaces, mockStories, mockConfigurations } from './mockData';
import type { Workspace, Story, Configuration } from '../types/database';

// Helper to simulate async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Supabase client
export const mockSupabase = {
  from: (table: string) => ({
    select: async (columns: string = '*') => {
      await delay(500); // Simulate network delay
      
      switch (table) {
        case 'workspaces':
          return { data: mockWorkspaces, error: null };
        case 'stories':
          return { data: mockStories, error: null };
        case 'configurations':
          return { data: mockConfigurations, error: null };
        default:
          return { data: [], error: null };
      }
    },
    insert: async (data: any) => {
      await delay(300);
      return { data: { ...data, id: crypto.randomUUID() }, error: null };
    },
    update: async (data: any) => {
      await delay(300);
      return { data, error: null };
    },
    delete: async () => {
      await delay(300);
      return { error: null };
    },
    eq: () => ({
      select: async () => ({ data: mockWorkspaces[0], error: null }),
      delete: async () => ({ error: null }),
      single: async () => ({ data: mockWorkspaces[0], error: null }),
    }),
    order: () => ({
      eq: () => ({
        select: async () => ({ data: mockStories, error: null }),
      }),
    }),
  }),
};
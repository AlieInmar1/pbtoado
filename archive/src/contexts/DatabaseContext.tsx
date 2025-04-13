import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from './WorkspaceContext';
import { toast } from 'sonner';
import type { 
  Story, 
  SyncRecord, 
  ProductBoardTrackedBoard,
  ProductBoardItemRanking,
  GroomingSession
} from '../types/database';
import type { ProductBoardFeature, StoryWithChildren } from '../types/productboard';

// Define database service interface
interface DatabaseService {
  loading: boolean;
  error: string | null;
  
  // Story-related methods
  stories: {
    getAll: (workspaceId: string) => Promise<Story[]>;
    getById: (id: string) => Promise<Story | null>;
    create: (story: Partial<Story>) => Promise<Story | null>;
    update: (id: string, updates: Partial<Story>) => Promise<Story | null>;
    delete: (id: string) => Promise<boolean>;
    getByParentId: (parentId: string) => Promise<Story[]>;
  };
  
  // ProductBoard feature methods
  productboardFeatures: {
    getAll: (workspaceId: string) => Promise<ProductBoardFeature[]>;
    getById: (id: string) => Promise<ProductBoardFeature | null>;
    getHierarchy: (workspaceId: string) => Promise<StoryWithChildren[]>;
  };
  
  // Sync records
  syncRecords: {
    getRecent: (workspaceId: string, limit?: number) => Promise<SyncRecord[]>;
    create: (record: Partial<SyncRecord>) => Promise<SyncRecord | null>;
  };
  
  // ProductBoard tracked boards
  trackedBoards: {
    getAll: (workspaceId: string) => Promise<ProductBoardTrackedBoard[]>;
    getById: (id: string) => Promise<ProductBoardTrackedBoard | null>;
    update: (id: string, updates: Partial<ProductBoardTrackedBoard>) => Promise<ProductBoardTrackedBoard | null>;
  };
  
  // ProductBoard rankings
  rankings: {
    getByBoard: (boardId: string, workspaceId: string) => Promise<ProductBoardItemRanking[]>;
    updateRanking: (id: string, newRank: number) => Promise<ProductBoardItemRanking | null>;
  };
  
  // Grooming sessions
  groomingSessions: {
    getAll: (workspaceId: string) => Promise<GroomingSession[]>;
    getById: (id: string) => Promise<GroomingSession | null>;
    create: (session: Partial<GroomingSession>) => Promise<GroomingSession | null>;
    update: (id: string, updates: Partial<GroomingSession>) => Promise<GroomingSession | null>;
  };

  // Build hierarchy from flat features
  buildHierarchy: (features: ProductBoardFeature[]) => StoryWithChildren[];
}

// Create the context
const DatabaseContext = createContext<DatabaseService | undefined>(undefined);

// Hook to use the database context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stories methods
  const stories = {
    getAll: async (workspaceId: string): Promise<Story[]> => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('updated_at', { ascending: false });
          
        if (error) {
          // Handle the specific case of a missing table
          if (error.message.includes('relation "public.stories" does not exist')) {
            console.warn('The stories table does not exist yet');
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        console.error('Error getting stories:', err);
        if (!err.message.includes('relation "public.stories" does not exist')) {
          toast.error(`Failed to load stories: ${err.message}`);
        }
        return [];
      }
    },
    
    getById: async (id: string): Promise<Story | null> => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Error getting story ${id}:`, err);
        toast.error(`Failed to load story: ${err.message}`);
        return null;
      }
    },
    
    create: async (story: Partial<Story>): Promise<Story | null> => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .insert([{ ...story }])
          .select()
          .single();
          
        if (error) throw error;
        toast.success('Story created successfully');
        return data;
      } catch (err: any) {
        console.error('Error creating story:', err);
        toast.error(`Failed to create story: ${err.message}`);
        return null;
      }
    },
    
    update: async (id: string, updates: Partial<Story>): Promise<Story | null> => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        toast.success('Story updated successfully');
        return data;
      } catch (err: any) {
        console.error(`Error updating story ${id}:`, err);
        toast.error(`Failed to update story: ${err.message}`);
        return null;
      }
    },
    
    delete: async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Story deleted successfully');
        return true;
      } catch (err: any) {
        console.error(`Error deleting story ${id}:`, err);
        toast.error(`Failed to delete story: ${err.message}`);
        return false;
      }
    },
    
    getByParentId: async (parentId: string): Promise<Story[]> => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('parent_id', parentId)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (err: any) {
        console.error(`Error getting stories with parent ${parentId}:`, err);
        toast.error(`Failed to load child stories: ${err.message}`);
        return [];
      }
    }
  };
  
  // ProductBoard features methods
  const productboardFeatures = {
    getAll: async (workspaceId: string): Promise<ProductBoardFeature[]> => {
      try {
        const { data, error } = await supabase
          .from('productboard_features')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('updated_at_timestamp', { ascending: false });
          
        if (error) {
          if (error.message.includes('relation "public.productboard_features" does not exist')) {
            console.warn('The productboard_features table does not exist yet');
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        console.error('Error getting ProductBoard features:', err);
        if (!err.message.includes('relation "public.productboard_features" does not exist')) {
          toast.error(`Failed to load features: ${err.message}`);
        }
        return [];
      }
    },
    
    getById: async (id: string): Promise<ProductBoardFeature | null> => {
      try {
        const { data, error } = await supabase
          .from('productboard_features')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Error getting feature ${id}:`, err);
        toast.error(`Failed to load feature: ${err.message}`);
        return null;
      }
    },
    
    getHierarchy: async (workspaceId: string): Promise<StoryWithChildren[]> => {
      try {
        const { data, error } = await supabase
          .from('productboard_features')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('updated_at_timestamp', { ascending: false });
          
        if (error) throw error;
        
        return buildHierarchy(data || []);
      } catch (err: any) {
        console.error('Error getting feature hierarchy:', err);
        toast.error(`Failed to load feature hierarchy: ${err.message}`);
        return [];
      }
    }
  };
  
  // Sync records methods
  const syncRecords = {
    getRecent: async (workspaceId: string, limit: number = 10): Promise<SyncRecord[]> => {
      try {
        const { data, error } = await supabase
          .from('sync_records')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          // Handle the specific case of a missing table
          if (error.message.includes('relation "public.sync_records" does not exist')) {
            console.warn('The sync_records table does not exist yet');
            // Don't show an error toast for this specific case
            return [];
          }
          throw error;
        }
        
        return data || [];
      } catch (err: any) {
        console.error('Error getting sync records:', err);
        // Show error toast for errors other than missing table
        if (!err.message.includes('relation "public.sync_records" does not exist')) {
          toast.error(`Failed to load sync history: ${err.message}`);
        }
        return [];
      }
    },
    
    create: async (record: Partial<SyncRecord>): Promise<SyncRecord | null> => {
      try {
        const { data, error } = await supabase
          .from('sync_records')
          .insert([{ ...record }])
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error('Error creating sync record:', err);
        toast.error(`Failed to create sync record: ${err.message}`);
        return null;
      }
    }
  };
  
  // ProductBoard tracked boards methods
  const trackedBoards = {
    getAll: async (workspaceId: string): Promise<ProductBoardTrackedBoard[]> => {
      try {
        const { data, error } = await supabase
          .from('productboard_tracked_boards')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('board_name', { ascending: true });
          
        if (error) {
          if (error.message.includes('relation "public.productboard_tracked_boards" does not exist')) {
            console.warn('The productboard_tracked_boards table does not exist yet');
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        console.error('Error getting tracked boards:', err);
        if (!err.message.includes('relation "public.productboard_tracked_boards" does not exist')) {
          toast.error(`Failed to load boards: ${err.message}`);
        }
        return [];
      }
    },
    
    getById: async (id: string): Promise<ProductBoardTrackedBoard | null> => {
      try {
        const { data, error } = await supabase
          .from('productboard_tracked_boards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Error getting board ${id}:`, err);
        toast.error(`Failed to load board: ${err.message}`);
        return null;
      }
    },
    
    update: async (id: string, updates: Partial<ProductBoardTrackedBoard>): Promise<ProductBoardTrackedBoard | null> => {
      try {
        const { data, error } = await supabase
          .from('productboard_tracked_boards')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        toast.success('Board updated successfully');
        return data;
      } catch (err: any) {
        console.error(`Error updating board ${id}:`, err);
        toast.error(`Failed to update board: ${err.message}`);
        return null;
      }
    }
  };
  
  // ProductBoard rankings methods
  const rankings = {
    getByBoard: async (boardId: string, workspaceId: string): Promise<ProductBoardItemRanking[]> => {
      try {
        const { data, error } = await supabase
          .from('productboard_item_rankings')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('board_id', boardId)
          .order('current_rank', { ascending: true });
          
        if (error) {
          if (error.message.includes('relation "public.productboard_item_rankings" does not exist')) {
            console.warn('The productboard_item_rankings table does not exist yet');
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        console.error('Error getting rankings:', err);
        if (!err.message.includes('relation "public.productboard_item_rankings" does not exist')) {
          toast.error(`Failed to load rankings: ${err.message}`);
        }
        return [];
      }
    },
    
    updateRanking: async (id: string, newRank: number): Promise<ProductBoardItemRanking | null> => {
      try {
        const { data, error } = await supabase
          .from('productboard_item_rankings')
          .update({ 
            current_rank: newRank,
            previous_rank: (await supabase
              .from('productboard_item_rankings')
              .select('current_rank')
              .eq('id', id)
              .single()
            ).data?.current_rank,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Error updating ranking for ${id}:`, err);
        toast.error(`Failed to update ranking: ${err.message}`);
        return null;
      }
    }
  };
  
  // Grooming sessions methods
  const groomingSessions = {
    getAll: async (workspaceId: string): Promise<GroomingSession[]> => {
      try {
        const { data, error } = await supabase
          .from('grooming_sessions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('session_date', { ascending: false });
          
        if (error) {
          if (error.message.includes('relation "public.grooming_sessions" does not exist')) {
            console.warn('The grooming_sessions table does not exist yet');
            return [];
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        console.error('Error getting grooming sessions:', err);
        if (!err.message.includes('relation "public.grooming_sessions" does not exist')) {
          toast.error(`Failed to load grooming sessions: ${err.message}`);
        }
        return [];
      }
    },
    
    getById: async (id: string): Promise<GroomingSession | null> => {
      try {
        const { data, error } = await supabase
          .from('grooming_sessions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Error getting grooming session ${id}:`, err);
        toast.error(`Failed to load grooming session: ${err.message}`);
        return null;
      }
    },
    
    create: async (session: Partial<GroomingSession>): Promise<GroomingSession | null> => {
      try {
        const { data, error } = await supabase
          .from('grooming_sessions')
          .insert([{ ...session }])
          .select()
          .single();
          
        if (error) throw error;
        toast.success('Grooming session created successfully');
        return data;
      } catch (err: any) {
        console.error('Error creating grooming session:', err);
        toast.error(`Failed to create grooming session: ${err.message}`);
        return null;
      }
    },
    
    update: async (id: string, updates: Partial<GroomingSession>): Promise<GroomingSession | null> => {
      try {
        const { data, error } = await supabase
          .from('grooming_sessions')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        toast.success('Grooming session updated successfully');
        return data;
      } catch (err: any) {
        console.error(`Error updating grooming session ${id}:`, err);
        toast.error(`Failed to update grooming session: ${err.message}`);
        return null;
      }
    }
  };
  
  // Helper function to build hierarchy from flat list of features
  const buildHierarchy = (features: ProductBoardFeature[]): StoryWithChildren[] => {
    // Create a map of features by ID for quick lookup
    const featureMap = new Map<string, StoryWithChildren>();
    features.forEach(feature => {
      featureMap.set(feature.id, { ...feature, children: [] });
    });
    
    // Build the hierarchy by connecting parents and children
    const rootItems: StoryWithChildren[] = [];
    
    features.forEach(feature => {
      const featureWithChildren = featureMap.get(feature.id)!;
      
      if (feature.parent_productboard_id && featureMap.has(feature.parent_productboard_id)) {
        // If this feature has a parent and we have the parent in our map, add as a child
        const parent = featureMap.get(feature.parent_productboard_id)!;
        parent.children = parent.children || [];
        parent.children.push(featureWithChildren);
      } else {
        // If no parent or parent not in our data, add to root items
        rootItems.push(featureWithChildren);
      }
    });
    
    return rootItems;
  };

  // Combine all the database services
  const dbService: DatabaseService = {
    loading,
    error,
    stories,
    productboardFeatures,
    syncRecords,
    trackedBoards,
    rankings,
    groomingSessions,
    buildHierarchy
  };

  return (
    <DatabaseContext.Provider value={dbService}>
      {children}
    </DatabaseContext.Provider>
  );
};

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Workspace {
  id: string;
  name: string;
  description?: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  isLoading: boolean;
  error: Error | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  // Using a valid UUID for the default workspace to avoid type errors with Supabase
  const DEFAULT_WORKSPACE_UUID = '00000000-0000-0000-0000-000000000000';
  
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>({
    id: DEFAULT_WORKSPACE_UUID,
    name: 'Default Workspace',
    description: 'The default workspace for all users'
  });
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: DEFAULT_WORKSPACE_UUID,
      name: 'Default Workspace',
      description: 'The default workspace for all users'
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const value = {
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    isLoading,
    error
  };
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Workspace } from '../types/database';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  loading: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  // Hardcoded default workspace - no database queries needed
  const defaultWorkspace: Workspace = {
    id: "default-workspace-id",
    name: "Default Workspace",
    pb_api_key: import.meta.env.VITE_PRODUCTBOARD_API_KEY || "",
    ado_api_key: "",
    pb_board_id: "",
    ado_project_id: "",
    ado_organization: "",
    sync_frequency: "manual",
  };

  const [workspaces] = useState<Workspace[]>([defaultWorkspace]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(defaultWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple promise-returning function to maintain API compatibility
  const refreshWorkspaces = async () => {
    return Promise.resolve();
  };

  const value = {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    error,
    refreshWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

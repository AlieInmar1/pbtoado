import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase } from './DatabaseContext';
import type { Workspace } from '../types/database';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  setCurrentWorkspace: () => {},
  workspaces: [],
  loading: true,
  error: null,
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { db } = useDatabase();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>({
    id: '904559d5-3948-43ae-8f6f-eb9bc3b20c85',
    name: 'Default Workspace',
    pb_board_id: 'default',
    ado_project_id: 'default',
    pb_api_key: '',
    ado_api_key: '',
    sync_frequency: '01:00:00',
    last_sync_timestamp: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    async function loadWorkspaces() {
      const workspaces = await db.workspaces.getAll();
      setWorkspaces(workspaces);
      setLoading(false);
    }

    loadWorkspaces();
  }, [db]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace: () => {}, // Disable changing workspace
        workspaces,
        loading,
        error,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
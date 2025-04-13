import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseDatabaseProvider } from '../lib/database/supabase';
import type { DatabaseProvider } from '../lib/database/types';

interface DatabaseContextType {
  db: DatabaseProvider | null;
  loading: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  loading: true,
  error: null,
});

export function DatabaseProviderComponent({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseContextType>({
    db: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const db = new SupabaseDatabaseProvider(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      setState({
        db,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        db: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize database',
      });
    }
  }, []);

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
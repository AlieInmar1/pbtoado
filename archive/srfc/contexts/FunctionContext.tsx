import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFunctions, getFunctions, type FunctionProvider } from '../lib/functions';

interface FunctionContextType {
  functions: FunctionProvider | null;
  loading: boolean;
  error: string | null;
}

const FunctionContext = createContext<FunctionContextType>({
  functions: null,
  loading: true,
  error: null,
});

export function FunctionProviderComponent({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunctionContextType>({
    functions: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const functions = initializeFunctions(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      setState({
        functions,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        functions: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize functions',
      });
    }
  }, []);

  return (
    <FunctionContext.Provider value={state}>
      {children}
    </FunctionContext.Provider>
  );
}

export function useFunctions() {
  return useContext(FunctionContext);
}
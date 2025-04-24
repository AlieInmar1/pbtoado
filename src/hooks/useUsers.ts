import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductBoardUser {
  id: number;
  productboard_id: string | null;
  email: string;
  name: string | null;
  role: string | null;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for fetching and managing ProductBoard users
 */
export function useUsers() {
  const [users, setUsers] = useState<ProductBoardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('productboard_users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching ProductBoard users:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
  };
}

export default useUsers;

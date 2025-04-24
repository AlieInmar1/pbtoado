import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductBoardProduct {
  id: number;
  productboard_id: string;
  name: string;
  description: string | null;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for fetching and managing ProductBoard products
 */
export function useProducts() {
  const [products, setProducts] = useState<ProductBoardProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('productboard_products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching ProductBoard products:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
  };
}

export default useProducts;

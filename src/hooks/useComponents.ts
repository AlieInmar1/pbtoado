import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductBoardComponent {
  id: number;
  productboard_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  business_unit: string | null;
  product_code: string | null;
  workspace_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch and manage ProductBoard components
 */
export function useComponents() {
  const [components, setComponents] = useState<ProductBoardComponent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Fetch components from the database
   */
  const fetchComponents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('productboard_components')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(`Error fetching components: ${error.message}`);
      }
      
      setComponents(data || []);
    } catch (err) {
      console.error('Error in useComponents:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch components on mount
  useEffect(() => {
    fetchComponents();
  }, []);
  
  /**
   * Get a component by its ProductBoard ID
   * @param productboardId The ProductBoard ID of the component
   * @returns The component or undefined if not found
   */
  const getComponentById = (productboardId: string): ProductBoardComponent | undefined => {
    return components.find(component => component.productboard_id === productboardId);
  };
  
  /**
   * Get a component by its name
   * @param name The name of the component
   * @returns The component or undefined if not found
   */
  const getComponentByName = (name: string): ProductBoardComponent | undefined => {
    return components.find(component => component.name === name);
  };
  
  /**
   * Get components by business unit
   * @param businessUnit The business unit to filter by
   * @returns Array of components in the business unit
   */
  const getComponentsByBusinessUnit = (businessUnit: string): ProductBoardComponent[] => {
    return components.filter(component => component.business_unit === businessUnit);
  };
  
  /**
   * Get components by product code
   * @param productCode The product code to filter by
   * @returns Array of components with the product code
   */
  const getComponentsByProductCode = (productCode: string): ProductBoardComponent[] => {
    return components.filter(component => component.product_code === productCode);
  };
  
  return {
    components,
    isLoading,
    error,
    fetchComponents,
    getComponentById,
    getComponentByName,
    getComponentsByBusinessUnit,
    getComponentsByProductCode
  };
}

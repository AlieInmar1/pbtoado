import { supabase } from '../supabase';
import { queryClient } from './reactQuery';

// Type definitions
export interface Feature {
  id: string;
  productboard_id: string;
  name: string;
  description: string | null;
  status: string | null;
  type: 'feature' | 'sub-feature';
  feature_type?: string; // Added field from database
  parent_id?: string;
  metadata: any;
  workspace_id?: string | null;
  // Add other fields as needed
}

/**
 * Fetch all features and subfeatures from Supabase
 * @returns Promise<Feature[]> Array of features and subfeatures
 */
export async function fetchFeatures(): Promise<Feature[]> {
  console.log('Fetching features from Supabase...');
  
  try {
    // First check if the table exists and has data
    const { count, error: countError } = await supabase
      .from('productboard_features')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error checking features table:', countError);
      console.error('Error code:', countError.code);
      console.error('Error message:', countError.message);
      console.error('Error details:', countError.details);
      
      // Try a different approach to check if the table exists
      console.log('Attempting to check if table exists...');
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: 'productboard_features' });
        
      if (tableError) {
        console.error('Error checking if table exists:', tableError);
      } else {
        console.log('Table exists check result:', tableExists);
      }
    } else {
      console.log('Features table count:', count);
    }
    
    // Now fetch the actual data
    const { data, error } = await supabase
      .from('productboard_features')
      .select('*');
      
    if (error) {
      console.error('Error fetching features:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('No features found in the database. The table might be empty.');
    } else {
      console.log('Features fetched successfully:', data.length, 'features found');
      console.log('Sample feature data:', data[0]);
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception in fetchFeatures:', err);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
}

/**
 * Trigger sync process for ProductBoard data
 * This is a placeholder implementation - the actual implementation will depend on your backend setup
 * @returns Promise<{ success: boolean; message: string }> Result of the sync operation
 */
export async function syncProductBoardData(): Promise<{ success: boolean; message: string }> {
  try {
    // This is a placeholder implementation
    // In a real implementation, you would call your backend API to trigger the sync
    
    // Example implementation using fetch:
    // const response = await fetch('/api/sync-productboard', {
    //   method: 'POST',
    // });
    // const result = await response.json();
    
    // For now, we'll just simulate a successful sync
    // Wait for 2 seconds to simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Invalidate the features query to refetch data
    queryClient.invalidateQueries({ queryKey: ['features'] });
    
    return {
      success: true,
      message: 'ProductBoard data synced successfully'
    };
  } catch (error) {
    console.error('Error syncing ProductBoard data:', error);
    return {
      success: false,
      message: 'Failed to sync ProductBoard data'
    };
  }
}

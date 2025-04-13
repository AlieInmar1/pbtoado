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
    const { data, error } = await supabase
      .from('productboard_features')
      .select('*');
      
    if (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
    
    console.log('Features fetched successfully:', data?.length || 0, 'features found');
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

import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ProductBoardFeature, StoryWithChildren } from '../types/productboard';

// ProductBoard API endpoints
const PB_API_BASE_URL = 'https://api.productboard.com/v1';

// Define ProductBoard API response types
interface ProductBoardResponse<T> {
  data: T;
  included?: any[];
  meta?: {
    next?: string;
    total?: number;
  };
}

/**
 * Fetch ProductBoard features with token-based authentication
 * @param token User or shared ProductBoard authentication token
 * @param boardId ProductBoard board ID to fetch from
 * @returns Promise with array of ProductBoard features
 */
export async function fetchProductBoardFeaturesWithToken(
  token: string,
  boardId: string
): Promise<ProductBoardFeature[]> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    };

    // First, get features from the board
    const response = await fetch(`${PB_API_BASE_URL}/boards/${boardId}/features`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch features: ${response.statusText}`);
    }

    const result: ProductBoardResponse<ProductBoardFeature[]> = await response.json();
    const features = result.data || [];
    
    // Process features to add additional metadata and parent relationships
    const processedFeatures = await processFeatures(features, token);
    
    return processedFeatures;
  } catch (error) {
    console.error('Error fetching ProductBoard features:', error);
    throw error;
  }
}

/**
 * Process features to enrich with additional data
 */
async function processFeatures(
  features: ProductBoardFeature[],
  token: string
): Promise<ProductBoardFeature[]> {
  return Promise.all(
    features.map(async (feature) => {
      try {
        // Enrich with any additional metadata as needed
        if (feature.parent_productboard_id) {
          // Additional API call could be made here to get parent details if needed
        }
        
        // For compatibility with existing UI components
        const enhancedFeature: ProductBoardFeature = {
          ...feature,
          level: determineFeatureLevel(feature),
          pb_title: feature.name,
          status: feature.status_name || 'Not set',
          // Other mapped fields
        };
        
        return enhancedFeature;
      } catch (error) {
        console.error(`Error processing feature ${feature.id}:`, error);
        return feature;
      }
    })
  );
}

/**
 * Determine feature level based on its type and position in hierarchy
 */
function determineFeatureLevel(feature: ProductBoardFeature): string {
  if (feature.feature_type === 'objective') {
    return 'epic';
  } else if (feature.feature_type === 'initiative') {
    return 'feature';
  }
  return 'story';
}

/**
 * Build hierarchy tree from flat features list
 */
export function buildFeatureHierarchy(features: ProductBoardFeature[]): StoryWithChildren[] {
  // Create map for quick lookup
  const featureMap = new Map<string, StoryWithChildren>();
  
  // Initialize each feature with empty children array
  features.forEach(feature => {
    featureMap.set(feature.productboard_id, {
      ...feature,
      children: [],
      expanded: false
    });
  });
  
  // Build relationships
  const topLevel: StoryWithChildren[] = [];
  
  features.forEach(feature => {
    const featureWithChildren = featureMap.get(feature.productboard_id);
    
    if (featureWithChildren) {
      if (feature.parent_productboard_id) {
        const parent = featureMap.get(feature.parent_productboard_id);
        if (parent && parent.children) {
          parent.children.push(featureWithChildren);
        }
      } else {
        topLevel.push(featureWithChildren);
      }
    }
  });
  
  return topLevel;
}

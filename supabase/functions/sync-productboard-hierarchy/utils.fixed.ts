// utils.ts - Utility functions for ProductBoard hierarchy sync

import { RelationshipMap, EntityMap } from "./types.ts";
// No external imports to fix in this file

/**
 * Helper function to make internal API calls with proper error handling and logging
 */
export async function callInternalApi(
  apiName: string,
  params: Record<string, any>,
  logErrors = true
): Promise<any> {
  const baseUrl = Deno.env.get("SUPABASE_URL") || "";
  // Use the public anon key instead of service role key for function-to-function calls
  const apiKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  if (logErrors) {
    console.log(`Calling internal API: ${apiName} with params:`, JSON.stringify(params));
  }

  try {
    // Log useful information for debugging
    console.log(`Making request to ${baseUrl}/functions/v1/${apiName}`);
    console.log(`Using SUPABASE_URL: ${baseUrl}`);
    console.log(`Using API key starting with: ${apiKey.substring(0, 10)}...`);
    
    const response = await fetch(`${baseUrl}/functions/v1/${apiName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Response status: ${response.status}`);
      console.error(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
      console.error(`Response body: ${errorText}`);
      throw new Error(`Error calling ${apiName}: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (logErrors) {
      console.error(`Error calling internal API ${apiName}:`, error);
    }
    throw error;
  }
}

/**
 * Resilient API call wrapper for handling expected 404 errors gracefully
 */
export async function resilientApiCall<T>(
  callFunction: () => Promise<T>,
  entityType: string,
  entityId: string
): Promise<T | null> {
  try {
    return await callFunction();
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`${entityType} with ID ${entityId} not found, continuing...`);
      return null;
    }
    // For other errors, log but don't fail the entire operation
    console.error(`Error fetching ${entityType} ${entityId}:`, error);
    return null;
  }
}

/**
 * Helper function to add a relationship to a relationship map
 */
export function addToRelationshipMap(map: RelationshipMap, sourceId: string, targetId: string): void {
  if (!map[sourceId]) {
    map[sourceId] = [];
  }
  if (!map[sourceId].includes(targetId)) {
    map[sourceId].push(targetId);
  }
}

/**
 * Helper function to create a feature hierarchy map for tracking parent-child relationships
 */
export function createFeatureHierarchyMap(features: any[]): EntityMap<any> {
  const featureMap: EntityMap<any> = {};
  
  // First, add all features to the map
  for (const feature of features) {
    featureMap[feature.id] = { ...feature, subFeatures: [] };
  }
  
  // Then, establish the parent-child relationships
  for (const feature of features) {
    if (feature.parent_id && featureMap[feature.parent_id]) {
      featureMap[feature.parent_id].subFeatures.push(feature.id);
    }
  }
  
  return featureMap;
}

/**
 * Helper function to clean object for metadata storage
 * Removes fields that are already stored in dedicated columns
 */
export function cleanMetadata(obj: any): Record<string, any> {
  // Create a copy of the object
  const metadata = { ...obj };
  
  // Remove fields that are already stored in dedicated columns
  const fieldsToRemove = [
    'id', 'name', 'description', 'status', 'targetStart', 'targetEnd',
    'owner', 'product_id', 'component_id', 'parent_id', 'product', 'components',
    'initiative_ids', 'subFeatures'
  ];
  
  for (const field of fieldsToRemove) {
    delete metadata[field];
  }
  
  return metadata;
}

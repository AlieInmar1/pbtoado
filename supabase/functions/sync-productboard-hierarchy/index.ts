// consolidated-index.ts - Complete ProductBoard hierarchy sync function
// Combines functionality from all modular files for easier deployment

// Use import map for cleaner imports that are URL-resolved via the import map
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { z } from "https://esm.sh/zod@3.22.4";
import axios from "https://esm.sh/axios@1.6.2";

// ============================================================================
// Types and Interfaces
// ============================================================================

// Request schema validation
const RequestSchema = z.object({
  workspace_id: z.string().uuid(),
  api_key: z.string().min(1),
  product_id: z.string().optional(),
  initiative_id: z.string().optional(),
  include_features: z.boolean().default(true),
  include_components: z.boolean().default(true),
  include_initiatives: z.boolean().default(true),
  max_depth: z.number().min(1).max(10).default(5),
});

type RequestType = z.infer<typeof RequestSchema>;

// Maps for storing entity relationships
interface EntityMap<T> {
  [id: string]: T;
}

interface RelationshipMap {
  [sourceId: string]: string[];
}

// Interface for entity references
interface EntityReference {
  id: string;
  productboard_id: string;
  type: 'product' | 'initiative' | 'feature' | 'component';
}

// Interface for sync results
interface SyncResults {
  products: number;
  components: number;
  features: number;
  subFeatures: number;
  initiatives: number;
  initiativeFeatures: number;
  componentFeatures: number;
  errors: string[];
}

// Interface for storing ID mappings
interface IdMaps {
  products: Record<string, string>;
  initiatives: Record<string, string>;
  components: Record<string, string>;
  features: Record<string, string>;
}

// Interface for relationship maps
interface RelationshipMaps {
  productFeatures: RelationshipMap;
  productComponents: RelationshipMap;
  initiativeFeatures: RelationshipMap;
  initiativeComponents: RelationshipMap;
  featureComponents: RelationshipMap;
  componentFeatures: RelationshipMap;
  featureSubFeatures: RelationshipMap;
  featureParents: RelationshipMap;
}

// Interface for collected entities
interface CollectedEntities {
  products: any[];
  initiatives: any[];
  components: any[];
  features: any[];
  results: SyncResults;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper function to make internal API calls with proper error handling and logging
 */
async function callInternalApi(
  apiName: string,
  params: Record<string, any>,
  logErrors = true
): Promise<any> {
  const baseUrl = Deno.env.get("SUPABASE_URL") || "";
  const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (logErrors) {
    console.log(`Calling internal API: ${apiName} with params:`, JSON.stringify(params));
  }

  try {
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
async function resilientApiCall<T>(
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
function addToRelationshipMap(map: RelationshipMap, sourceId: string, targetId: string): void {
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
function createFeatureHierarchyMap(features: any[]): EntityMap<any> {
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
function cleanMetadata(obj: any): Record<string, any> {
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

// ============================================================================
// API Functions
// ============================================================================

/**
 * Function to fetch products from ProductBoard
 */
async function fetchAllProducts(api_key: string, product_id?: string): Promise<any[]> {
  try {
    if (product_id) {
      // If specific product ID provided, just get that one
      const response = await callInternalApi("get-productboard-products", {
        api_key,
        product_id,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch product: ${response.error}`);
      }

      return [response.data];
    } else {
      // Get all products
      const response = await callInternalApi("get-productboard-products", {
        api_key,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch products: ${response.error}`);
      }

      return response.data.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Function to fetch all components (without filtering by product)
 */
async function fetchAllComponents(api_key: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-components", {
      api_key,
    }, false); // Don't log errors here as 404 is expected in some configurations

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log('No components found in ProductBoard, continuing...');
        return [];
      }
      throw new Error(`Failed to fetch components: ${response.error}`);
    }

    return response.data.data.data || [];
  } catch (error) {
    // Check if this is a 404 error, which is expected in some ProductBoard configurations
    if (error.message && error.message.includes('404')) {
      console.log('No components found in ProductBoard, continuing...');
      return [];
    }
    console.error("Error fetching components:", error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch all initiatives (no filtering)
 */
async function fetchAllInitiatives(api_key: string, initiative_id?: string): Promise<any[]> {
  try {
    if (initiative_id) {
      // If specific initiative ID provided, just get that one
      const response = await callInternalApi("get-productboard-initiatives", {
        api_key,
        initiative_id,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch initiative: ${response.error}`);
      }

      return [response.data];
    } else {
      // Get all initiatives
      const response = await callInternalApi("get-productboard-initiatives", {
        api_key,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch initiatives: ${response.error}`);
      }

      return response.data.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    throw error;
  }
}

/**
 * Function to fetch features for specific component
 */
async function fetchComponentFeatures(api_key: string, component_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-features", {
      api_key,
      component_id,
    }, false); // Don't log errors here as we expect some 404s

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No features found for component ${component_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch component features: ${response.error}`);
    }

    return response.data.data.data || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No features found for component ${component_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching features for component ${component_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch features linked to an initiative
 */
async function fetchInitiativeFeatures(api_key: string, initiative_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-initiative-features", {
      api_key,
      initiative_id,
    }, false); // Don't log errors here as we expect some 404s

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No features found for initiative ${initiative_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch initiative features: ${response.error}`);
    }

    return response.data.data.data?.features || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No features found for initiative ${initiative_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching features for initiative ${initiative_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch sub-features for a parent feature
 */
async function fetchSubFeatures(api_key: string, parent_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-features", {
      api_key,
      parent_id,
    }, false); // Don't log errors for not found

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No sub-features found for parent ${parent_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch sub-features: ${response.error}`);
    }

    return response.data.data.data || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No sub-features found for parent ${parent_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching sub-features for parent ${parent_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Main data collection function - collect all entities
 */
async function collectAllEntities(
  api_key: string,
  product_id?: string,
  initiative_id?: string,
  include_features = true,
  include_components = true,
  include_initiatives = true
): Promise<CollectedEntities> {
  const results: SyncResults = {
    products: 0,
    components: 0,
    features: 0,
    subFeatures: 0,
    initiatives: 0,
    initiativeFeatures: 0,
    componentFeatures: 0,
    errors: [],
  };

  // 1. Fetch all products (or specific product if ID provided)
  console.log("Fetching products...");
  const products = await fetchAllProducts(api_key, product_id);
  results.products = products.length;
  console.log(`Fetched ${products.length} products`);
  
  // 2. Initialize empty arrays for other entity types
  let initiatives: any[] = [];
  let components: any[] = [];
  let features: any[] = [];

  // 3. Fetch initiatives if included (direct fetch, not through products)
  if (include_initiatives) {
    console.log("Fetching initiatives...");
    initiatives = await fetchAllInitiatives(api_key, initiative_id);
    results.initiatives = initiatives.length;
    console.log(`Fetched ${initiatives.length} initiatives`);
  }

  // 4. Fetch components if included (direct fetch, not through products)
  if (include_components) {
    console.log("Fetching components...");
    components = await fetchAllComponents(api_key);
    results.components = components.length;
    console.log(`Fetched ${components.length} components`);
  }

  // 5. Collect features from multiple sources if included
  if (include_features) {
    console.log("Collecting features from multiple sources...");
    const allFeaturesMap: Record<string, any> = {};
    
    // 5a. Collect features from initiatives
    if (include_initiatives) {
      for (const initiative of initiatives) {
        console.log(`Fetching features for initiative ${initiative.id}...`);
        const initiativeFeatures = await fetchInitiativeFeatures(api_key, initiative.id);
        results.initiativeFeatures += initiativeFeatures.length;
        
        // Add to our collection if we don't have them yet
        for (const feature of initiativeFeatures) {
          if (!allFeaturesMap[feature.id]) {
            allFeaturesMap[feature.id] = { 
              ...feature, 
              initiative_ids: [initiative.id],
            };
          } else {
            // Update existing feature to include this initiative
            if (!allFeaturesMap[feature.id].initiative_ids) {
              allFeaturesMap[feature.id].initiative_ids = [];
            }
            allFeaturesMap[feature.id].initiative_ids.push(initiative.id);
          }
        }
      }
      console.log(`Collected ${results.initiativeFeatures} features from initiatives`);
    }
    
    // 5b. Collect features from components
    if (include_components) {
      for (const component of components) {
        console.log(`Fetching features for component ${component.id}...`);
        const componentFeatures = await fetchComponentFeatures(api_key, component.id);
        results.componentFeatures += componentFeatures.length;
        
        // Add to our collection if we don't have them yet
        for (const feature of componentFeatures) {
          if (!allFeaturesMap[feature.id]) {
            allFeaturesMap[feature.id] = { 
              ...feature, 
              component_id: component.id,
            };
          } else {
            // Update existing feature with component info
            allFeaturesMap[feature.id].component_id = component.id;
          }
        }
      }
      console.log(`Collected ${results.componentFeatures} features from components`);
    }
    
    // 5c. Get sub-features for all features we've collected
    console.log("Collecting sub-features...");
    const featureIds = Object.keys(allFeaturesMap);
    for (const featureId of featureIds) {
      const subFeatures = await fetchSubFeatures(api_key, featureId);
      results.subFeatures += subFeatures.length;
      
      // Add to our collection if we don't have them yet
      for (const subFeature of subFeatures) {
        if (!allFeaturesMap[subFeature.id]) {
          allFeaturesMap[subFeature.id] = { 
            ...subFeature, 
            parent_id: featureId,
          };
        } else {
          // Update existing feature with parent info
          allFeaturesMap[subFeature.id].parent_id = featureId;
        }
      }
    }
    console.log(`Collected ${results.subFeatures} sub-features`);
    
    // Convert the map to an array for processing
    features = Object.values(allFeaturesMap);
    results.features = features.length;
    console.log(`Total unique features collected: ${features.length}`);
  }

  return {
    products,
    initiatives,
    components,
    features,
    results,
  };
}

// ============================================================================
// Relationship Functions
// ============================================================================

/**
 * Builds all relationships between entities
 * This function creates comprehensive relationship maps between all entity types
 */
function buildRelationships(
  products: any[],
  initiatives: any[],
  components: any[],
  features: any[]
): RelationshipMaps {
  console.log("Building relationships between all entities...");
  
  // Initialize relationship maps
  const productFeatures: RelationshipMap = {};
  const productComponents: RelationshipMap = {};
  const initiativeFeatures: RelationshipMap = {};
  const initiativeComponents: RelationshipMap = {};
  const featureComponents: RelationshipMap = {};
  const componentFeatures: RelationshipMap = {};
  const featureSubFeatures: RelationshipMap = {};
  const featureParents: RelationshipMap = {};
  
  // 1. Build direct relationships from features
  for (const feature of features) {
    // Feature to product relationship
    if (feature.product?.id) {
      addToRelationshipMap(productFeatures, feature.product.id, feature.id);
    }
    
    // Feature to initiative relationships
    if (feature.initiative_ids) {
      for (const initiativeId of feature.initiative_ids) {
        addToRelationshipMap(initiativeFeatures, initiativeId, feature.id);
      }
    }
    
    // Feature to component relationship
    if (feature.component_id) {
      addToRelationshipMap(featureComponents, feature.id, feature.component_id);
      addToRelationshipMap(componentFeatures, feature.component_id, feature.id);
    }
    
    // Feature parent-child relationships
    if (feature.parent_id) {
      addToRelationshipMap(featureSubFeatures, feature.parent_id, feature.id);
      addToRelationshipMap(featureParents, feature.id, feature.parent_id);
    }
  }
  
  // 2. Build component to product relationships (through features)
  for (const productId in productFeatures) {
    for (const featureId of productFeatures[productId]) {
      const feature = features.find(f => f.id === featureId);
      if (feature && feature.component_id) {
        addToRelationshipMap(productComponents, productId, feature.component_id);
      }
    }
  }
  
  // 3. Build initiative to component relationships (through features)
  for (const initiativeId in initiativeFeatures) {
    for (const featureId of initiativeFeatures[initiativeId]) {
      const feature = features.find(f => f.id === featureId);
      if (feature && feature.component_id) {
        addToRelationshipMap(initiativeComponents, initiativeId, feature.component_id);
      }
    }
  }

  console.log("Finished building all relationships");
  
  return {
    productFeatures,
    productComponents,
    initiativeFeatures,
    initiativeComponents,
    featureComponents,
    componentFeatures,
    featureSubFeatures,
    featureParents,
  };
}

/**
 * Get a count of all relationships to help with status reporting
 */
function countRelationships(relationships: RelationshipMaps): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Count relationships in each map
  for (const [mapName, map] of Object.entries(relationships)) {
    let count = 0;
    for (const sourceId in map) {
      count += map[sourceId].length;
    }
    counts[mapName] = count;
  }
  
  return counts;
}

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Create a new sync history record with 'in_progress' status
 */
async function createSyncHistoryRecord(workspace_id: string): Promise<string> {
  console.log("Creating new sync history record");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase
      .from("productboard_hierarchy_sync_history")
      .insert({
        workspace_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating sync history record:", error);
      return "unknown";
    }
    
    return data.id;
  } catch (error) {
    console.error("Error creating sync history record:", error);
    return "unknown";
  }
}

/**
 * Update the sync history record with the final status
 */
async function updateSyncHistory(
  syncHistoryId: string,
  status: 'completed' | 'failed',
  results: {
    products_count: number;
    components_count: number;
    features_count: number;
    initiatives_count: number;
    relationships_count?: number;
  },
  errorMessage?: string
): Promise<void> {
  console.log(`Updating sync history record ${syncHistoryId} with status: ${status}`);
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { error } = await supabase
      .from("productboard_hierarchy_sync_history")
      .update({
        status,
        completed_at: new Date().toISOString(),
        products_count: results.products_count,
        components_count: results.components_count,
        features_count: results.features_count,
        initiatives_count: results.initiatives_count,
        relationships_count: results.relationships_count || 0,
        error_message: errorMessage,
      })
      .eq("id", syncHistoryId);
      
    if (error) {
      console.error("Error updating sync history:", error);
    }
  } catch (error) {
    console.error("Error updating sync history:", error);
  }
}

/**
 * Store all collected data in the database
 */
async function storeData(
  workspace_id: string,
  products: any[],
  initiatives: any[],
  components: any[],
  features: any[],
  relationships: RelationshipMaps
): Promise<{
  idMaps: IdMaps;
}> {
  console.log("Storing all data in the database...");
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Maps to store ProductBoard ID to database ID mappings
  const idMaps: IdMaps = {
    products: {},
    initiatives: {},
    components: {},
    features: {},
  };

  // 1. Store products
  console.log("Storing products...");
  for (const product of products) {
    try {
      const { data: insertedProduct, error } = await supabase
        .from("productboard_products_extended")
        .upsert({
          productboard_id: product.id,
          name: product.name,
          description: product.description || null,
          status: product.status || null,
          metadata: cleanMetadata(product),
          workspace_id,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error storing product ${product.id}:`, error);
      } else if (insertedProduct) {
        idMaps.products[product.id] = insertedProduct.id;
      }
    } catch (error) {
      console.error(`Error storing product ${product.id}:`, error);
    }
  }
  console.log(`Stored ${Object.keys(idMaps.products).length} products`);

  // 2. Store initiatives
  console.log("Storing initiatives...");
  for (const initiative of initiatives) {
    try {
      // Try to determine the product_id from initiative data
      const productId = initiative.product?.id || initiative.productId || null;
      
      const { data: insertedInitiative, error } = await supabase
        .from("productboard_initiatives_extended")
        .upsert({
          productboard_id: initiative.id,
          name: initiative.name,
          description: initiative.description || null,
          status: initiative.status || null,
          timeframe: initiative.timeframe || null,
          owner: initiative.owner || null,
          metadata: cleanMetadata(initiative),
          workspace_id,
          product_id: productId ? idMaps.products[productId] : null,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error storing initiative ${initiative.id}:`, error);
      } else if (insertedInitiative) {
        idMaps.initiatives[initiative.id] = insertedInitiative.id;
      }
    } catch (error) {
      console.error(`Error storing initiative ${initiative.id}:`, error);
    }
  }
  console.log(`Stored ${Object.keys(idMaps.initiatives).length} initiatives`);

  // 3. Store components
  console.log("Storing components...");
  for (const component of components) {
    try {
      const { data: insertedComponent, error } = await supabase
        .from("productboard_components_extended")
        .upsert({
          productboard_id: component.id,
          name: component.name,
          description: component.description || null,
          status: component.status || null,
          metadata: cleanMetadata(component),
          workspace_id,
          // We don't have product_id at this point, will update later based on relationships
          product_id: null,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error storing component ${component.id}:`, error);
      } else if (insertedComponent) {
        idMaps.components[component.id] = insertedComponent.id;
      }
    } catch (error) {
      console.error(`Error storing component ${component.id}:`, error);
    }
  }
  console.log(`Stored ${Object.keys(idMaps.components).length} components`);

  // 4. Store features (first pass - without parent relationships)
  console.log("Storing features (first pass)...");
  for (const feature of features) {
    try {
      const componentId = feature.component_id ? idMaps.components[feature.component_id] : null;
      
      const { data: insertedFeature, error } = await supabase
        .from("productboard_features_extended")
        .upsert({
          productboard_id: feature.id,
          name: feature.name,
          description: feature.description || null,
          status: feature.status || null,
          target_start_date: feature.targetStart || null,
          target_end_date: feature.targetEnd || null,
          owner: feature.owner || null,
          metadata: cleanMetadata(feature),
          workspace_id,
          component_id: componentId,
          parent_id: null, // Will be updated in second pass
        })
        .select()
        .single();

      if (error) {
        console.error(`Error storing feature ${feature.id}:`, error);
      } else if (insertedFeature) {
        idMaps.features[feature.id] = insertedFeature.id;
      }
    } catch (error) {
      console.error(`Error storing feature ${feature.id}:`, error);
    }
  }
  console.log(`Stored ${Object.keys(idMaps.features).length} features`);

  // 5. Update feature parent relationships (second pass)
  console.log("Updating feature parent relationships...");
  for (const feature of features) {
    if (feature.parent_id && idMaps.features[feature.parent_id]) {
      try {
        const { error } = await supabase
          .from("productboard_features_extended")
          .update({
            parent_id: idMaps.features[feature.parent_id],
          })
          .eq("productboard_id", feature.id);

        if (error) {
          console.error(`Error updating parent for feature ${feature.id}:`, error);
        }
      } catch (error) {
        console.error(`Error updating parent for feature ${feature.id}:`, error);
      }
    }
  }
  console.log("Updated feature parent relationships");

// 6. Store initiative-feature relationships
console.log("Storing initiative-feature relationships...");
const { initiativeFeatures } = relationships;
let initiativeFeatureCount = 0;

for (const [initiativeId, featureIds] of Object.entries(initiativeFeatures)) {
  if (idMaps.initiatives[initiativeId]) {
    for (const featureId of featureIds) {
      if (idMaps.features[featureId]) {
        try {
          const { error } = await supabase
            .from("productboard_initiative_features_extended")
            .upsert({
              initiative_id: idMaps.initiatives[initiativeId],
              feature_id: idMaps.features[featureId],
              workspace_id,
            });

          if (error) {
            console.error(`Error storing initiative-feature link ${initiativeId}-${featureId}:`, error);
          } else {
            initiativeFeatureCount++;
          }
        } catch (error) {
          console.error(`Error storing initiative-feature link ${initiativeId}-${featureId}:`, error);
        }
      }
    }
  }
}
console.log(`Stored ${initiativeFeatureCount} initiative-feature relationships`);

// 7. Store component-initiative relationships
console.log("Storing component-initiative relationships...");
const { initiativeComponents } = relationships;
let initiativeComponentCount = 0;

for (const [initiativeId, componentIds] of Object.entries(initiativeComponents)) {
  if (idMaps.initiatives[initiativeId]) {
    for (const componentId of componentIds) {
      if (idMaps.components[componentId]) {
        try {
          const { error } = await supabase
            .from("productboard_component_initiatives_extended")
            .upsert({
              component_id: idMaps.components[componentId],
              initiative_id: idMaps.initiatives[initiativeId],
              direct_link: false, // These are inferred, not direct
              link_via_feature: null, // We don't know which feature specifically
              workspace_id,
            });

          if (error && error.code !== "23505") { // Ignore unique constraint violations
            console.error(`Error storing component-initiative link ${componentId}-${initiativeId}:`, error);
          } else {
            initiativeComponentCount++;
          }
        } catch (error) {
          console.error(`Error storing component-initiative link ${componentId}-${initiativeId}:`, error);
        }
      }
    }
  }
}
console.log(`Stored ${initiativeComponentCount} component-initiative relationships`);

console.log("Finished storing all data");

return { idMaps };
}

// ============================================================================
// Main Handler Function
// ============================================================================

// Main handler function for HTTP requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Verify it's a POST request
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  let syncHistoryId = "";

  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedParams = RequestSchema.parse(body);
    const { 
      workspace_id, 
      api_key, 
      product_id, 
      initiative_id,
      include_features,
      include_components,
      include_initiatives,
      max_depth 
    } = validatedParams;

    console.log("Starting ProductBoard hierarchy sync");
    console.log("Request parameters:", JSON.stringify({
      workspace_id,
      product_id: product_id || "all",
      initiative_id: initiative_id || "all",
      include_features,
      include_components,
      include_initiatives,
      max_depth
    }));

    // Create sync history record
    syncHistoryId = await createSyncHistoryRecord(workspace_id);
    console.log(`Created sync history record: ${syncHistoryId}`);

    // Step 1: Collect entities
    console.log("Step 1: Collecting entities from ProductBoard");
    const { 
      products, 
      initiatives, 
      components, 
      features, 
      results 
    } = await collectAllEntities(
      api_key,
      product_id,
      initiative_id,
      include_features,
      include_components,
      include_initiatives
    );

    // Step 2: Build relationships
    console.log("Step 2: Building relationships between entities");
    const relationships = buildRelationships(
      products,
      initiatives,
      components,
      features
    );
    
    // Count relationships for reporting
    const relationshipCounts = countRelationships(relationships);
    const totalRelationships = Object.values(relationshipCounts).reduce((sum, count) => sum + count, 0);

    // Step 3: Store data
    console.log("Step 3: Storing data in the database");
    const { idMaps } = await storeData(
      workspace_id,
      products,
      initiatives,
      components,
      features,
      relationships
    );

    // Step 4: Update sync history
    console.log("Step 4: Updating sync history record");
    await updateSyncHistory(
      syncHistoryId, 
      "completed", 
      {
        products_count: products.length,
        components_count: components.length,
        features_count: features.length,
        initiatives_count: initiatives.length,
        relationships_count: totalRelationships
      }
    );

    // Return success response with summary
    return new Response(
      JSON.stringify({
        success: true,
        message: "ProductBoard hierarchy sync completed successfully",
        syncHistoryId,
        results: {
          products: products.length,
          initiatives: initiatives.length,
          components: components.length,
          features: features.length,
          subFeatures: results.subFeatures,
          initiativeFeatures: results.initiativeFeatures,
          componentFeatures: results.componentFeatures,
          relationships: totalRelationships,
        },
        relationshipCounts
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in ProductBoard hierarchy sync:", error);
    
    // If we have a sync history record, update it to failed
    if (syncHistoryId) {
      try {
        await updateSyncHistory(
          syncHistoryId, 
          "failed", 
          {
            products_count: 0,
            components_count: 0,
            features_count: 0,
            initiatives_count: 0,
          },
          error.message || "Unknown error"
        );
      } catch (updateError) {
        console.error("Error updating sync history:", updateError);
      }
    }
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
        details: error.stack || null,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

// api.ts - API functions for interacting with ProductBoard API

import { callInternalApi } from "./utils.ts";
import { SyncResults } from "./types.ts";

/**
 * Function to fetch products from ProductBoard
 */
export async function fetchAllProducts(api_key: string, product_id?: string): Promise<any[]> {
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

      return response.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Function to fetch all components (without filtering by product)
 */
export async function fetchAllComponents(api_key: string): Promise<any[]> {
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

    return response.data.data || [];
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
export async function fetchAllInitiatives(api_key: string, initiative_id?: string): Promise<any[]> {
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

      return response.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    throw error;
  }
}

/**
 * Function to fetch features for specific component
 */
export async function fetchComponentFeatures(api_key: string, component_id: string): Promise<any[]> {
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

    return response.data.data || [];
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
export async function fetchInitiativeFeatures(api_key: string, initiative_id: string): Promise<any[]> {
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

    return response.data.data?.features || [];
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
export async function fetchSubFeatures(api_key: string, parent_id: string): Promise<any[]> {
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

    return response.data.data || [];
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
 * Main data collection function - collects all entities
 */
export async function collectAllEntities(
  api_key: string,
  product_id?: string,
  initiative_id?: string,
  include_features = true,
  include_components = true,
  include_initiatives = true
): Promise<{
  products: any[];
  initiatives: any[];
  components: any[];
  features: any[];
  results: SyncResults;
}> {
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

// storage.ts - Functions for storing data in the database

import { createClient } from "@supabase/supabase-js";
import { IdMaps, RelationshipMaps } from "./types.ts";
import { cleanMetadata } from "./utils.ts";

/**
 * Store all collected data in the database
 */
export async function storeData(
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

/**
 * Update the sync history record with the final status
 */
export async function updateSyncHistory(
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
 * Create a new sync history record with 'in_progress' status
 */
export async function createSyncHistoryRecord(workspace_id: string): Promise<string> {
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

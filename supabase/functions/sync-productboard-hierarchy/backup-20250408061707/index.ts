// index.ts - Main entry point for the ProductBoard hierarchy sync function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { RequestSchema, corsHeaders } from "./types.ts";
import { collectAllEntities } from "./api.ts";
import { buildRelationships, countRelationships } from "./relationships.ts";
import { storeData, createSyncHistoryRecord, updateSyncHistory } from "./storage.ts";

// Main handler function
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

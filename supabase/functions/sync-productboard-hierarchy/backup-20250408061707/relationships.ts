// relationships.ts - Functions for building relationships between ProductBoard entities

import { RelationshipMap, RelationshipMaps } from "./types.ts";
import { addToRelationshipMap } from "./utils.ts";

/**
 * Builds all relationships between entities
 * This function creates comprehensive relationship maps between all entity types
 */
export function buildRelationships(
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
export function countRelationships(relationships: RelationshipMaps): Record<string, number> {
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

/**
 * Get a list of entity IDs that appear in a relationship map
 */
export function getUniqueEntityIds(relationshipMap: RelationshipMap): string[] {
  const entityIds = new Set<string>();
  
  // Add source IDs
  Object.keys(relationshipMap).forEach(id => entityIds.add(id));
  
  // Add target IDs
  Object.values(relationshipMap).forEach(targets => {
    targets.forEach(id => entityIds.add(id));
  });
  
  return Array.from(entityIds);
}

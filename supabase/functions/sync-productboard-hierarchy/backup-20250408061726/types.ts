// types.ts - Type definitions for ProductBoard hierarchy sync

import { z } from "https://esm.sh/zod@3.22.4";

// Request schema validation
export const RequestSchema = z.object({
  workspace_id: z.string().uuid(),
  api_key: z.string().min(1),
  product_id: z.string().optional(),
  initiative_id: z.string().optional(),
  include_features: z.boolean().default(true),
  include_components: z.boolean().default(true),
  include_initiatives: z.boolean().default(true),
  max_depth: z.number().min(1).max(10).default(5),
});

export type RequestType = z.infer<typeof RequestSchema>;

// Maps for storing entity relationships
export interface EntityMap<T> {
  [id: string]: T;
}

export interface RelationshipMap {
  [sourceId: string]: string[];
}

// Interface for entity references
export interface EntityReference {
  id: string;
  productboard_id: string;
  type: 'product' | 'initiative' | 'feature' | 'component';
}

// Interface for sync results
export interface SyncResults {
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
export interface IdMaps {
  products: Record<string, string>;
  initiatives: Record<string, string>;
  components: Record<string, string>;
  features: Record<string, string>;
}

// Interface for relationship maps returned by buildRelationships
export interface RelationshipMaps {
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
export interface CollectedEntities {
  products: any[];
  initiatives: any[];
  components: any[];
  features: any[];
  results: SyncResults;
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
};

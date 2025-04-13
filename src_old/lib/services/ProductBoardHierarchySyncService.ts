import { SupabaseClient } from '@supabase/supabase-js';
// Import specific types from the database file
import { Workspace } from '../../types/database';

// Define types for our new hierarchy tables
// These match the structure defined in the migration
export interface ProductBoardHierarchyTables {
  productboard_products_extended: ProductBoardProductExtended;
  productboard_components_extended: ProductBoardComponentExtended;
  productboard_initiatives_extended: ProductBoardInitiativeExtended;
  productboard_features_extended: ProductBoardFeatureExtended;
  productboard_initiative_features_extended: ProductBoardInitiativeFeatureExtended;
  productboard_component_initiatives_extended: ProductBoardComponentInitiativeExtended;
  productboard_hierarchy_sync_history: ProductBoardHierarchySyncHistory;
}

// Extended product entity
export interface ProductBoardProductExtended {
  id: string;
  productboard_id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// Extended component entity
export interface ProductBoardComponentExtended {
  id: string;
  productboard_id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  product_id?: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// Extended initiative entity
export interface ProductBoardInitiativeExtended {
  id: string;
  productboard_id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  timeframe?: Record<string, any> | null;
  owner?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  product_id?: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// Extended feature entity with hierarchy support
export interface ProductBoardFeatureExtended {
  id: string;
  productboard_id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  target_start_date?: string | null;
  target_end_date?: string | null;
  owner?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  component_id?: string | null;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

// Junction table for initiative-feature links
export interface ProductBoardInitiativeFeatureExtended {
  id: string;
  initiative_id: string;
  feature_id: string;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// Junction table for component-initiative links
export interface ProductBoardComponentInitiativeExtended {
  id: string;
  component_id: string;
  initiative_id: string;
  direct_link: boolean;
  link_via_feature?: string | null;
  metadata?: Record<string, any> | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// Sync history table
export interface ProductBoardHierarchySyncHistory {
  id: string;
  workspace_id: string;
  status: string;
  products_count: number;
  components_count: number;
  features_count: number;
  initiatives_count: number;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncOptions {
  workspaceId: string;
  productboardApiKey: string;
  productId?: string;
  initiativeId?: string;
  includeFeatures?: boolean;
  includeComponents?: boolean;
  includeInitiatives?: boolean;
  maxDepth?: number;
}

export interface SyncResult {
  syncId: string;
  status: 'completed' | 'failed' | 'in_progress';
  productsCount: number;
  componentsCount: number;
  featuresCount: number;
  initiativesCount: number;
  initiativeFeaturesCount: number;
  componentInitiativesCount: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * Service for interacting with the ProductBoard hierarchy sync functionality
 */
export class ProductBoardHierarchySyncService {
  private supabase: SupabaseClient;
  private lastSyncResult: SyncResult | null = null;
  private syncInProgress = false;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Start a sync operation with the given options
   */
  async startSync(options: SyncOptions): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('A sync operation is already in progress');
    }

    this.syncInProgress = true;

    try {
      // Get the supabase URL from the environment variable or use the standard format
      const projectRef = process.env.SUPABASE_PROJECT_REF || 'tqzsfzhcwkhwketcbvoz';
      const supabaseUrl = `https://${projectRef}.supabase.co`;
      
      // Get the auth token
      const { data: { session } } = await this.supabase.auth.getSession();
      const token = session?.access_token || '';
      
      // Using direct fetch instead of supabase.functions.invoke to have more control over headers
      // This approach helps bypass some CORS issues
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-productboard-hierarchy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Add additional headers to help with CORS
          'Accept': 'application/json',
          'X-Client-Info': 'supabase-js/2.x',
          // The following headers sometimes help with CORS issues
          'Origin': window.location.origin,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          workspace_id: options.workspaceId,
          api_key: options.productboardApiKey,
          product_id: options.productId,
          initiative_id: options.initiativeId,
          include_features: options.includeFeatures ?? true,
          include_components: options.includeComponents ?? true,
          include_initiatives: options.includeInitiatives ?? true,
          max_depth: options.maxDepth ?? 5,
        }),
        // Some browsers need these additional options for CORS
        mode: 'cors',
        credentials: 'same-origin',
      });

      // Handle errors
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use text content
          errorMessage = await response.text() || errorMessage;
        }
        
        console.error('Error syncing ProductBoard hierarchy:', errorMessage);
        const failedResult: SyncResult = {
          syncId: 'error',
          status: 'failed',
          productsCount: 0,
          componentsCount: 0,
          featuresCount: 0,
          initiativesCount: 0,
          initiativeFeaturesCount: 0,
          componentInitiativesCount: 0,
          error: errorMessage,
          startedAt: new Date().toISOString(),
        };
        this.lastSyncResult = failedResult;
        return failedResult;
      }

      // Process successful response
      const data = await response.json();

      // Transform the response into our SyncResult format
      const result: SyncResult = {
        syncId: data.data.sync_id,
        status: data.data.status || 'completed',
        productsCount: data.data.products || 0,
        componentsCount: data.data.components || 0, 
        featuresCount: data.data.features || 0,
        initiativesCount: data.data.initiatives || 0,
        initiativeFeaturesCount: data.data.initiativeFeatures || 0,
        componentInitiativesCount: data.data.componentInitiatives || 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      this.lastSyncResult = result;
      return result;
    } catch (error) {
      console.error('Unexpected error during sync:', error);
      const failedResult: SyncResult = {
        syncId: 'error',
        status: 'failed',
        productsCount: 0,
        componentsCount: 0,
        featuresCount: 0,
        initiativesCount: 0,
        initiativeFeaturesCount: 0,
        componentInitiativesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt: new Date().toISOString(),
      };
      this.lastSyncResult = failedResult;
      return failedResult;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get the latest sync results from the database
   */
  async getLatestSyncHistory(workspaceId: string): Promise<SyncResult | null> {
    const { data, error } = await this.supabase
      .from('productboard_hierarchy_sync_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching sync history:', error);
      return this.lastSyncResult;
    }

    // Transform database record to SyncResult
    const result: SyncResult = {
      syncId: data.id,
      status: data.status as 'completed' | 'failed' | 'in_progress',
      productsCount: data.products_count,
      componentsCount: data.components_count,
      featuresCount: data.features_count,
      initiativesCount: data.initiatives_count,
      initiativeFeaturesCount: 0, // Not stored in the history table
      componentInitiativesCount: 0, // Not stored in the history table
      error: data.error_message || undefined,
      startedAt: data.started_at,
      completedAt: data.completed_at || undefined,
    };

    this.lastSyncResult = result;
    return result;
  }

  /**
   * Check if a sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get the result of the last sync operation
   */
  getLastSyncResult(): SyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Get count of items in the hierarchy for the given workspace
   */
  async getHierarchyCounts(workspaceId: string): Promise<{
    products: number;
    components: number;
    features: number;
    initiatives: number;
  }> {
    // Execute parallel queries for better performance
    const [
      productsResult,
      componentsResult, 
      featuresResult,
      initiativesResult
    ] = await Promise.all([
      this.supabase
        .from('productboard_products_extended')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      
      this.supabase
        .from('productboard_components_extended')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      
      this.supabase
        .from('productboard_features_extended')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      
      this.supabase
        .from('productboard_initiatives_extended')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
    ]);

    return {
      products: productsResult.count || 0,
      components: componentsResult.count || 0,
      features: featuresResult.count || 0,
      initiatives: initiativesResult.count || 0,
    };
  }

  /**
   * Sync a specific product and its related data
   */
  async syncProduct(workspaceId: string, productboardApiKey: string, productId: string): Promise<SyncResult> {
    return this.startSync({
      workspaceId,
      productboardApiKey,
      productId,
    });
  }

  /**
   * Sync a specific initiative and its related data
   */
  async syncInitiative(workspaceId: string, productboardApiKey: string, initiativeId: string): Promise<SyncResult> {
    return this.startSync({
      workspaceId,
      productboardApiKey,
      initiativeId,
      includeFeatures: true,
      includeComponents: false,
      includeInitiatives: true,
    });
  }

  /**
   * Delete all hierarchy data for a workspace
   * Use with caution!
   */
  async clearHierarchyData(workspaceId: string): Promise<boolean> {
    try {
      // Delete in order to respect foreign key constraints
      await this.supabase
        .from('productboard_component_initiatives_extended')
        .delete()
        .eq('workspace_id', workspaceId);
      
      await this.supabase
        .from('productboard_initiative_features_extended')
        .delete()
        .eq('workspace_id', workspaceId);
      
      // Delete features first (respecting parent-child hierarchy)
      // Get all features with no children
      let featuresDeleted = 0;
      let totalFeaturesDeleted = 0;
      
      do {
        // Find features with no children
        const { data: leafFeatures } = await this.supabase
          .from('productboard_features_extended')
          .select('id')
          .eq('workspace_id', workspaceId)
          .not('id', 'in', this.supabase
            .from('productboard_features_extended')
            .select('parent_id')
            .eq('workspace_id', workspaceId)
            .not('parent_id', 'is', null)
          );
        
        if (!leafFeatures || leafFeatures.length === 0) {
          break;
        }
        
        // Delete these leaf features
        const leafIds = leafFeatures.map(f => f.id);
        const { error } = await this.supabase
          .from('productboard_features_extended')
          .delete()
          .in('id', leafIds);
        
        if (error) {
          console.error('Error deleting features:', error);
          break;
        }
        
        featuresDeleted = leafIds.length;
        totalFeaturesDeleted += featuresDeleted;
      } while (featuresDeleted > 0);
      
      // Delete remaining tables
      await this.supabase
        .from('productboard_initiatives_extended')
        .delete()
        .eq('workspace_id', workspaceId);
      
      await this.supabase
        .from('productboard_components_extended')
        .delete()
        .eq('workspace_id', workspaceId);
      
      await this.supabase
        .from('productboard_products_extended')
        .delete()
        .eq('workspace_id', workspaceId);
      
      return true;
    } catch (error) {
      console.error('Error clearing hierarchy data:', error);
      return false;
    }
  }
}

import { supabase as defaultSupabase } from '../../lib/supabase';

// Helper function to create a service instance
export function createProductBoardHierarchySyncService(supabase: SupabaseClient = defaultSupabase) {
  return new ProductBoardHierarchySyncService(supabase);
}

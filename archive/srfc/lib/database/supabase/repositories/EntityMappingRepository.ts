import { SupabaseClient } from '@supabase/supabase-js';
import { EntityMapping, RankingHistory, EntitySyncLog } from '../../../../types/database';
import { EntityMappingRepository as EntityMappingRepositoryInterface } from '../../types';

export class SupabaseEntityMappingRepository implements EntityMappingRepositoryInterface {
  constructor(private client: SupabaseClient) {}

  /**
   * Get all entity mappings for a workspace
   * @param workspaceId The workspace ID
   * @returns All entity mappings for the workspace
   */
  async getAll(workspaceId: string): Promise<EntityMapping[]> {
    const { data, error } = await this.client
      .from('entity_mappings')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get an entity mapping by ID
   * @param id The ID of the entity mapping
   * @returns The entity mapping
   */
  async getById(id: string): Promise<EntityMapping | null> {
    const { data, error } = await this.client
      .from('entity_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Create a new entity mapping
   * @param data The entity mapping to create
   * @returns The created entity mapping
   */
  async create(data: Partial<EntityMapping>): Promise<EntityMapping> {
    const { data: mapping, error } = await this.client
      .from('entity_mappings')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return mapping;
  }

  /**
   * Update an entity mapping
   * @param id The ID of the entity mapping
   * @param data The updated entity mapping
   * @returns The updated entity mapping
   */
  async update(id: string, data: Partial<EntityMapping>): Promise<EntityMapping> {
    const { data: mapping, error } = await this.client
      .from('entity_mappings')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapping;
  }

  /**
   * Delete an entity mapping
   * @param id The ID of the entity mapping
   * @returns True if the entity mapping was deleted
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('entity_mappings')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  /**
   * Get an entity mapping by ADO ID
   * @param adoId The ADO ID
   * @returns The entity mapping
   */
  async getByAdoId(adoId: string): Promise<EntityMapping | null> {
    const { data, error } = await this.client
      .from('entity_mappings')
      .select('*')
      .eq('ado_id', adoId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Get an entity mapping by ProductBoard ID
   * @param productboardId The ProductBoard ID
   * @returns The entity mapping
   */
  async getByProductBoardId(productboardId: string): Promise<EntityMapping | null> {
    const { data, error } = await this.client
      .from('entity_mappings')
      .select('*')
      .eq('productboard_id', productboardId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Get all entity mappings with a specific sync status
   * @param status The sync status
   * @returns Entity mappings with the specified sync status
   */
  async getBySyncStatus(status: 'synced' | 'pending' | 'conflict'): Promise<EntityMapping[]> {
    const { data, error } = await this.client
      .from('entity_mappings')
      .select('*')
      .eq('sync_status', status);
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new ranking history
   * @param rankingHistory The ranking history to create
   * @returns The created ranking history
   */
  async createRankingHistory(rankingHistory: Omit<RankingHistory, 'id' | 'created_at'>): Promise<RankingHistory> {
    const { data, error } = await this.client
      .from('ranking_history')
      .insert(rankingHistory)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get a ranking history by ID
   * @param id The ID of the ranking history
   * @returns The ranking history
   */
  async getRankingHistoryById(id: string): Promise<RankingHistory | null> {
    const { data, error } = await this.client
      .from('ranking_history')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Get the latest ranking history for a product
   * @param productId The product ID
   * @param contextType The context type
   * @returns The latest ranking history
   */
  async getLatestRankingHistory(productId: string, contextType: 'feature' | 'story' | 'mixed'): Promise<RankingHistory | null> {
    const { data, error } = await this.client
      .from('ranking_history')
      .select('*')
      .eq('product_id', productId)
      .eq('context_type', contextType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Create a new sync log
   * @param syncLog The sync log to create
   * @returns The created sync log
   */
  async createSyncLog(syncLog: Omit<EntitySyncLog, 'id' | 'created_at'>): Promise<EntitySyncLog> {
    const { data, error } = await this.client
      .from('sync_logs')
      .insert(syncLog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get sync logs for an entity mapping
   * @param entityMappingId The entity mapping ID
   * @returns Sync logs for the entity mapping
   */
  async getSyncLogsForEntityMapping(entityMappingId: string): Promise<EntitySyncLog[]> {
    const { data, error } = await this.client
      .from('sync_logs')
      .select('*')
      .eq('entity_mapping_id', entityMappingId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

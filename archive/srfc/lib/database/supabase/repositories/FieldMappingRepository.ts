import { SupabaseClient } from '@supabase/supabase-js';
import type { FieldMapping } from '../../../types/database';
import type { FieldMappingRepository } from '../../types';

export class SupabaseFieldMappingRepository implements FieldMappingRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<FieldMapping[]> {
    const { data, error } = await this.client
      .from('field_mappings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<FieldMapping | null> {
    const { data, error } = await this.client
      .from('field_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<FieldMapping>): Promise<FieldMapping> {
    const { data: mapping, error } = await this.client
      .from('field_mappings')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return mapping;
  }

  async update(id: string, data: Partial<FieldMapping>): Promise<FieldMapping> {
    const { data: mapping, error } = await this.client
      .from('field_mappings')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapping;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('field_mappings')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getByWorkspace(workspaceId: string): Promise<FieldMapping[]> {
    const { data, error } = await this.client
      .from('field_mappings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async getByType(type: string): Promise<FieldMapping[]> {
    const { data, error } = await this.client
      .from('field_mappings')
      .select('*')
      .eq('mapping_type', type)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }
}
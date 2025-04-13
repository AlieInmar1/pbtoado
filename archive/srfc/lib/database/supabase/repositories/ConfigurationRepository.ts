import { SupabaseClient } from '@supabase/supabase-js';
import type { Configuration } from '../../../types/database';
import type { ConfigurationRepository } from '../../types';

export class SupabaseConfigurationRepository implements ConfigurationRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<Configuration[]> {
    const { data, error } = await this.client
      .from('configurations')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Configuration | null> {
    const { data, error } = await this.client
      .from('configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<Configuration>): Promise<Configuration> {
    const { data: config, error } = await this.client
      .from('configurations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return config;
  }

  async update(id: string, data: Partial<Configuration>): Promise<Configuration> {
    const { data: config, error } = await this.client
      .from('configurations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return config;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('configurations')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getByWorkspace(workspaceId: string): Promise<Configuration | null> {
    const { data, error } = await this.client
      .from('configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  async updateIntegrationSettings(
    workspaceId: string,
    settings: Partial<Configuration>
  ): Promise<void> {
    const { error } = await this.client
      .from('configurations')
      .update(settings)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }
}

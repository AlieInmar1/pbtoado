import { SupabaseClient } from '@supabase/supabase-js';
import type { FeatureFlag } from '../../../types/database';
import type { FeatureFlagRepository } from '../../types';

export class SupabaseFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<FeatureFlag[]> {
    const { data, error } = await this.client
      .from('feature_flags')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<FeatureFlag | null> {
    const { data, error } = await this.client
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const { data: flag, error } = await this.client
      .from('feature_flags')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return flag;
  }

  async update(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const { data: flag, error } = await this.client
      .from('feature_flags')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return flag;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('feature_flags')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  async getEnabled(): Promise<FeatureFlag[]> {
    const { data, error } = await this.client
      .from('feature_flags')
      .select('*')
      .eq('enabled', true)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async toggle(id: string): Promise<void> {
    const { data: flag } = await this.client
      .from('feature_flags')
      .select('enabled')
      .eq('id', id)
      .single();

    if (!flag) throw new Error('Feature flag not found');

    const { error } = await this.client
      .from('feature_flags')
      .update({ enabled: !flag.enabled })
      .eq('id', id);

    if (error) throw error;
  }
}
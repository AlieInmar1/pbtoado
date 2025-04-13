import { SupabaseClient } from '@supabase/supabase-js';
import type { StoryTemplate } from '../../../types/database';
import type { StoryTemplateRepository } from '../../types';

export class SupabaseStoryTemplateRepository implements StoryTemplateRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<StoryTemplate[]> {
    const { data, error } = await this.client
      .from('story_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<StoryTemplate | null> {
    const { data, error } = await this.client
      .from('story_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<StoryTemplate>): Promise<StoryTemplate> {
    const { data: template, error } = await this.client
      .from('story_templates')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  async update(id: string, data: Partial<StoryTemplate>): Promise<StoryTemplate> {
    const { data: template, error } = await this.client
      .from('story_templates')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('story_templates')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getByLevel(level: 'epic' | 'feature' | 'story'): Promise<StoryTemplate[]> {
    const { data, error } = await this.client
      .from('story_templates')
      .select('*')
      .eq('level', level)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }
}
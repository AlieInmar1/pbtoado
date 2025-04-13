import { SupabaseClient } from '@supabase/supabase-js';
import type { AIPrompt } from '../../../types/database';
import type { AIPromptRepository } from '../../types';

export class SupabaseAIPromptRepository implements AIPromptRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<AIPrompt[]> {
    const { data, error } = await this.client
      .from('ai_prompts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<AIPrompt | null> {
    const { data, error } = await this.client
      .from('ai_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<AIPrompt>): Promise<AIPrompt> {
    const { data: prompt, error } = await this.client
      .from('ai_prompts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return prompt;
  }

  async update(id: string, data: Partial<AIPrompt>): Promise<AIPrompt> {
    const { data: prompt, error } = await this.client
      .from('ai_prompts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return prompt;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('ai_prompts')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getByCategory(category: string): Promise<AIPrompt[]> {
    const { data, error } = await this.client
      .from('ai_prompts')
      .select('*')
      .eq('category', category)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }
}
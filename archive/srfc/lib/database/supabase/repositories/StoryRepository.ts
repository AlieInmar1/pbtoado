import { SupabaseClient } from '@supabase/supabase-js';
import type { Story } from '../../../types/database';
import type { StoryRepository } from '../../types';

export class SupabaseStoryRepository implements StoryRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(workspaceId: string): Promise<Story[]> {
    const { data, error } = await this.client
      .from('stories')
      .select('*, story_splits(*)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Story | null> {
    const { data, error } = await this.client
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<Story>): Promise<Story> {
    const { data: story, error } = await this.client
      .from('stories')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return story;
  }

  async update(id: string, data: Partial<Story>): Promise<Story> {
    const { data: story, error } = await this.client
      .from('stories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return story;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('stories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  async getByWorkspace(workspaceId: string): Promise<Story[]> {
    const { data, error } = await this.client
      .from('stories')
      .select('*, story_splits(*)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getChildren(parentId: string): Promise<Story[]> {
    const { data, error } = await this.client
      .from('stories')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async updateSyncStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client
      .from('stories')
      .update({ sync_status: status })
      .eq('id', id);

    if (error) throw error;
  }

  async split(id: string, newStories: Partial<Story>[]): Promise<Story[]> {
    // Start a transaction
    const { data: originalStory } = await this.client
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (!originalStory) throw new Error('Story not found');

    // Create new stories
    const { data: stories, error: createError } = await this.client
      .from('stories')
      .insert(newStories.map(story => ({
        ...story,
        workspace_id: originalStory.workspace_id,
      })))
      .select();

    if (createError) throw createError;

    // Create split relationships
    await Promise.all(
      stories.map(story =>
        this.client
          .from('story_splits')
          .insert({
            original_story_id: id,
            split_story_id: story.id,
          })
      )
    );

    // Archive original story
    await this.client
      .from('stories')
      .update({
        status: 'archived',
        notes: `Split into:\n${stories.map(s => s.pb_title).join('\n')}`,
      })
      .eq('id', id);

    return stories;
  }
}
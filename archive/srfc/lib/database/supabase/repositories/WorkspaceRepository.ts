import { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace } from '../../../types/database';
import type { WorkspaceRepository } from '../../types';

export class SupabaseWorkspaceRepository implements WorkspaceRepository {
  private currentWorkspace: Workspace | null = null;

  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Workspace[]> {
    const { data, error } = await this.client
      .from('workspaces')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getById(id: string): Promise<Workspace | null> {
    const { data, error } = await this.client
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: Partial<Workspace>): Promise<Workspace> {
    const { data: workspace, error } = await this.client
      .from('workspaces')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return workspace;
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const { data: workspace, error } = await this.client
      .from('workspaces')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return workspace;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('workspaces')
      .delete()
      .eq('id', id);

    return !error;
  }

  getCurrentWorkspace(): Promise<Workspace | null> {
    return Promise.resolve(this.currentWorkspace);
  }

  setCurrentWorkspace(workspace: Workspace | null): void {
    this.currentWorkspace = workspace;
  }
}